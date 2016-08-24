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

import ComponentGraph from './components/component-graph';

class TestPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      components: {
        login: {
          testCount: 3,
          passed: 2,
          failed: 0,
          x: 0,
          active: true
        },
        cart: {
          connectsTo: ["login"],
          testCount: 3,
          passed: 0,
          failed: 2,
          x: 1,
          active: true
        },
        landing: {
          connectsTo: ["cart"],
          testCount: 5,
          passed: 1,
          failed: 1,
          x: 2
        },
        payment: {
          connectsTo: ["landing"],
          testCount: 5,
          passed: 4,
          failed: 0,
          x: 3
        },
        address: {
          connectsTo: ["landing"],
          testCount: 4,
          passed: 3,
          failed: 0,
          x: 3
        },
        thankYou: {
          connectsTo: ["payment", "address"],
          testCount: 1,
          passed: 1,
          failed: 0,
          x: 4
        }
      }
    }
  }
  _onClick() {
    this.state.components.login.active = true;
    this.state.components.thankYou.active = true;
    this.setState({
      components: this.state.components
    });
  }
  render() {
    return (
      <div>
        <ComponentGraph
          components={this.state.components} />
        <button onClick={() => this._onClick()}>Change</button>
      </div>
    )
  }
}

Meteor.startup(() => {
  const _render = (component) => {
    render(<Layout>{component}</Layout>,
      document.getElementById('app'));
  }

  Router.route('/', function () {
    _render(<ProjectsListContainer />);
  });

  Router.route('/test', function () {
    _render(<TestPage />);
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
