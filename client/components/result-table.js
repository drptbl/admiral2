import React from 'react';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import ResultCell from './result-cell';

import { buildColumns } from '../utilities/environments';

const ResultTable = (props) => {
  const {columns, colWidth, sections} = buildColumns(props.project.environments || [
    "ie",
    "chrome",
    "safari",
    "ios"
  ]);
  const headerElements = props.headerElements.map((elem, index) => React.cloneElement(elem, {key: `header-${index}`}));

  return (
    <table width="100%" className="results-table">
      <thead>
        <tr>
          {headerElements.map((elem, index) => (
            <td key={`spacer-${index}`} />
          ))}
          {sections.map((sect, index) => (
            <td key={`section-${index}`} colSpan={sect.cols} style={{textAlign: 'center'}} className="browser">
              <i className={`fa ${sect.icon}`} />
            </td>
          ))}
        </tr>
        <tr>
          {headerElements}
          {columns.map((col, index) => (
            <td width={`${colWidth}%`} style={{textAlign: 'center'}} key={`title-${index}`}>
              {col.name}
            </td>
          ))}
        </tr>
      </thead>
      <ReactCSSTransitionGroup component="tbody" transitionName="example" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
        {props.results.map((result, index) => (
          <tr key={props.indexGenerator(result)}>
            {props.rowElements(result).map((elem, sindex) => React.cloneElement(elem, {key: `extra-columns-${sindex}-${index}`}))}
            {columns.map((col, cindex) => (
              <ResultCell result={result.environments[col.key]} key={`${index}-${cindex}`} />
            ))}
          </tr>
        ))}
      </ReactCSSTransitionGroup>
    </table>
  );
}


ResultTable.defaultProps = {
  browserColumnWidth: 15,
  indexGenerator: (result) => result.test
};

export default ResultTable;
