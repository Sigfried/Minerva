import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
//import DataTable from './DataTable';
import { Table, Column, Cell } from 'fixed-data-table';
import ApiWrapper from './Wrapper';
import Histogram from './Histogram';
import { Grid, Row, Col, Glyphicon, Button, Panel, ButtonToolbar, Input } from 'react-bootstrap';
import * as Selector from '../selectors';
import _, {Supergroup} from 'supergroup-es6';
import d3KitTimeline from '../d3Kit-timeline/dist/d3Kit-timeline';
//var css = require('css!bootstrap/dist/css/bootstrap.css');
require("!style!css!less!../style.less");
require('!style!css!fixed-data-table/dist/fixed-data-table.min.css');
//require("!style!css!less!bootstrap/less/bootstrap.less");
require('expose?$!expose?jQuery!jquery');
require("bootstrap-webpack");

/* expecting (for now) data like:
"person_id","age","gender","race","ethnicity","era_start_date","era_end_date","domain_id","concept_name","pt_concept_name","hlt_concept_name","hlgt_concept_name","soc_concept_name","concept_id","concept_code"
0,83,"Male","White","Not Hispanic or Latino","2008-02-19","2008-02-19","Condition","Impacted cerumen","External ear disorders NEC","External ear disorders (excl congenital)","","",374375,"18070006"

need to deal with granularity. 
*/

/*
function getData(callback) {
  d3.csv('./data/person_data.csv', callback);
}
*/

function condNames(rec) {
  let names = _.chain([ 'soc_concept_name', 
            'hglt_concept_name',
            'hlt_concept_name',
            'pt_concept_name',
            'concept_name'
          ]).map(d=>rec[d]).compact().value();
  names.forEach((name, i) => rec['name_' + i] = name);
}
function dateRound(date, granularity) {
  if (granularity === 'day')
    return date; // assume they're already rounded to date
  let month = new Date(date.setDate(1));
  if (granularity === 'month')
    return month;
  let year = new Date(month.setMonth(0));
  if (granularity === 'year')
    return year;
  throw new Error(`unknown granularity: ${granularity}`);
}
const granularities = {
  day: 1000 * 60 * 60 * 24,
  week: 1000 * 60 * 60 * 24 * 7,
  year: 1000 * 60 * 60 * 365.25,
  month: 1000 * 60 * 60 * 365.25 / 12,
}
export class Patient {
  constructor(id, eras) {
    this.id = id;
    this.eras = eras;
    this._periods = {};
  }
  dateRange() {
    return this._date_range || 
          (this._data_range = [
            _.min(this.eras.map(d=>d.start_date)),
            _.max(this.eras.map(d=>d.end_date)),
          ]);
  }
  eventDays() {
    return this.eventPeriods('day');
  }
  eventsByDay() {
    return this.eventsBy('day');
  }
  eventPeriods(granularity) {
    return this.eventsBy(granularity).length;
  }
  eventsBy(granularity) {
    return this.periods(granularity);
  }
  periods(granularity) {
    return this._periods[granularity] || 
          (this._periods[granularity] = _.supergroup(this.eras, 
              d=>dateRound(d.start_date, granularity), {dimName: granularity}));
  }
  get(field) {
    if (typeof field === "function")
      return field(this);
    if (typeof field !== "string")
      throw new Error("what do you want me to do?");
    if (typeof this[field] === "function") // pt.get('eventDays')
      return this[field]();
    if (field in this) // pt.get('id')
      return this[field];
    if (this.eras.length && field in this.eras[0]) // pt.get('race')
      return this.eras[0][field];
  }
}
export class PatientGroup extends Array {
  constructor(rawData) {
    /* expecting (for now) data like:
    "person_id","age","gender","race","ethnicity","era_start_date","era_end_date","domain_id","concept_name","pt_concept_name","hlt_concept_name","hlgt_concept_name","soc_concept_name","concept_id","concept_code"
    0,83,"Male","White","Not Hispanic or Latino","2008-02-19","2008-02-19","Condition","Impacted cerumen","External ear disorders NEC","External ear disorders (excl congenital)","","",374375,"18070006" */
    let data = rawData.map(d=>{
      let rec = _.clone(d);
      rec.start_date = new Date(rec.era_start_date);
      rec.end_date = new Date(rec.era_end_date);
      condNames(rec);
      return rec;
    });
    let pts = _.supergroup(data, 'person_id');
    let patients = pts.map(pt=>new Patient(pt.valueOf(), pt.records));
    super();
    this.push(...patients);
    this.data = data;
  }
  count() {
    return this.length;
  }
}
export default class PatientViz extends Component {
  getData() {
    const {apicall, } = this.props;
    let apiparams = { api:'person_data',datasetLabel:'person_data' };
    let apistring = Selector.apiId(apiparams);
    apicall(apistring);
  }
  newData(data) {
    if (this.state.patientsLoaded) return;
    let patients = new PatientGroup(data);
    this.setState({data, patients, patientsLoaded: true});
    return patients;
    data.forEach(rec=>{
      rec.start_date = new Date(rec.era_start_date);
      rec.end_date = new Date(rec.era_end_date);
      condNames(rec);
    });
    let ptStartDates = _.supergroup(data, ['person_id','start_date']);
    let ptDateMins = ptStartDates.aggregates(_.min,'start_date','dict');
    let ptEndDates = _.supergroup(data, ['person_id','start_date']);
    let ptDateMaxes = ptEndDates.aggregates(_.max,'end_date','dict');
    let ptEras = _.supergroup(data,
      ['person_id', 'domain_id', 
        'name_0','name_1','name_2','name_3']);
    let dataForTable = ptEras.map(d=>
      { 
        let p = {
          person_id: d.toString(),
          dates: ptStartDates.lookup(d).children.length,
          days: Math.round((ptDateMaxes[d] - 
                  ptDateMins[d]) / 
                    (1000 * 60 * 60 * 24)),
          months: Math.round((ptDateMaxes[d] - 
                  ptDateMins[d]) / 
                    (1000 * 60 * 60 * 24 * 365.25 / 12)),
          years: Math.round((ptDateMaxes[d] - 
                  ptDateMins[d]) / 
                    (1000 * 60 * 60 * 24 * 365.25)),
          eras: d.records.length,
          //Condition: d.lookup('Condition').children.length,
          //Drug: d.lookup('Drug').children.length,
        };
        d.children.forEach(domain=>{
          p[domain] = domain.children.length;
          //console.log(`${d}: ${domain}: ${domain.children.length}`);
        });
        return p;
      });
    this.setState({data, dataForTable, ptEras});
  }
  constructor() {
    super();
    this.state = {
      patients: new PatientGroup([]),
    };
  }
  componentWillMount() {
    this.getData();
  }
  componentDidUpdate() {
    let params = { api:'person_data',datasetLabel:'person_data' };
    let data = this.props.datasets[Selector.apiId(params)] || [];
    data.length && this.newData(data);
  }
  render() {
    let {width, height, granularity, explorer} = this.props;
    width = (typeof width === "undefined") && 1100 || width;
    height = (typeof height === "undefined") && 300 || height;
    const {patients, showPt} = this.state;
    let timelineOpts = 
          {
            direction: 'down',
            initialWidth: width,
            initialHeight: 2000,
            layerGap: 30,
            labella: {
              //minPos: 100, 
              maxPos: width * .85, //stubWidth: 100,
              nodeHeight: 25,
            },
            timeFn: d => d.valueOf(),
            textFn: d => `${d.records.length} events`,
            dotRadius: d => Math.pow(d.records.length, 3/4),
          };
            //textFn: d => `${d.concept_name}<br/>
              //${(d.end_date - d.start_date)/(1000*60*60*24)} days`,
    let ptDesc = showPt &&
      `Pt Id: ${showPt.get('id')},
       Age: ${showPt.get('age')},
       Gender: ${showPt.get('gender')},
       Race: ${showPt.get('race')},
       Ethnicity: ${showPt.get('ethnicity')}`;
    return  <div> 
              <h3>
                {patients.data.length} records,  
                {patients.count()} patients
              </h3>
              <h5>Pt Id {showPt && showPt.get('id') || 'N/A'} Conditions</h5>
              <Timeline height={height} width={width}
                opts={timelineOpts}
                //eras={showPt && showPt.lookup("Condition").records}
                eras={showPt && showPt.eventsBy(granularity)}
              >
              </Timeline>
              <h4>{ptDesc}</h4>
              <PtTable 
                  patients={patients} 
                  parent={this}
                  />
            </div>;
  }
              /*
                <Axis type={'x'} 
                      scaleType={'date'}
                      min={pt.aggregate(_.min,'start_date')}
                      max={pt.aggregate(_.max,'end_date')}
                      orientation='bottom'
                      />
              */
}

// TABLE STUFF

class TableCell extends React.Component {
  render() {
    const {rowIndex, field, data, ...props} = this.props;
    return (
      <Cell {...props}>
        { data.length && data[rowIndex].get(field) || '' }
      </Cell>
    );
  }
}
class PtTable extends React.Component {
  constructor(props) {
    super(props);
    const {patients} = props;
    this.state = {patients};
  }
  componentWillReceiveProps(props) {
    const {patients} = props;
    this.setState({patients});
  }
  ptHover(evt, idx) {
    let pt = this.state.patients[idx];
    let ptId = pt.id;
    this.props.parent.setState({showPt: pt});
    console.log(`highlight pt ${ptId}`);
  }
  render() {
    return (
      <Table
        onRowMouseEnter={this.ptHover.bind(this)}
        rowsCount={this.state.patients.count()}
        rowHeight={25}
        headerHeight={50}
        width={1100}
        height={250}>
        <Column
          header={<Cell>PersonId</Cell>}
          cell={
            <TableCell
              data={this.state.patients}
              field="id"
            />
          }
          width={100}
        />
        <Column
          header={<Cell>Days</Cell>}
          cell={
            <TableCell
              data={this.state.patients}
              field={'eventDays'}
            />
          }
          width={100}
        />
      </Table>
    );
  }
}
export class Timeline extends Component {
  constructor() {
    super();
    this.state = {
    };
  }
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
    chart && chart.data(eras || []);
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
