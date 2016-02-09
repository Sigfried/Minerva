import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import DataTable from './DataTable';
import ApiWrapper from './Wrapper';
import Histogram from './Histogram';
import { Grid, Row, Col, Glyphicon, Button, Panel, ButtonToolbar, Input } from 'react-bootstrap';
import * as Selector from '../selectors';
import _ from 'supergroup';
//var css = require('css!bootstrap/dist/css/bootstrap.css');
//require("!style!css!less!bootstrap/less/bootstrap.less");
require('expose?$!expose?jQuery!jquery');
require("bootstrap-webpack");

const commaf = d3.format(',');
const comma = n => n && commaf(n) || undefined;

function nodeGCb(node) {
  d3.select(this)
    .style('opacity', isRealNode(node) ? 1 : .4);
}
export default class PatientViz extends Component {
  constructor() {
    super();
    this.state = {};
    this.state.highlightedDim = null;
    this.state.drillApiString;
    this.state.drillDss = '';
    //this.state.valFunc = valFuncs()[0];
  }
  render() {
    return <h2>Here we are!</h2>;
    const { datasets, schema, apicall } = this.props;
    if (!schema)
      return <Row><Col md={5} mdOffset={2}><h3>Choose a schema</h3></Col></Row>;

    let icicleparams = { schema,api:'icicle',datasetLabel:'icicle' };
    let icicleData = datasets[Selector.apiId(icicleparams)] || [];

    const buttons = valFuncs().map((f,i) =>
        <Input type="radio" name="valfunc" label={f.label} 
          defaultChecked={f.label === this.state.valFunc.label}
          value={f.func} key={f.label} onClick={()=>this.changeValFunc.bind(this)(f)}
        />
                                 );
    let sortFunc = (a,b) =>
        valFuncs('countsize').func(b) -
        valFuncs('countsize').func(a);
    let rawDataReady = this.rawDataReady(this.state.highlightedDim);
    return (
      <Grid >
        <fieldset>
          {buttons}
        </fieldset>
        <Row>
            <Col md={6}>
              <Icicle data={icicleData}
                      dataTitle={'Grouping Sets'}
                      dimNames={dimNames}
                      valFunc={this.state.valFunc.func}
                      sortFunc={sortFunc}
                      drillCb={this.drillCb.bind(this)}
                      hoverCb={this.hoverCb.bind(this)}
                      nodeGCb={nodeGCb}
                      zoomable={false}
                      key={schema}
              >
              </Icicle>
            </Col>
            <Col md={4} mdOffset={2}>
              <ApiWrapper 
                  passthrough={{
                    dim: this.state.highlightedDim,
                    icicleData,
                  }} 
                  apicall={apicall}
                  datasets={datasets}
                  apiParams={this.state.hoverApiParams}>
                <HighlightedDim 
                />
              </ApiWrapper>
                <p>{
                  (rawDataReady === 'not requested' && 'Click cell for details') ||
                  (rawDataReady === 'requested' && 'Waiting for details...') ||
                  (rawDataReady === 'ready' && 'details ready') ||
                  ''
                }</p>
            </Col>
        </Row>
        <Row>
            <Col md={12}>
              <ApiWrapper 
                  passthrough={{
                    dim: this.state.drillDim,
                    icicleData,
                  }} 
                  apicall={apicall}
                  datasets={datasets}
                  apiParams={this.state.drillApiParams}>
                <DrillDim gridWidth={
                  this.state.drillDim &&
                  Math.floor(12/this.state.drillDim.depth)
                  || 12
                }/>
              </ApiWrapper>
            </Col>
        </Row>
        <div style={{height:60}} />
      </Grid>
    );
  }
  componentWillReceiveProps(newprops, otherarg) {
    if (newprops.schema !== this.props.schema) {
      this.getData(newprops);
      this.setState({
        highlightedDim: null, 
        hoverApiParams: {},
        drillDim: null, 
        drillApiParams: {}
      });
    }
  }
  componentWillMount() {
    this.getData(this.props);
  }
  getData(props) {
    const {apicall, schema, } = props;
    if (!schema)
      return;
    let apiparams = { schema,api:'icicle',datasetLabel:'icicle' };
    let apistring = Selector.apiId(apiparams);
    apicall(apistring);
  }
  
  hoverCb(dim, domNode, svg) {
    
    if (!isRealNode(dim))
      return;

    svg.selectAll('g').style('opacity', .4);
    d3.select(domNode).style('opacity', 1);

    const {schema} = this.props;
    let drillDss = dim2dss(dim);
    if (!drillDss) return;
    const apiParams = { schema, api:'dimsetset', 
                  where: { dss: drillDss},
                  datasetLabel:'summary' };
    this.setState({highlightedDim: dim, hoverApiParams: apiParams});
    //console.log('hover set state', dim.namePath(), apiParams.where);
  }
  rawDataReady(dim, returnData) {
    if (!dim)
      return;
    const {schema, apicall, datasets} = this.props;
    const dss = dim2dss(dim);
    const apiParams = { schema, api:'denorm', 
                  where: {dss},
                  datasetLabel:'data' };
    const apiString = Selector.apiId(apiParams);
    const status = apicall(apiString, true); // don't fetch, but check if available
    if (returnData) {
      if (status === 'ready') {
        return datasets[apiString];
      }
      return null;
    }
    return status;
  }

  drillCb(dim, domNode, svg) {
    if (!isRealNode(dim))
      return;

    svg.selectAll('rect').style('stroke', 'white').style('stroke-width',1);
    d3.select(domNode).select('rect').style('stroke', 'brown').style('stroke-width',5);

    const {schema} = this.props;
    let drillDss = dim2dss(dim);
    if (!drillDss) return;
    const apiParams = { schema, api:'denorm', 
                where: { dss: drillDss },
                datasetLabel:'data' };
    this.context.queryChange('dimsetset', drillDss);
    this.setState({drillDim: dim, drillApiParams: apiParams});
  };
  
  changeValFunc(valFunc) {
    this.setState({valFunc});
  }
  dssClick(evt, dss) {
    //debugger;
  }
}
PatientViz.contextTypes = {
  queryChange: React.PropTypes.func,
};

function dssId(dss, what, schema) {
  return `${schema}_dimsetset_${what}_${dss.dimsetset}`;
}
PatientViz.propTypes = {
  //datasets: React.PropTypes.object.isRequired,
};
const styles = {
  dimsetset: {
    border: '1px solid gray',
    margin: 3,
  },
}
function nestPath(list, i, n, counts) {
  // SAVE THIS -- WAY TO MAKE NESTED LIST FROM SG.VAL.PEDIGREE
  let valCount = '';
  if (counts && list[i].toString() in counts) {
      valCount = ', ' + comma(counts[list[i].toString()]) + ' values'
  } else {
    console.log('expected ', list[i]+'', 'in', counts);
    debugger;
  }
  if (i < n) {
    return <ul>
            <li>
              <strong>{list[i].toString()}</strong>
              {valCount}
              <br/>
              {nestPath(list, i + 1, n, counts)}
            </li>
           </ul>;
  } else {
    return <ul>
            <li>
              <strong>{list[i].toString()}</strong>
              {valCount}
              <br/>
              {details(list[i])}
            </li>
           </ul>;
  }
  function details(n) {
    return (<div>
              (
                {agg(list[i],'cnt')} groups, {}
                {agg(list[i],'measures')} measures, {}
                <pre>
                {JSON.stringify(list[i].records,null,2)},
                </pre>
              )
           </div>);
  }
}
export class DrillDim extends Component {
  constructor() {
    super();
    this.state = {highlight:{}};
  }
  highlight(dim, val) {
    this.setState({highlight:{dim, val}});
  }
  render() {
    const {dataReady, data, passthrough, apiString, gridWidth} = this.props;
    const {dim} = passthrough;
    if (!dim)
      return <p></p>;
    if (!dataReady)
      return (
          <h5>Loading details for {dim.namePath({delim: ' / ', noRoot:true})}...</h5>
      );
    if (dataReady && !data.length)
      console.log('no data', dim.namePath());

    let nodes = dim.pedigree({noRoot:true}).map(
                  nodeDim => {
                    let dataSubset = data;
                    if (this.state.highlight.val &&
                        this.state.highlight.dim !== nodeDim)
                      dataSubset = this.state.highlight.val.records;
                    return <Col ref="col" md={gridWidth} key={nodeDim.toString()} >
                              <DrillDimNode
                                width={window.innerWidth * 0.88 / [1,1.08,2.23,3.5,5,9][dim.depth] }
                                dim={nodeDim} data={dataSubset}
                                highlight={this.highlight.bind(this)}
                              />
                           </Col>
                  });
    var records = this.state.highlight.val ? this.state.highlight.val.records : data;
    var selection = this.state.highlight.val ?
                    `${this.state.highlight.val.dim} => ${this.state.highlight.val.toString()}`
                    : 'all records';
    return (
        <div onClick={()=>{
                      this.setState({highlightedVal: null});
                      this.highlight();
                      }}>
            <h4>Details for {dim.namePath({delim: ' / ', noRoot:true})}</h4>
            <Row>
                Selection: <strong>{selection}</strong>, {comma(records.length)} values
                <MeasureInfo data={records} val={this.state.highlight.val||dim} />
            </Row>
            <Row>
              {nodes}
            </Row>
            <Row>
              First 10 observations
              <DataTable recs={records.slice(0,10)} 
                  cols={dim2strings(this.state.highlightVal || dim).concat([
                   'value','measure_name','result_name_orig']) 
                       }/>
            </Row>
        </div>
    );
  }
}
export class DrillDimNode extends Component {
  constructor() {
    super();
    this.state = {};
  }
  render() {
    const {dim, data, width} = this.props;
    const hval = this.state.highlightedVal;
    let sg = _.supergroup(data, dim.toString());
    sg = sg.sort((a,b)=> d3.ascending(a.records,b.records) || 
                         d3.ascending(a.valueOf(), b.valueOf()));
    let sparkbars = sg.length && <SparkBarsChart
                        things={sg}
                        valFunc={d=>d.records.length}
                        sortBy={d=>-d.records.length}
                        passthrough={dim}
                        //barNums={barNums}
                        width={width}
                        height={40} 
                        highlight={this.highlight.bind(this)}
                        endHighlight={this.endHighlight.bind(this)}
                        isHighlighted={this.isHighlighted.bind(this)}
                        />
                || '';
    let sampleVals = sg.map(String);
    if (sampleVals.length > 7)
      sampleVals = sampleVals.slice(0,2).join(', ') +
                   ' ... ' +
                   sampleVals.slice(-2).join(', ');
    else
      sampleVals = sampleVals.join(', ');
    //hval && console.log(JSON.stringify(hval.records, null, 2));
    let sparkbarContent;
    if (sg.length > 300) {
      sparkbarContent = <h5>Too many values for spark bars</h5>;
    } else {
      sparkbarContent = 
        <div>
            Observation count per value:
            {sparkbars}
            {hval && `${hval.valueOf()}: ${hval.records.length} observations`}
        </div>;
    }
    return (
        <div style={{ border: '1px solid brown', 
                      margin:3,
                      padding: 3}}
        >
            <h5>{dim.toString()}, {sg.length} values</h5>
            <em>
              [ {sampleVals} ]
            </em>
            <br/>
            {sparkbarContent}
        </div>
    );
    /*
            <pre>
              {hval && JSON.stringify(hval.records, null, 2)}
            </pre>
    */
  }
  highlight(val,dim,i,evt) {
    this.setState({highlightedVal: val});
    this.props.highlight(dim, val)
  }
  endHighlight(val,dim,i,evt) {
    return;
    this.setState({highlightedVal: null});
    this.props.highlight();
  }
  isHighlighted(val,dim,i) {
    return dim === this.props.dim && 
           _.isEqual(val, this.state.highlightedVal);
  }
}
function splitResultName(orig) {
  return orig.split(/\|\|\|/).map(part => part.split(/=/)[1]).join(' / ');
}
export class MeasureInfo extends Component {
  render() {
    const {data, val} = this.props;
    if (!data || !data.length)
      return <p></p>;
    var sg = _.supergroup(data, ['measure_name',d=>splitResultName(d.result_name_orig)]).leafNodes();
    var measures = sg.slice(0, 5).map(measure => {
      var vals = _.pluck(measure.records, 'value');
      return (
              <div key={measure.namePath()} style={{
                    border:'1px solid brown',
                    padding: 5,
              }}>
                  {measure.namePath(' => ')} <br/>
                  Min: {comma(_.min(vals))} <br/>
                  Max: {comma(_.max(vals))} <br/>
                  Mean: {comma(_.mean(vals))} <br/>
                  Median: {comma(_.median(vals))} <br/>
                  Sum: {comma(_.sum(vals))} <br/>
                  <Histogram nums={vals} key={val.dim + ':' + val}/>
              </div>);
    });
    return <Row>
              {measures}
           </Row>;

  }
}
export class HighlightedDim extends Component {
  render() {
    const {dataReady, data, passthrough, apiString} = this.props;
    const {dim} = passthrough;

    if (!dim)
      return <p></p>;

    if (dataReady && data.length !== 1)
      debugger;

    //const list = dim.pedigree();
    //const indented = nestPath(list, 1, list.length -1, data[0]);

    const info = dimInfo(dim, dataReady && data[0]);
    return (
            <div>
                {info}
            </div>);
  }
}
function dimInfo(dim, counts = {}) {
  const list = dim.pedigree({noRoot:true});

  let lis = list.map((item,i) => {
    let valCount = ', ' + (comma(counts[item.toString()])||'[fetching...]') + 
                   ' distinct values'
    return <li key={i}>
            <strong>{item.toString()}</strong>
            {valCount}
            <br/>
          </li>
  });
  let actRec = actualDimRec(dim);
  return (
          <div>
            <h5>{list.length} dimensions:</h5>
            <ul>{lis}</ul>
            {comma(counts.sets)||'[fetching...]'} dimension combinations (dimsets)
            <br/>
            {comma(counts.measures)||'[fetching...]'} measures
            <br/>
            {comma(counts.agg_methods)||'[fetching...]'} aggregation methods
            <br/>
            {comma(actRec.cnt)} observations
          </div>
         );
}
function actualDimRec(dim) {
  return _.find(dim.records,
    rec => {
      let dimsInRec = _.chain(dimNames)
              .reduce((memo, dimName) =>
                      memo + ((rec[dimName]) ? 1 : 0), 0)
              .value()
      return dimsInRec === dim.depth;
    });
}
function agg(node, field) {
  return node.aggregate(list=>
            _.sum(list.map(d=>parseFloat(d))), field)
}

