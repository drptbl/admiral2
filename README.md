# admiral2
Beautiful dashboards for visualizing functional test results.

## Install

```
% npm install
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
|`/api/project/:project/:phase/run/:run/step?step=:step`|POST||JSON Object|Sets the current step of the run|
|`/api/project/:project/:phase/run/:run/metric?metric=:metric&value=:value`|POST||JSON Object|Updates the test run with any metric value you want.|
|`/api/result/:run`|POST|JSON Object with Test Results|JSON Object|Adds a test result to the test run. Tests are keyed by the `test` key which is a string. If you POST twice with the same `test` to the same `run` it will update the results object.|

## API Usage

The sections that follow discuss the usual API workflows and how the API works in those scenarios.

### Creating a project

To track test results in Admiral 2 you need to associate them with a `project`, `project phase`, and `test run`. This is the hierarchy:

`project` -> `project phase` -> `test run` -> `test result`

So to start collection results you have to first create the `project`, then the `project phase`, and finally start a `test run`.

To create a project POST to `/api/project/<project name>`. You can leave the body of the post empty, or you can associate as much data as you like with the project by encoding a JSON object in the body of the request. Shown below is an example `curl`
 command:

```
% curl -H "Content-Type: application/json" -X POST http://admiral:3000/api/project/foo
```

This will create a new project named `foo`.

If you want to associate some data with the project do something like this:

```
% curl -H "Content-Type: application/json" -X POST -d '{"name": "The Foo Project"}' http://admiral:3000/api/project/foo
```

This adds a custom key called `name` to the project with the value `The Foo Project`.

If you want you can associate `steps` with a project, more on what steps are and why they are important below.

It's important to note that you can POST to `/api/project/:project` over and over again and it will not create a new project each time. It will only create a project the first time, after that it updates the project, the same way as a PUT.

### Steps and why they are important

Running tests against a project usually requires some setup before the tests can be run. This includes things like pulling down the code, compiling or building, running unit tests and so on. The term we have given these discrete units of work is `steps`, and the `steps` required to setup and test a project are defined at the `project` level in a JSON array called `steps`.

An example of steps would be something like:

```
{
  steps: [
    {id: "git", name: "Git Pull"},
    {id: "npm-install", name: "npm install"},
    {id: "npm-build", name: "npm build"},
    {id: "start", name: "test start"},
    {id: "end", name: "test end"}
  ]
}
```

This would be sent in the `POST` body of the REST call to `/api/projects/<project name>` and then referred to by id in the subsequent calls to `/api/project/:project/:phase/run/:run/step` which is where the test system can indicate what step is currently being run.

### Creating a project phase

Every project has multiple project `phases`. Example phases are `pr-verify` or `nightly`. These indicate the various phases of product development that are associated with the tests, and you make have different policies for the impact of a test failure on the `nightly build` versus the a `PR verify`. So that's why we separate those results in the hierarchy.

To create a project phase POST to `/api/project/<project name>/<project phase>`.

Just like the `/api/project/<project name>` API you can POST to this multiple times but it will only create the phase the first time.

Here is an example CURL to this API:

```
% curl -H "Content-Type: application/json" -X POST http://admiral:3000/api/project/foo/pr-verify
```

This creates a `pr-verify` phase on the `foo` project.

## Licenses

All code not otherwise specified is Copyright Wal-Mart Stores, Inc.
Released under the [MIT](./LICENSE) License.
