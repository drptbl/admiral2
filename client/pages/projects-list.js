import React from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import { Projects } from '../../imports/api/projects';

export class ProjectsList extends React.Component {
  render() {
    return (
      <div>
        <h1>Projects</h1>
        {this.props.projects.map((project, index) => (
          <div key={index}>
            <a href={`/project/${project.name}`}>{project.name}</a>
          </div>
        ))}
      </div>
    );
  }
}

export const ProjectsListContainer = createContainer(() => {
  return {
    projects: Projects.find({}).fetch(),
  };
}, ProjectsList);
