import React from 'react';

export const ProjectLink = (props) => (
  <a href={`/project/${props.project}`}>{props.project}</a>
);

export const PhaseLink = (props) => (
  <a href={`/project/${props.project}/${props.phase}`}>{props.phase}</a>
);
