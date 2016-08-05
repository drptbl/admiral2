import React from 'react';

const ResultCell = (props) => (
  <td className={`result ${props.result}`} style={{textAlign: "center"}}>
    {props.result === 'pending' ? <img src="/spin.gif" style={{width: 25, height: 25}}></img> : null}
    {props.result === 'pass' ? <i className="glyphicon glyphicon-ok"></i> : null}
    {props.result === 'fail' ? <i className="glyphicon glyphicon-remove"></i> : null}
    {props.result === 'retry' ? <i className="glyphicon glyphicon-refresh"></i> : null}
  </td>
);

export default ResultCell;
