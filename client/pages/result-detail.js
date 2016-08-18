import React from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import moment from 'moment';

import ResultTable from '../components/result-table';

import { Projects } from '../../imports/api/projects';
import { TestRun } from '../../imports/api/test-run';
import { TestResult } from '../../imports/api/test-result';

export class ResultDetail extends React.Component {
  render() {
    return (
      <div>
        <h1><a href={`/run/${this.props.run._id}`}>{this.props.run.name}</a> | {this.props.result.test}</h1>
        <h2>Details</h2>
        <h2>Test History</h2>
        <ResultTable
          results={this.props.history}
          project={this.props.project}
          headerElements={[
            <td width="20%">Phase</td>,
            <td width="25%">Run</td>,
            <td width="15%">Date</td>
          ]}
          browserColumnWidth={10}
          indexGenerator={(result) => result.run_start}
          rowElements={(result) => {
            return [
              <td>{result.phase_name}</td>,
              <td>{result.run_name}</td>,
              <td>{moment(result.run_start).format('M/D/YY - h:mm a')}</td>
            ];
          }}
          />
      </div>
    );
  }
}

export const ResultDetailContainer = createContainer(({ run, result }) => {
  const runObj = TestRun.findOne({_id: run});
  const resultObj = TestResult.findOne({_id: result});
  let history = [];
  let project = {};
  if (runObj && resultObj) {
    project = Projects.findOne(resultObj.project);
    history = TestResult.find({
      test: resultObj.test,
      project: resultObj.project
    }).fetch();
  }
  return {
    run: runObj || {},
    result: resultObj || {},
    project,
    history
  };
}, ResultDetail);
