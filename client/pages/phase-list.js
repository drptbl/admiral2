import React from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import { ProjectPhases } from '../../imports/api/project-phases';

export class PhaseList extends React.Component {
  render() {
    return (
      <div>
        <h1>{this.props.project}</h1>
        {this.props.phases.map((phase, index) => (
          <div key={index}>
            <a href={`/project/${this.props.project}/${phase.name}`}>{phase.name}</a>
          </div>
        ))}
      </div>
    );
  }
}

export const PhaseListContainer = createContainer(({ project }) => {
  return {
    project,
    phases: ProjectPhases.find({project_name: project}).fetch()
  };
}, PhaseList);
