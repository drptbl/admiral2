import React from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import { ProjectLink } from '../components/links';
import { TestRun } from '../../imports/api/test-run';

export class TestRunList extends React.Component {
  render() {
    return (
      <div>
        <h1><ProjectLink project={this.props.projectName}/> | {this.props.phase}</h1>
        {this.props.runs.map((run, index) => (
          <div key={index}>
            <a href={`/run/${run._id}`}>{run.name}</a>
          </div>
        ))}
      </div>
    );
  }
}

export const TestRunListContainer = createContainer(({ project, phase }) => {
  return {
    projectName: project,
    runs: TestRun.find({project_name: project, phase_name: phase}).fetch()
  };
}, TestRunList);
