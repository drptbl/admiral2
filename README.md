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

## API

|Name|METHOD|Params|Returns|Description|
|---|---|---|---|---|
|`/api/project`|GET||JSON Array|Gets the list of projects|
|`/api/project/:project`|POST|JSON Object with additional project data|JSON Object|Adds a new project|
|`/api/project/:project`|GET||JSON Object|Gets  the info on an existing project|
