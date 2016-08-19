import React from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import { ProjectPhases } from '../../imports/api/project-phases';
import { Projects } from '../../imports/api/projects';

const TestList = (props) => (
  <div>
    {props.tests.reverse().map((test, index) => (
      <div key={index}>{test.test}</div>
    ))}
  </div>
)

export class PhaseList extends React.Component {
  render() {
    return (
      <div>
        <h1>{this.props.projectName}</h1>
        {this.props.phases.map((phase, index) => (
          <div key={index}>
            <a href={`/project/${this.props.projectName}/${phase.name}`}>{phase.name}</a>
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

export const PhaseListContainer = createContainer(({ project }) => {
  return {
    projectName: project,
    project: Projects.findOne({name: project}),
    phases: ProjectPhases.find({project_name: project}).fetch()
  };
}, PhaseList);
