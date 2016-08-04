import { Mongo } from 'meteor/mongo';

export const ProjectPhases = new Mongo.Collection('project_phases');

// ProjectPhases.createIndex({project: 1});
