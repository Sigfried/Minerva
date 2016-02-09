import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import d3 from 'd3';
//var css = require("css!./lineChart.css"); // hitting some bug...won't compile

const ANIMATION_DURATION = 400;
const X_TICKS_WANTED = 5;

//import dimple from '../node_modules/dimple-js/dist/dimple.latest';
//import nvd3 from 'nvd3';

class LineChart extends Component {
    render() {
      const {val} = this.props;
      /*
      console.warn("don't do this");
      val.records.forEach((d,i)=>{
        d.value = Number(d.value);
      })
      */
      return (<div ref="div" 
              style={{border:"1px solid blue", 
                      height:"200px", width:"700px",
                      fontSize: 10,
                    }}>
              </div>);
    }
    componentDidMount() {
      const {val} = this.props;
      let sg = _.supergroup(_.sortBy(val.records,'issue_period'),
        ['result_name','patient_type']);
      let serieses = sg.leafNodes();
      this.lc = new D3LineChart();
      this.lc.setx(d=>d.issue_period)
      this.lc.sety(d=>d.value);
      //this.lc.create(this.refs.div, serieses.slice(0,1), 300, 100);
      this.lc.create(this.refs.div, serieses);
      //dimplelc(this.refs.svg, val);
      //nvdlc(d3.select(this.refs.svg).append('svg').node());
    }
}

// from http://nicolashery.com/integrating-d3js-visualizations-in-a-react-app/
// https://github.com/nicolashery/example-d3-react
export class D3Chart {
  constructor() {
    this._margin = {top: 20, right: 20, bottom: 30, left: 50};
  }
  create(el, serieses, width, height) {
    // each series is a supergroup node with recs to be points
    this._setLayoutDims(el, width, height);
    let svg = d3.select(el).append('svg')
            .attr('class', 'd3')
            .attr('width', this._layout.width + this._margin.left + this._margin.right)
            .attr('height', this._layout.height + this._margin.top + this._margin.bottom)
          .append("g")
            .attr("transform", "translate(" + this._margin.left + "," + this._margin.top + ")");



    this.update(svg.node(), serieses);
  }
  _setLayoutDims(el, width, height) {
    this._layout = { width: width || (el.offsetWidth - this._margin.left - this._margin.right),
                     height: height || (el.offsetHeight - this._margin.top - this._margin.bottom),
                   };
    //console.log(el, width, height, this._layout, this._margin);
    //debugger;
  }
}
export class D3XYChart extends D3Chart {
  constructor() {
    super();
    this._getx = d=>d.x;
    this._gety = d=>this._gety(d);
  }
  setx(func) {
    if (typeof func === "undefined")
      return this._getx;
    return this._getx = func;
  }
  sety(func) {
    if (typeof func === "undefined")
      return this._gety;
    return this._gety = func;
  }
  _axes(scales) {
    let ticks = scales.x.domain();
    let portion = Math.floor(ticks.length / X_TICKS_WANTED);
    let x = d3.svg.axis()
      .scale(scales.x)
      .tickValues(ticks.filter((d,i) => i % portion === 0))
      .orient("bottom");
    let y = d3.svg.axis()
      .scale(scales.y)
      .orient("left");
    return {x: x, y: y};
  };
  _scales(el, recs) {
    if (!recs) return null;

    let width = this._layout.width - this._margin.left - this._margin.right;
    let height = this._layout.height - this._margin.top - this._margin.bottom;

    // shouldn't always be ordinal!
    let x = d3.scale.ordinal()
      //.range([0, width])
      .rangePoints([0, this._layout.width])
      .domain(recs.map(this._getx).sort());


    let yext = d3.extent(recs.map(this._gety));
    if (yext[0] === yext[1])
      yext = [yext[0] - 0.5, yext[1] + 0.5];
    let y = d3.scale.linear()
      //.range([height, 0])
      .range([this._layout.height, 0])
      .domain(yext)
    //console.log(y.range(), y.domain());

    return {x: x, y: y};
  };
  //_drawAxes(el, axes) { }
}
class D3LineChart extends D3XYChart {
  /*
   * expect getx, gety
   * make scales from points for now
   */

  update(el, serieses) {
    let scales = this._scales(el, _.flatten(serieses.map(d=>d.records)));

    let colorScale = d3.scale.category10();
    colorScale(99); //'throwaway first color');
    // Re-compute the scales, and render the chart
    //this._setLayoutDims(el);
    let _this = this;
    this._drawAxes(el, scales, _.chain(serieses).map(d=>d.records).flatten().value());
    d3.select(el).selectAll('g.linechart-series')
        .data(serieses, d=>d)
        .enter()
      .append('g')
        .attr('class', 'linechart-series')
      .each(function(series, i) {
        _this._drawPoints( 
            this, scales, series.records, colorScale(i));
        _this._drawChart(this, scales, series.records, colorScale(i));
      });

    //let prevScales = this._scales(el, state.prevDomain);
    //this._drawTooltips(el, scales, state.tooltips, prevScales);
  }
  _line(scales) {
    return d3.svg.line()
            .x(d => {let a=scales.x(this._getx(d));/*console.log(a);*/return a;})
            .y(d => {let a=scales.y(this._gety(d));/*console.log(a);*/return a;})
  }
  _drawAxes(el, scales, prevScales) {
    let axes = this._axes(scales);
    //this._drawAxes(el, this._axes(scales));
    let xAxis = d3.select(el).append('g')
      .attr("class", "x axis")
                // FIX!!
      .attr("transform", "translate(0," + (this._layout.height) + ")")
      .call(axes.x);
    // KLUDGE till i figure out how to handle css for d3 in react
    xAxis.selectAll('path,line')
      .style('fill','none')
      .style('stroke', '#000')
      .style('shape-rendering','crispEdges');
    xAxis.selectAll('.x').selectAll('path')
      .style('display','none')
    xAxis.selectAll('.line')
      .style('fill','none')
      .style('stroke', 'steelblue')
      .style('stroke-width', 1.5)


    let yAxis = d3.select(el).append('g')
          .attr("class", "y axis")
      .call(axes.y)
      /*
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Price ($)")
      */
    // KLUDGE till i figure out how to handle css for d3 in react
    yAxis.selectAll('path,line')
      .style('fill','none')
      .style('stroke', '#000')
      .style('shape-rendering','crispEdges');
    yAxis.selectAll('.y').selectAll('path')
      .style('display','none')
    yAxis.selectAll('.line')
      .style('fill','none')
      .style('stroke', 'steelblue')
      .style('stroke-width', 1.5)

  }
  _drawChart(el, scales, data, color, prevScales, dispatcher) {
    //let g = d3.select(el).selectAll('g.d3chart');
    let g = d3.select(el) //FIX   .selectAll('.d3-points');
    g.selectAll('path.line')
      .data(data, d=>d)//(, function(d) { return d.id; });
      .enter()
      .append('path')
        .datum(data)
        .attr('class', 'line')
        .attr('d', this._line(scales))
        .style('fill','none')
        //.style('stroke','steelblue')
        .style('stroke', color)
        .style('stroke-width',1.5)
      /*
      .transition()
        .duration(ANIMATION_DURATION)
        .attr('cx', function(d) { return scales.x(this._getx(d)); });

    point.attr('cy', function(d) { return scales.y(this._gety(d)); })
        .attr('r', function(d) { return scales.z(d.z); })
        .on('mouseover', function(d) {
          dispatcher.emit('point:mouseover', d);
        })
        .on('mouseout', function(d) {
          dispatcher.emit('point:mouseout', d);
        })
      .transition()
        .duration(ANIMATION_DURATION)
        .attr('cx', function(d) { return scales.x(this._getx(d)); });

    if (prevScales) {
      point.exit()
        .transition()
          .duration(ANIMATION_DURATION)
          .attr('cx', function(d) { return scales.x(this._getx(d)); })
          .remove();
    }
    else {
      point.exit()
          .remove();
    }
    */
  };
  _drawPoints(el, scales, data, color, prevScales, dispatcher) {
    let jigger = () => (Math.random() - 0.5) * 5;
    let g = d3.select(el) //FIX   .selectAll('.d3-points');

    let point = g.selectAll('.d3-point')
      .data(data)//(, function(d) { return d.id; });

    point.enter().append('circle')
        .attr('class', 'd3-point')
        .style('fill', color)
        .style('opacity', 0.5)
        .attr('cx', d => {
          if (prevScales) {
            return prevScales.x(this._getx(d));
          }
          return scales.x(this._getx(d)) + jigger();
        })
      .transition()
        .duration(ANIMATION_DURATION)
        .attr('cx', d => scales.x(this._getx(d)) + jigger());

    point.attr('cy', d => scales.y(this._gety(d)) + jigger())
        .attr('r', 5)
        //.attr('r', d => { return scales.z(d.z); })
        .on('mouseover', d => {
          dispatcher.emit('point:mouseover', d);
        })
        .on('mouseout', d => {
          dispatcher.emit('point:mouseout', d);
        })
      .transition()
        .duration(ANIMATION_DURATION)
        .attr('cx', d => { return scales.x(this._getx(d)) + jigger(); });

    if (prevScales) {
      point.exit()
        .transition()
          .duration(ANIMATION_DURATION)
          .attr('cx', d => { return scales.x(this._getx(d)) + jigger(); })
          .remove();
    }
    else {
      point.exit()
          .remove();
    }
  };
}

LineChart.propTypes = {
  /*
  bars: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  */
};

export default LineChart;
