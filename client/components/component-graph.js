import React from 'react';
import * as d3 from 'd3';

let _clipIndex = 0;

export default class ComponentGraph extends React.Component {
  constructor(props) {
    super(props);

    const nodes = [];
    const nodeByName = {};
    let countMin = 1000;
    let countMax = 0;
    let index = 0;
    let maxX = 0;
    for (let k in props.components) {
      let xHint = props.components[k].x || index;
      let node = {
        name: k,
        connectsTo: props.components[k].connectsTo,
        testCount: props.components[k].testCount,
        failed: props.components[k].failed,
        passed: props.components[k].passed,
        active: props.components[k].active,
        xHint,
        x: 0,
        y: 0
      };
      if (xHint > maxX) {
        maxX = xHint;
      }
      if (props.components[k].testCount < countMin) {
        countMin = props.components[k].testCount;
      }
      if (props.components[k].testCount > countMax) {
        countMax = props.components[k].testCount;
      }
      nodes.push(node);
      nodeByName[k] = node;
      index++;
    }
    const countScale = d3.scaleLinear().domain([countMin, countMax]).range([10, 20]);
    const links = [];
    for (let source of nodes) {
      source.r = countScale(source.testCount);
      for (let targetName of source.connectsTo || []) {
        links.push({
          source,
          target: nodeByName[targetName]
        });
      }
    }

    this.state = {
      nodes,
      links,
      maxX,
      nodeByName
    };
  }

  componentWillReceiveProps(props) {
    console.log(props.components);
    if (props.components) {
      for (let k in props.components) {
        this.state.nodeByName[k].failed = props.components[k].failed;
        this.state.nodeByName[k].passed = props.components[k].passed;
        this.state.nodeByName[k].active = props.components[k].active;
      }
      this.setState({nodes: this.state.nodes});
    }
  }

  componentDidMount() {
    const maxWidth = this.props.width * 0.8;
    const xScale = maxWidth / this.state.maxX;
    const xStart = (this.props.width / 2 ) - (maxWidth / 2);
    this.force = d3.forceSimulation(this.state.nodes)
      .force("charge",
        d3.forceManyBody()
          .strength(this.props.forceStrength)
      )
      .force("link",
        d3.forceLink().distance(this.props.linkDistance).links(this.state.links)
      )
      .force("x", d3.forceX((node) => xStart + (node.xHint * xScale)))
      .force("y", d3.forceY(this.props.height / 2));

    this.force.on('tick', () => this.setState({nodes: this.state.nodes, links: this.state.links}));
  }

  render() {
    return (
      <svg width={this.props.width} height={this.props.height}>
        <defs>
          <filter id="glow" x="-5000%" y="-5000%" width="10000%" height="10000%">
            <feFlood result="flood" floodColor="#6A287E" floodOpacity="1"></feFlood>
            <feComposite in="flood" result="mask" in2="SourceGraphic" operator="in"></feComposite>
            <feMorphology in="mask" result="dilated" operator="dilate" radius="1"></feMorphology>
            <feGaussianBlur in="dilated" result="blurred" stdDeviation="5 5"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="blurred"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
        </defs>
        <g>
          {this.state.links.map((link, index) => (
            <line
              x1={link.source.x}
              y1={link.source.y}
              x2={link.target.x}
              y2={link.target.y}
              key={`line-${index}`}
              stroke="black"
              strokeWidth={0.5} />
          ))}
          {this.state.nodes.map((node, index) => {
            let passClipName = `pass-${_clipIndex}`;
            let failClipName = `fail-${_clipIndex}`;
            _clipIndex++;
            let passClipHeight = (parseFloat(node.passed) / parseFloat(node.testCount)) * (node.r * 2);
            let failClipHeight = (parseFloat(node.failed) / parseFloat(node.testCount)) * (node.r * 2);
            let extraFilters = node.active ? {filter: "url(#glow)"} : {};
            return (
              <g key={index}>
                <defs>
                  <clipPath id={passClipName}>
                    <rect
                      x={node.x - node.r}
                      y={(node.y + node.r) - passClipHeight}
                      width={node.r * 2}
                      height={passClipHeight}
                      />
                  </clipPath>
                  <clipPath id={failClipName}>
                    <rect
                      x={node.x - node.r}
                      y={(node.y + node.r) - passClipHeight - failClipHeight}
                      width={node.r * 2}
                      height={failClipHeight}
                      />
                  </clipPath>
                </defs>
                <circle cx={node.x} cy={node.y} r={node.r} fill="white"
                  strokeWidth={1} stroke="steelblue"
                  {...extraFilters} />
                <circle cx={node.x} cy={node.y} r={node.r} fill="green"
                  clipPath={`url(#${passClipName})`} />
                <circle cx={node.x} cy={node.y} r={node.r} fill="red"
                  clipPath={`url(#${failClipName})`} />
                <text x={node.x} y={node.y + node.r + 10}
                  textAnchor="middle"
                  fontFamily="arial"
                  fontSize="12px"
                  fill="steelblue">{node.name}</text>
              </g>
            );
          })}
        </g>
      </svg>
    );
  }
}

ComponentGraph.defaultProps = {
  width: 500,
  height: 200,
  charge: -0.3,
  linkDistance: 80,
  forceStrength: -200,
  components: {}
};
