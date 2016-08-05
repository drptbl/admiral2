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
      _setBuilder(input[k], output, `${k}.`);
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
        data.name = this.params.project;
        const project = Projects.insert(data);
        _jsonResponse(this.response, {_id: project});
      }
    })
    .get(function () {
      const found = Projects.findOne({name: this.params.project});
      _jsonResponse(this.response, found ? found : null);
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
        this.request.body.project = info.project._id;
        this.request.body.project_name = this.params.project;
        this.request.body.phase = info.phase._id;
        this.request.body.phase_name = this.params.phase;
        this.request.body.start = new Date();
        this.request.body.stepTimes = {};
        this.request.body.metric = this.request.body.metric || {};
        const trId = TestRun.insert(this.request.body);
        _jsonResponse(this.response, {_id: trId});
      }
    });

  // Updates a test run
  Router.route('/api/project/:project/:phase/run/:run', {where: 'server'})
    .put(function () {
      const run = TestRun.findOne({_id: this.params.run});
      if (run) {
        const setObj = {}
        _setBuilder(this.request.body, setObj, '');
        TestRun.update(run._id, {"$set": setObj});
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
        const setObj = {}
        _setBuilder(this.request.body, setObj, '');
        TestResult.update(result._id, {"$set": setObj});
        _jsonResponse(this.response, TestResult.findOne({_id: result._id}));
      } else {
        this.request.body.run = testRun._id;
        this.request.body.run_start = testRun.start;
        this.request.body.run_name = testRun.name;
        this.request.body.project = testRun.project;
        this.request.body.project_name = testRun.project_name;
        this.request.body.phase = testRun.phase;
        this.request.body.phase_name = testRun.phase_name;

        const newId = TestResult.insert(this.request.body);

        this.request.body._id = newId;
        _jsonResponse(this.response, this.request.body);
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
