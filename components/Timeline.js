import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import _ from 'supergroup';
import d3KitTimeline from 'd3Kit-timeline';
import labella from 'labella';

export class Timeline extends Component {
  render() {
    const {data, width, height} = this.props;
    return (<div ref="div" 
            style={{border:"1px solid blue", 
                    height:height+'px', width:width+'px',
                    fontSize: 10,
                  }}>
            </div>);
  }
  componentDidUpdate(nextProps, nextState) {
    const {eras} = this.props;
    let chart = this.state.chart;
    let el = ReactDOM.findDOMNode(this);
    console.log(eras);
    //let data = this.state.starwars.slice(3);
    chart.data(eras || []);

  }
  componentDidMount() {
    const {eras, width, height, opts} = this.props;
    let el = ReactDOM.findDOMNode(this);
    //this.lc = new D3LineChart();
    //this.lc.setx(d=>d.issue_period)
    //this.lc.sety(d=>d.value);
    //this.lc.create(this.refs.div, serieses);
    //var chart = new d3Kit.Timeline('#timeline', 
    var chart = new d3KitTimeline.Timeline(el, opts);

    chart.data([]);
    this.setState({chart});

  }
}
