import React, { Component, PropTypes } from 'react';
import d3 from 'd3';
import _ from 'lodash';
require("!style!css!less!../style.less");

/*
 * things => array of things to be represented by bars (individual rectangles)
 * valFunc => func(thing, i) returning a number that gives relative height of bar
 *
 * optional functions to call if a bar is hovered over:
 *    hover, endHover => func(thing,passthrough,i,mouseEvent)
 * optional function to determine if a bar should be highlighted:
 *    isHighlighted => func(thing,passthrough,i)
 * 
 * sortBy => func(thing) should return value to determine bar order
 *           defaults to bar value
 *          
 */
export default class Listicle extends Component {
  /*
  shouldComponentUpdate(nextProps, nextState) {
    return this.props.things != nextProps.things ||
           this.props.selected != nextProps.selected ||
           this.props.highlighted != nextProps.highlighted;
  }
  */
  render() {
    const {passthrough, width, height, 
        isHighlighted, hover, endHover, click,
        valFunc=d=>d, 
        labelFunc=d=>d.toString(), 
        sortBy, controls=[], 
        itemClass=()=>''} = this.props;
    const things = this.props.things.sort((a,b)=>(sortBy||valFunc)(b)-(sortBy||valFunc)(a));

    // not sure what's going wrong with sorting... going without for now
    //const things = _.sortBy(this.props.things, sortBy||valFunc);
    var ext = d3.extent(things.map((thing,i)=>valFunc(thing,i)));
    var dumbExt = [0, ext[1]];
    var xScale = d3.scale.linear()
                        .domain(dumbExt)
                        .range([0, width]);
    var bars = things.map((thing, i) =>
            <Item
                passthrough={passthrough}
                thing={thing}
                valFunc={valFunc}
                labelFunc={labelFunc}
                controls={controls}
                itemClass={itemClass}
                isHighlighted={isHighlighted}
                click={click}
                hover={hover}
                endHover={endHover}
                chartWidth={width}
                xScale={xScale}
                i={i}
                key={i}
                />
        );
    return <div className="listicle">
              {bars} 
           </div>;
  }
}
Listicle.propTypes = {
  things: PropTypes.array.isRequired, 
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

class Item extends Component {
    render() {
      let {passthrough, thing, valFunc, labelFunc, orientation, 
        i, xScale, chartHeight, chartWidth, hover, click,
        isHighlighted, endHover, controls, itemClass} = this.props;
      hover = hover || _.noop;
      isHighlighted = isHighlighted || _.noop;
      endHover = endHover || _.noop;
      let highlighted = isHighlighted(thing,passthrough,i)
      let barWidth = xScale(valFunc(thing, i));
      let controlSpans = controls.map( d=>
              <span onClick={()=>d.click(thing)}
              key={d.name}>{d.render()}</span>);
      let className = itemClass ? itemClass(thing) : '';
      return (
        <div className={'background item ' + className}
              style={{position:'relative', height:'1.4em', cursor:'pointer'}}
              onMouseOver={evt=>hover(thing,passthrough,i, evt)}
              onMouseOut={evt=>endHover(thing,passthrough,i, evt)}
              onClick={evt=>click(thing,passthrough,i, evt)}
          >
            <span
                  style={{position:'absolute', }}
            >
              {controlSpans}
              {labelFunc(thing)}
            </span>
            <span 
                  className={'normal item ' + className}
                  style={{position:'absolute', width:barWidth,  height:'1.4em',
                          cursor:'pointer'}}
                  onMouseOver={evt=>hover(thing,passthrough,i, evt)}
                  onMouseOut={evt=>endHover(thing,passthrough,i, evt)}
                  onClick={evt=>click(thing,passthrough,i, evt)}
            >
            </span>
          </div>
      );
    }
};
/*
function barStyle(type, highlighted) {
  let opacities = {
    background: .6,
    normal: 1,
  };
  let colors = {
    background: rgba('#4682B4', .5),
    normal: 'steelblue',
  };
  return {
    background: colors[type],
    border: `1px solid ${highlighted ? 'steelblue' : 'white'}`,
    //opacity: opacities[type] / (highlighted ? 1 : 2),
    overflowX: type==='normal' ? 'visible' : 'hidden',
  };
}
const barStyles = 
  _.chain([true,false])
   .map( highlighted => 
          _.map( ['normal', 'background'], type => 
                [type + highlighted, barStyle(type, highlighted)]
               )
       )
   .flatten().object().value();
   */
