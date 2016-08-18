import React from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import { ProjectLink } from '../components/links';
import { Projects } from '../../imports/api/projects';
import { TestRun } from '../../imports/api/test-run';

const TestList = (props) => (
  <div>
    {props.tests.map((test, index) => (
      <div key={index}>{test.test}</div>
    ))}
  </div>
)

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
        {this.props.project ? (
          <div>
            <h2>Worst Tests</h2>
            <TestList tests={this.props.project.worstTests} />
          </div>
        ) : null}
      </div>
    );
  }
}

export const TestRunListContainer = createContainer(({ project, phase }) => {
  return {
    projectName: project,
    project: Projects.findOne({name: project}),
    runs: TestRun.find({project_name: project, phase_name: phase}).fetch()
  };
}, TestRunList);
