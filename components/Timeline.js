import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import _ from 'supergroup';
import d3KitTimeline from '../d3Kit-timeline/dist/d3Kit-timeline';
import labella from 'labella';

/*
var nodes = [
  new labella.Node(1, 50), // idealPos, width
  new labella.Node(2, 50),
  new labella.Node(3, 50),
  new labella.Node(3, 50),
  new labella.Node(3, 50),
];

var force = new labella.Force()
  .nodes(nodes)
  .compute();

// The rendering is independent from this library.
// User can use canvas, svg or any library to draw the labels.
// There is also a built-in helper for this purpose. See labella.Renderer
draw(force.nodes());
debugger;
*/
export class TimelineNOTUSING extends Component {
  render() {
    const {data, width, height} = this.props;
    return (<div
            style={{border:"1px solid blue", 
                    height:height+'px', width:width+'px',
                    fontSize: 10, overflow: 'auto',
                  }}>
            </div>);
  }
  componentDidUpdate(nextProps, nextState) {
    const {eras} = this.props;
    let chart = this.state.chart;
    let el = ReactDOM.findDOMNode(this);
    //let data = this.state.starwars.slice(3);
    chart.data(eras || []);
    //let layers = d3.max(d3.select(el).selectAll('.label-g').data().map(d=>d.layerIndex))||-1 + 1;
    //console.log(`layers: ${layers}`);

  }
  componentDidMount() {
    const {eras, width, height, opts} = this.props;
    let el = ReactDOM.findDOMNode(this);
    var chart = new d3KitTimeline.Timeline(el, opts);

    chart.data([]);
    this.setState({chart});

  }
}
