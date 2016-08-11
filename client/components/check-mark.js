import React from 'react';

let CheckMarkIndex = 1;
const CheckMark = (props) => {
  const cropSize = (parseFloat(props.retryCount) / parseFloat(props.maxRetries)) * props.height;
  const clippingID = `CheckMark-${CheckMarkIndex}`;
  CheckMarkIndex++;
  return (
    <svg width={props.width} height={props.height}>
      <defs>
        <clipPath id={clippingID}>
          <rect x={0} y={props.height - cropSize} width={props.width} height={props.height} />
        </clipPath>
      </defs>
      <text y={props.height - 2} x={-1} fill={props.goodColor} fontFamily={props.iconFont}
        fontSize={props.fontSize} dangerouslySetInnerHTML={{__html: `&#x${props.checkMark};`}} />
      <text y={props.height - 2} x={-1} fill={props.badColor} fontFamily={props.iconFont}
        fontSize={props.fontSize}
        clipPath={`url(#${clippingID})`}
        dangerouslySetInnerHTML={{__html: `&#x${props.checkMark};`}}/>
    </svg>
  );
};

CheckMark.defaultProps = {
  fontSize: 40,
  width: 40,
  height: 29,
  retryCount: 0,
  maxRetries: 3,
  checkMark: 'f00c',
  goodColor: 'green',
  badColor: 'red',
  iconFont: 'FontAwesome'
};

export default CheckMark;
