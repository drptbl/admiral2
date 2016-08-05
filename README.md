# admiral2
Beautiful dashboards for visualizing functional test results.

## Install

```
% npm Install
% meteor update
```

## Run

```
% meteor
```

## Terminonology

|Term|Definition|
|---|---|
|Project|A project to be tested.|
|Phase|The phase of development associated with a project. For example; `pr-verify` or `nightly-build`|
|Test Run|The run of a suite of tests. Probably triggered by a new PR, or on a cron job.|
|Test Result|The result of a single test. A test run will contain multiple test results.|
|Step|There are multiple steps in a test run. For example; git clone, npm install, build, npm test, etc.|
|State|The state of a test run indicates which step it's currently processing through.|
|Metric|A metric is a keyed numeric value associated with a test run. It can be anything you want, for example, the length of time to `npm install` or the `average number of retry attempts`.|

## API

|Name|METHOD|Params|Returns|Description|
|---|---|---|---|---|
|`/api/project`|GET||JSON Array|Gets the list of projects|
|`/api/project/:project`|POST|JSON Object with additional project data|JSON Object|Adds a new project. POST'ing to this multiple times will *not* create multiple projects of the same name. The same project will be returned each time.|
|`/api/project/:project`|GET||JSON Object|Gets the info on an existing project|
|`/api/project/:project/:phase`|POST||JSON Object|Adds a new project phase. POST'ing to this multiple times will *not* create multiple project phases of the same name. The same project phase will be returned each time.|
|`/api/project/:project/:phase`|GET||JSON Object|Gets the info on an existing phase of a project|
|`/api/project/:project/:phase/run`|POST|JSON object with additional data for the test run|JSON Object|Starts a new test run. The result includes the `_id` that you should use for subsequent calls.|
|`/api/project/:project/:phase/run/:run`|PUT|Additional run data|JSON Object|Updates the run with additional data|
|`/api/project/:project/:phase/run/:run/state?state=:state`|POST||JSON Object|Sets the current state of the run|
|`/api/project/:project/:phase/run/:run/metric?metric=:metric&value=:value`|POST||JSON Object|Updates the test run with any metric value you want.|
|`/api/result/:run`|POST|JSON Object with Test Results|JSON Object|Adds a test result to the test run. Tests are keyed by the `test` key which is a string. If you POST twice with the same `test` to the same `run` it will update the results object.|

## Licenses

All code not otherwise specified is Copyright Wal-Mart Stores, Inc.
Released under the [MIT](./LICENSE) License.
