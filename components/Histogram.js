import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import d3 from 'd3';
import {D3XYChart, D3Chart} from './LineChart';

const ANIMATION_DURATION = 400;
const X_TICKS_WANTED = 20;

class Histogram extends React.Component {
    render() {
      const {val} = this.props;
      return (<div ref="div" 
              style={{border:"1px solid blue", 
                      height:"250px", width:"1000px",
                      fontSize: 10,
                    }}>
              </div>);
    }
    componentDidMount() {
      const {nums} = this.props;
      this.lc = new D3Histogram();
      this.lc.create(this.refs.div, nums);
    }
}

class D3Histogram extends D3Chart {
  draw(el, props) {
    this.drawn = true;
  }
  update(el, values) {
    d3.select(el).html('');
    /*
    if (!this.drawn) {
        if (!this.created)
            this.create(el, props);
        this.draw(el, props);
    }
    console.log(values);
    */
    //var values = d3.range(1000).map(d3.random.bates(10));

    var formatCount = d3.format(",.0f");
    var margin = {top: 10, right: 30, bottom: 30, left: 30},
        width = this._layout.width - margin.left - margin.right,
        height = this._layout.height - margin.top - margin.bottom;
    var ext = d3.extent(values);
    if (ext[0] === ext[1]) {
      ext[0]--;
      ext[1]++;
    }
    var x = d3.scale.linear()
        .domain(ext)
        .range([0, width]);

    // Generate a histogram using twenty uniformly-spaced bins.
    var hist = d3.layout.histogram();
    if (x.ticks(X_TICKS_WANTED).length)
      hist.bins(x.ticks(X_TICKS_WANTED).length);
    var data = hist(values);
        //.range(d3.extent(values))

    var y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.y; })])
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(X_TICKS_WANTED)
        .orient("bottom");

    /*
    var svg = d3.select(el).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    */
    var svg = d3.select(el);
    var bar = svg.selectAll(".bar")
        .data(data)
      .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

    //console.log(x.domain(), data[0].length, data[0].dx, x(data[0].dx - 1));
    //console.log(_.pluck(data,'dx').map(x));
    let ticks = x.ticks(X_TICKS_WANTED);
    let barWidth = width / ticks.length - 1;

    if (!data[0]) debugger;
    false && values.length < 100 && console.log(
      `domain width: ${x.domain()[1] - x.domain()[0]}
       domain: ${ext}
       bar width should be: ${(x.domain()[1] - x.domain()[0]) / ticks.length}
       bar width (d3) is: ${data[0].dx}
       bar width (actual) is: ${barWidth}
       ticks: ${ticks.length}
       ${ticks}
       ${values.sort(d3.ascending)}
       `);
    bar.append("rect")
        .attr("x", 1)
        .attr("width", barWidth)
        //.attr("width", x(data[0].dx) - 1)
        //.attr("width", d => x(d.dx + d.x) - x(d.x) - 1)
        .attr("height", function(d) { return height - y(d.y); })
        .style("fill", "steelblue")
        .style("shape-rendering", "crispEdges")
    bar.append("text")
        .attr("dy", ".75em")
        .attr("y", 6)
        //.attr("x", x(data[0].dx) / 2)
        .attr("x", barWidth / 2)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatCount(d.y); })
        .style("fill", "white")

    var xa = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    xa.selectAll('path,line')
      .style('fill','none')
      .style('stroke', '#000')
      .style('shape-rendering','crispEdges');
    xa.selectAll('.x').selectAll('path')
      .style('display','none')
    xa.selectAll('.line')
      .style('fill','none')
      .style('stroke', 'steelblue')
      .style('stroke-width', 1.5)


  };

  XXXupdate(el, serieses) {
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

Histogram.propTypes = {
  /*
  bars: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  */
};

export default Histogram;

