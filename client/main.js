import { Meteor } from 'meteor/meteor';
import React from 'react';
import { render } from 'react-dom';
import { Router } from 'meteor/iron:router';

import Layout from './pages/layout';

import { ProjectsListContainer } from './pages/projects-list';
import { PhaseListContainer } from './pages/phase-list';
import { TestRunListContainer } from './pages/test-run-list';
import { RunReportContainer } from './pages/run-report';
import { ResultDetailContainer } from './pages/result-detail';

Meteor.startup(() => {
  const _render = (component) => {
    render(<Layout>{component}</Layout>,
      document.getElementById('app'));
  }
  
  Router.route('/', function () {
    _render(<ProjectsListContainer />);
  });

  Router.route('/project/:project', {
    action: function () {
      _render(<PhaseListContainer project={this.params.project} />);
    }
  });

  Router.route('/project/:project/:phase', {
    action: function () {
      _render(<TestRunListContainer project={this.params.project} phase={this.params.phase} />);
    }
  });

  Router.route('/run/:id', {
    action: function () {
      _render(<RunReportContainer run={this.params.id} />);
    }
  });

  Router.route('/run/:run/:result', {
    action: function () {
      _render(<ResultDetailContainer run={this.params.run} result={this.params.result} />);
    }
  });
});
