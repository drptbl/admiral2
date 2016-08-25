import React from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import moment from 'moment';
import _ from 'lodash';

import ResultTable from '../components/result-table';
import { ProjectLink, PhaseLink } from '../components/links';
import ResultCell from '../components/result-cell';
import ComponentGraph from '../components/component-graph';

import { Projects } from '../../imports/api/projects';
import { TestRun } from '../../imports/api/test-run';
import { TestResult } from '../../imports/api/test-result';
import { buildColumns } from '../utilities/environments';

const _time = (val) => {
  if (val < 1000) {
    return `${val}ms`;
  } else {
    const seconds = Math.floor((val / 100)) / 10.0;
    return `${seconds}s`
  }
}

const _isRunning = (test) => {
  for (var k in test.environments) {
    if (test.environments[k].status === 'started') {
      return true;
    }
  }
  return false;
}

const _hasResults = (test) => {
  for (var k in test.environments) {
    if (test.environments[k].status === 'fail' || test.environments[k].status === 'pass') {
      return true;
    }
  }
  return false;
}

const _failed = (test) => {
  for (var k in test.environments) {
    if (test.environments[k].status === 'fail') {
      return true;
    }
  }
  return false;
}

export class RunReport extends React.Component {
  _steps() {
    if (!this.props.project || !this.props.project.steps) {
      return null;
    }

    let done = 0;
    let lastTime = Date.parse(this.props.run.start);
    const times = {};
    for (var i in this.props.project.steps) {
      if (this.props.project.steps[i].id == this.props.run.step) {
        done = i;
      }
      let currentTime = this.props.run.stepTimes[this.props.project.steps[i].id];
      if (currentTime) {
        times[i] = currentTime - lastTime;
        lastTime = currentTime;
      }
    }
    return (
      <div>
        {
          this.props.project.steps.map((step, index) => {
            return (
              <span key={index} className="process-step">
                <i className={`fa fa-${index <= done ? 'check-circle-o done' : 'circle-thin'}`} />
                &nbsp;{step.name}&nbsp;
                {times[index] ? <span className="time">{`(${_time(times[index])})`}&nbsp;</span> : null}
              </span>
            );
          })
        }
      </div>
    );
  }

  _componentGraph() {
    if (!this.props.project || !this.props.project.components) {
      return null;
    }

    const running = [];
    const active = {};
    const passed = {};
    const failed = {};

    const _add = (obj, key) => {
      if (obj[key] === undefined) {
        obj[key] = 0;
      }
      obj[key] += 1;
    }
    const _addArray = (obj, arr) => {
      for (let k of arr || []) {
        _add(obj, k);
      }
    };

    const testCount = {};
    for (let test of this.props.project.tests) {
      _addArray(testCount, test.components);
    }

    for (let test of this.props.results) {
      if (_isRunning(test)) {
        running.push(test.test);
        for (let comp of test.components || []) {
          active[comp] = true;
        }
      } else {
        if (_hasResults(test)) {
          if (_failed(test)) {
            _addArray(failed, test.components);
          } else {
            _addArray(passed, test.components);
          }
        }
      }
    }

    const comps = _.cloneDeep(this.props.project.components);
    for (let k in comps) {
      comps[k].testCount = testCount[k];
      comps[k].failed = failed[k] || 0;
      comps[k].passed = passed[k] || 0;
      comps[k].active = active[k] || false;
    }

    return (
      <div>
        <ComponentGraph components={comps} height={100} />
      </div>
    );
  }

  _findEnvironments() {
    const envs = {};
    for (let res of this.props.results) {
      for (var k of res.environments) {
        envs[k] = true;
      }
    }
    return _.keys(envs);
  }

  render() {
    const {columns, colWidth, sections} = buildColumns(this.props.project.environments || this._findEnvironments());

    const sortedResults = this.props.results.sort((a, b) => {
      let score_a = 0;
      for (var k in a.environments) {
        score_a += a.environments[k].status === 'fail' ? 3 : 0;
        score_a += a.environments[k].status === 'pass' ? a.environments[k].retryCount * 0.2 : 0;
      }
      let score_b = 0;
      for (var k in b.environments) {
        score_b += b.environments[k].status === 'fail' ? 3 : 0;
        score_b += b.environments[k].status === 'pass' ? b.environments[k].retryCount : 0;
      }
      if (score_a > score_b) {
        return -1;
      } else if (score_b > score_a) {
        return 1;
      } else {
        return 0;
      }
    });

    return (
      <div>
        <h1><ProjectLink project={this.props.run.project_name}/> |&nbsp;
          <PhaseLink project={this.props.run.project_name} phase={this.props.run.phase_name} /> |&nbsp;
          {this.props.run.name}</h1>
        {this.props.run ? <div>Started {moment(this.props.run.start).format('M/D/YY - h:mm a')}</div> : null}
        {this._steps()}
        {this.props.project && sortedResults.length > 0 ? this._componentGraph() : null}
        <table width="100%" className="results-table">
          <thead>
            <tr>
              <td width="40%" />
              {sections.map((sect, index) => (
                <td key={`section-${index}`} colSpan={sect.cols} style={{textAlign: 'center'}} className="browser">
                  <i className={`fa ${sect.icon}`} />
                </td>
              ))}
            </tr>
            <tr>
              <td>
                Test name
              </td>
              {columns.map((col, index) => (
                <td width={`${colWidth}%`} style={{textAlign: 'center'}} key={`title-${index}`}>
                  {col.name}
                </td>
              ))}
            </tr>
          </thead>
          <ReactCSSTransitionGroup component="tbody" transitionName="example" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
            {sortedResults.map((result, index) => (
              <tr key={`${result.test}-${index}`}>
                <td>
                  <a href={`/run/${this.props.run._id}/${result._id}`}>{result.test}</a>
                </td>
                {columns.map((col, cindex) => (
                  <ResultCell result={result.environments[col.key]} key={`${index}-${cindex}`} />
                ))}
              </tr>
            ))}
          </ReactCSSTransitionGroup>
        </table>
      </div>
    );
  }
}

export const RunReportContainer = createContainer(({ run }) => {
  const runObj = TestRun.findOne({_id: run});
  let project = {steps: []};
  if (runObj) {
    project = Projects.findOne(runObj.project);
  }
  return {
    project,
    run: TestRun.findOne({_id: run}) || {_id: ""},
    results: TestResult.find({run: run}).fetch() || []
  };
}, RunReport);
