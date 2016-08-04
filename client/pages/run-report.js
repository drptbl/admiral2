import React from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import moment from 'moment';

import ResultTable from '../components/result-table';
import { ProjectLink, PhaseLink } from '../components/links';
import ResultCell from '../components/result-cell';

import { Projects } from '../../imports/api/projects';
import { TestRun } from '../../imports/api/test-run';
import { TestResult } from '../../imports/api/test-result';

const _time = (val) => {
  if (val < 1000) {
    return `${val}ms`;
  } else {
    const seconds = Math.floor((val / 100)) / 10.0;
    return `${seconds}s`
  }
}

export class RunReport extends React.Component {
  _steps() {
    let done = 0;
    let lastTime = Date.parse(this.props.run.start);
    const times = {};
    for (var i in this.props.project.steps) {
      if (this.props.project.steps[i].id == this.props.run.state) {
        done = i;
      }
      let currentTime = this.props.run.stateTimes[this.props.project.steps[i].id];
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
  render() {
    const sortedResults = this.props.results.sort((a, b) => {
      let fails_a = 0;
      for (var k in a.environments) {
        fails_a += a.environments[k] === 'fail' ? 1 : 0;
      }
      let fails_b = 0;
      for (var k in b.environments) {
        fails_b += b.environments[k] === 'fail' ? 1 : 0;
      }
      if (fails_a > fails_b) {
        return -1;
      }
      if (fails_b > fails_a) {
        return 1;
      }

      if (a.test < b.test) {
        return -1;
      } else if (a.test > b.test) {
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
        <table width="100%" className="results-table">
          <thead>
            <tr>
              <td width="40%">
                Test name
              </td>
              <td width="15%" style={{textAlign: 'center'}} className="browser">
                <i className="fa fa-internet-explorer"></i>
              </td>
              <td width="15%" style={{textAlign: 'center'}} className="browser">
                <i className="fa fa-chrome"></i>
              </td>
              <td width="15%" style={{textAlign: 'center'}} className="browser">
                <i className="fa fa-safari"></i>
              </td>
              <td width="15%" style={{textAlign: 'center'}} className="browser">
                <i className="fa fa-apple"></i>
              </td>
            </tr>
          </thead>
          <ReactCSSTransitionGroup component="tbody" transitionName="example" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
            {sortedResults.map((result, index) => (
              <tr key={result.test}>
                <td>
                  <a href={`/run/${this.props.run._id}/${result._id}`}>{result.test}</a>
                </td>
                <ResultCell result={result.environments.ie} />
                <ResultCell result={result.environments.chrome} />
                <ResultCell result={result.environments.safari} />
                <ResultCell result={result.environments.ios} />
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
    run: TestRun.findOne({_id: run}) || {},
    results: TestResult.find({run: run}).fetch() || []
  };
}, RunReport);
