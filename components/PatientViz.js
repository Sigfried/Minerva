import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
//import DataTable from './DataTable';
import ApiWrapper from './Wrapper';
import Histogram from './Histogram';
import { Grid, Row, Col, Glyphicon, Button, Panel, ButtonToolbar, Input } from 'react-bootstrap';
import * as Selector from '../selectors';
import _, {Supergroup} from 'supergroup-es6';
import {Patient, Timeline} from './Patient';
import {PatientGroup} from './PatientList';
//var css = require('css!bootstrap/dist/css/bootstrap.css');
require("!style!css!less!../style.less");
require('!style!css!fixed-data-table/dist/fixed-data-table.min.css');
//require("!style!css!less!bootstrap/less/bootstrap.less");
require('expose?$!expose?jQuery!jquery');
require("bootstrap-webpack");

export default class PatientViz extends Component {
  constructor() {
    super();
    this.state = {
      patients: new PatientGroup([]),
      highlightEvts: [],
    };
  }
  componentWillMount() {
    this.getData();
  }
  getData() {
    const {apicall, } = this.props;
    let apiparams = { api:'person_data',datasetLabel:'person_data' };
    let apistring = Selector.apiId(apiparams);
    apicall(apistring);
  }
  componentDidUpdate() {
    let params = { api:'person_data',datasetLabel:'person_data' };
    let data = this.props.datasets[Selector.apiId(params)] || [];
    data.length && this.newData(data);
  }
  newData(data) {
    const {cacheData, } = this.props;
    if (this.state.patientsLoaded) return; // only loading once for now
    let patients = new PatientGroup(data);
    cacheData({apistring:Selector.apiId({api:'patients',datasetLabel:'patients'}), 
               data:patients});
    this.setState({data, patients, patientsLoaded: true});
    return patients;
  }
  render() {
    let {width, height, granularity, explorer} = this.props;
    width = (typeof width === "undefined") && 800 || width;
    height = (typeof height === "undefined") && 300 || height;
    const {patients, highlightedPatient, highlightedPatientIdx} = this.state;
    let timelineOpts = 
          {
            direction: 'down',
            initialWidth: width,
            initialHeight: 500,
            layerGap: 30,
            labella: {
              //minPos: 100, 
              maxPos: width * .85, //stubWidth: 100,
              nodeHeight: 25,
            },
            timeFn: d => d.valueOf(),
            textFn: d => `${d.records.length} events`,
            dotRadius: d => Math.pow(d.records.length, 3/4),
            dotColor: 'rgba(50, 80, 100, 0.5)',
            linkColor: 'rgba(50, 80, 100, 0.5)',
          };
            //textFn: d => `${d.concept_name}<br/>
              //${(d.end_date - d.start_date)/(1000*60*60*24)} days`,
    let timelineEvents = {
      labelMouseover: this.labelOver.bind(this),
      dotMouseover: this.labelOver.bind(this),
    }
    let evtList = this.state.highlightEvts.map(d=><p key={d}>{d}</p>);
    return  <Grid> 
              <Row>
                <Col md={9}>
                  {patients.table({
                    granularity, timelineEvents,
                    highlightedPatient, highlightedPatientIdx,
                    highlightPatient:this.highlightPatient.bind(this),
                  })}
                  <h4>{highlightedPatient && highlightedPatient.desc() || ''}</h4>
                  <Timeline height={height} width={width}
                    opts={timelineOpts}
                    timelineEvents={timelineEvents}
                    //eras={highlightedPatient && highlightedPatient.lookup("Condition").records}
                    eras={highlightedPatient && highlightedPatient.eventsBy(granularity)}
                  >
                  </Timeline>
                </Col>
                <Col md={2} mdOffset={1} className="evt-list">
                  {evtList}
                </Col>
              </Row>;
            </Grid>;
  }
  labelOver(node) {
    let highlightEvts = node.records.map(d=>d.concept_name);
    this.setState({highlightEvts});
  }
  highlightPatient(patient, idx) {
    this.setState({highlightedPatient:patient, highlightedPatientIdx:idx});
  }
}

