import React from 'react';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import ResultCell from './result-cell';

const ResultTable = (props) => (
  <table width="100%" className="results-table">
    <thead>
      <tr>
        {props.headerElements.map((elem, index) => React.cloneElement(elem, {key: `header-${index}`}))}
        <td width={`${props.browserColumnWidth}%`} style={{textAlign: "center"}} className="browser">
          <i className="fa fa-internet-explorer"></i>
        </td>
        <td width={`${props.browserColumnWidth}%`} style={{textAlign: "center"}} className="browser">
          <i className="fa fa-chrome"></i>
        </td>
        <td width={`${props.browserColumnWidth}%`} style={{textAlign: "center"}} className="browser">
          <i className="fa fa-safari"></i>
        </td>
        <td width={`${props.browserColumnWidth}%`} style={{textAlign: "center"}} className="browser">
          <i className="fa fa-apple"></i>
        </td>
      </tr>
    </thead>
    <ReactCSSTransitionGroup component="tbody" transitionName="example" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
      {props.results.map((result, index) => (
        <tr key={props.indexGenerator(result)}>
          {props.rowElements(result).map((elem, sindex) => React.cloneElement(elem, {key: `extra-columns-${sindex}-${index}`}))}
          <ResultCell result={result.environments.ie} />
          <ResultCell result={result.environments.chrome} />
          <ResultCell result={result.environments.safari} />
          <ResultCell result={result.environments.ios} />
        </tr>
      ))}
    </ReactCSSTransitionGroup>
  </table>
);

ResultTable.defaultProps = {
  browserColumnWidth: 15,
  indexGenerator: (result) => result.test
};

export default ResultTable;
