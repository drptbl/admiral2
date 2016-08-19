import { Meteor } from 'meteor/meteor';
import { CollectionAPI } from 'meteor/xcv58:collection-api';
import { WebApp } from 'meteor/webapp';
import { RoutePolicy } from 'meteor/routepolicy';
import { Router } from 'meteor/iron:router';

import { Projects } from '../imports/api/projects';
import { ProjectPhases } from "../imports/api/project-phases";
import { TestRun } from "../imports/api/test-run";
import { TestResult } from "../imports/api/test-result";

import _ from 'lodash';

var stats = require("stats-lite");

const _createScore = (result) => {
  let score = 0;
  let envCount = 0;
  for (var k in result.environments) {
    score += result.environments[k].status === 'fail' ? 3 : 0;
    score += result.environments[k].status === 'pass' ? result.environments[k].retryCount * 0.2 : 0;
    envCount++;
  }
  result.score = score;
  result.normalizedScore = envCount > 0 ? parseFloat(score) / parseFloat(envCount) : 0;
};

const _updateScore = (id) => {
  const result = TestResult.findOne({_id: id});
  result.environments = result.environments || {};
  _createScore(result);
  TestResult.update(result._id, {"$set": {
    score: result.score,
    normalizedScore: result.normalizedScore
  }});
  return result;
}

const _updateAnalytics = (project) => {
  const results = TestResult.find({project: project._id}).fetch();
  const scores = [];

  const scoreSets = {};
  for (let result of results) {
    _createScore(result);
    TestResult.update(result._id, {"$set": {
      score: result.score,
      normalizedScore: result.normalizedScore
    }});
    scores.push(result.score);
    if (scoreSets[result.test] === undefined) {
      scoreSets[result.test] = {
        test: result.test,
        scores: [],
        stdevs: []
      };
    }
    scoreSets[result.test].scores.push(result.score);
  }

  const mean = stats.mean(scores);
  const stddev = stats.stdev(scores);
  for (let result of results) {
    scoreSets[result.test].stdevs.push((result.score - mean) / stddev);
  }

  let worstTests = [];

  for (let k in scoreSets) {
    scoreSets[k].overall = {
      mean: stats.mean(scoreSets[k].scores),
      stddev: stats.stdev(scoreSets[k].scores),
    };
    if (scoreSets[k].overall.stddev > 1) {
      worstTests.push(scoreSets[k]);
    }
  }

  worstTests = worstTests.sort((a, b) => {
    if (a.overall.stddev < b.overall.stddev) {
      return -1;
    } else if (a.overall.stddev > b.overall.stddev) {
      return 1;
    } else {
      return 0;
    }
  }).slice(worstTests.length < 5 ? 0 : worstTests.length - 5);

  project.testScores = scoreSets;
  project.worstTests = worstTests;
  Projects.update(project._id, {"$set":
    {
      testScores: project.testScores,
      worstTests: project.worstTests
    }
  });
}

const _jsonResponse = (res, data) => {
  const body = JSON.stringify(data);
  res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'));
  res.setHeader('Content-Type', 'application/json');
  res.write(body);
  res.end();
}

const _setBuilder = (input, output, parent) => {
  for (var k in input) {
    if (_.isObject(input[k])) {
      _setBuilder(input[k], output, `${parent}${k}.`);
    } else {
      output[`${parent ? parent : ''}${k}`] = input[k];
    }
  }
}

const _findPhase = (prName, phName, res) => {
  const project = Projects.findOne({name: prName});
  if (!project) {
    _jsonResponse(res, {error: "Bad project name"});
    return null;
  }
  const phase = ProjectPhases.findOne({project: project._id, name: phName});
  if (!phase) {
    _jsonResponse(res, {error: "Bad phase name"});
    return null;
  }
  return {
    project,
    phase
  };
}

Meteor.startup(() => {
  ProjectPhases._ensureIndex({ "project": 1 });
  TestRun._ensureIndex({ "project": 1, "phase": 1 });
  TestResult._ensureIndex({ "run": 1 });

  // Gets all the projects
  Router.route('/api/reset', {where: 'server'})
    .post(function () {
      Projects.remove({});
      ProjectPhases.remove({});
      TestRun.remove({});
      TestResult.remove({});
      _jsonResponse(this.response, {reset: true});
    })

  // Gets all the projects
  Router.route('/api/project', {where: 'server'})
    .get(function () {
      const rows = Projects.find({}).fetch();
      _jsonResponse(this.response, rows);
    });

  // Gets project info
  Router.route('/api/project/:project', {where: 'server'})
    .post(function () {
      const found = Projects.findOne({name: this.params.project});
      if (found) {
        _jsonResponse(this.response, found);
      } else {
        const data = this.request.body || {};
        data.created = new Date();
        data.updated = new Date();
        data.name = this.params.project;
        const project = Projects.insert(data);
        _jsonResponse(this.response, {_id: project});
      }
    })
    .get(function () {
      const found = Projects.findOne({name: this.params.project});
      _jsonResponse(this.response, found ? found : null);
    });

  // Gets project info
  Router.route('/api/project/:project/analytics', {where: 'server'})
    .post(function () {
      let project = Projects.findOne({name: this.params.project});
      _updateAnalytics(project);
      project = Projects.findOne({name: this.params.project});
      _jsonResponse(this.response, project);
    });

  // Gets the phase info
  Router.route('/api/project/:project/:phase', {where: 'server'})
    .get(function () {
      const project = Projects.findOne({name: this.params.project});
      if (!project) {
        _jsonResponse(this.response, {error: "Bad project name"});
        return;
      }
      const phase = ProjectPhases.findOne({project: project.id, name: this.params.phase});
      _jsonResponse(this.response, phase ? phase : null);
    })
    .post(function () {
      const project = Projects.findOne({name: this.params.project});
      if (!project) {
        _jsonResponse(this.response, {error: "Bad project name"});
        return;
      }

      const phase = ProjectPhases.findOne({project: project._id, name: this.params.phase});
      if (phase) {
        _jsonResponse(this.response, phase);
      } else {
        const newPhase = ProjectPhases.insert({
          created: new Date(),
          updated: new Date(),
          project: project._id,
          project_name: this.params.project,
          name: this.params.phase
        })
        _jsonResponse(this.response, {_id: newPhase});
      }
    });

  // Adds a test run
  Router.route('/api/project/:project/:phase/run', {where: 'server'})
    .post(function () {
      const info = _findPhase(this.params.project, this.params.phase, this.response);
      if (info) {
        let data = this.request.body;
        data.created = new Date();
        data.updated = new Date();
        data.status = "running";
        data.project = Projects.findOne({name: this.params.project})._id;
        data.project_name = this.params.project;
        data.phase = info.phase._id;
        data.phase_name = this.params.phase;
        data.start = new Date();
        data.stepTimes = {};
        data.metric = data.metric || {};
        const trId = TestRun.insert(data);
        _jsonResponse(this.response, {_id: trId});
      }
    });

  // Updates a test run
  Router.route('/api/project/:project/:phase/run/:run', {where: 'server'})
    .put(function () {
      const run = TestRun.findOne({_id: this.params.run});
      if (run) {
        const setObj = {}
        setObj.updated = new Date();
        _setBuilder(this.request.body, setObj, '');
        TestRun.update(run._id, {"$set": setObj});
        _jsonResponse(this.response, TestRun.findOne({_id: this.params.run}));
      } else {
        _jsonResponse(this.response, {error: "Test run not found"});
      }
    });

  // Finishes the run
  Router.route('/api/project/:project/:phase/run/:run/finish', {where: 'server'})
    .post(function () {
      const run = TestRun.findOne({_id: this.params.run});
      const setObj = {};
      setObj.updated = new Date();
      setObj.status = "finished";
      if (run) {
        TestRun.update(run._id, {"$set": setObj});
        _updateAnalytics(Projects.findOne(run.project));
        _jsonResponse(this.response, TestRun.findOne({_id: this.params.run}));
      } else {
        _jsonResponse(this.response, {error: "Test run not found"});
      }
    });

  // Sets the run step
  Router.route('/api/project/:project/:phase/run/:run/step', {where: 'server'})
    .post(function () {
      const run = TestRun.findOne({_id: this.params.run});
      const setObj = {};
      setObj.updated = new Date();
      setObj.step = this.params.query.step;
      setObj[`stepTimes.${this.params.query.step}`] = new Date();
      if (run) {
        TestRun.update(run._id, {"$set": setObj});
        _jsonResponse(this.response, TestRun.findOne({_id: this.params.run}));
      } else {
        _jsonResponse(this.response, {error: "Test run not found"});
      }
    });

  // Sets a metric value
  Router.route('/api/project/:project/:phase/run/:run/metric', {where: 'server'})
    .post(function () {
      const run = TestRun.findOne({_id: this.params.run});
      if (run) {
        const setObj = {};
        setObj.updated = new Date();
        setObj[`metric.${this.params.query.metric}`] = this.params.query.value;
        TestRun.update(run._id, {"$set": setObj});
        _jsonResponse(this.response, TestRun.findOne({_id: this.params.run}));
      } else {
        _jsonResponse(this.response, {error: "Test run not found"});
      }
    });

  Router.route('/api/result/:run', {where: 'server'})
    .post(function () {
      if (!this.request.body || !this.request.body.test) {
        _jsonResponse(this.response, {error: "No test specified"});
        return;
      }

      const testRun = TestRun.findOne({_id: this.params.run});
      if (!testRun) {
        _jsonResponse(this.response, {error: "Invalid test run"});
        return;
      }

      const result = TestResult.findOne({
        run: testRun._id,
        test: this.request.body.test
      });
      if (result) {
        let data = this.request.body;
        data.updated = new Date();
        const setObj = {};
        _setBuilder(data, setObj, '');

        TestResult.update(result._id, {"$set": setObj});

        _updateScore(result._id);

        _jsonResponse(this.response, TestResult.findOne({_id: result._id}));
      } else {
        let data = this.request.body;
        data.created = new Date();
        data.updated = new Date();
        data.run = testRun._id;
        data.run_start = testRun.start;
        data.run_name = testRun.name;
        data.project = testRun.project;
        data.project_name = testRun.project_name;
        data.phase = testRun.phase;
        data.phase_name = testRun.phase_name;

        const newId = TestResult.insert(data);

        this.request.body._id = newId;

        data = _updateScore(newId);

        _jsonResponse(this.response, data);
      }
    });

  collectionApi = new CollectionAPI({
    authToken: undefined,
    apiPath: 'rest',
    standAlone: false,
    allowCORS: true,
    sslEnabled: false,
    listenPort: 3005,
    listenHost: undefined
  });

  collectionApi.addCollection(Projects, 'projects', {methods: ['GET']});
  collectionApi.addCollection(ProjectPhases, 'projectPhases', {methods: ['GET']});
  collectionApi.addCollection(TestRun, 'testRuns', {methods: ['GET']});
  collectionApi.addCollection(TestResult, 'testResult', {methods: ['GET']});

  // Starts the API server
  collectionApi.start();
});
