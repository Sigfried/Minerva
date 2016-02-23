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
import Listicle from './Listicle';
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
      patients: new PatientGroup([], {
        getHighlightedEvts: this.getHighlightedEvts.bind(this), }
                                ),
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
    let patients = new PatientGroup(data, {
        getHighlightedEvts: this.getHighlightedEvts.bind(this), });
    cacheData({apistring:Selector.apiId({api:'patients',datasetLabel:'patients'}), 
               data:patients});
    let events = _.supergroup(patients.data, ['name_0','person_id']);
    this.setState({data, patients, patientsLoaded: true, events});
    return patients;
  }
  getHighlightedEvts() {
    return this.state.highlightEvts;
  }
  render() {
    let {width, height, granularity, configChange, router} = this.props;
    width = (typeof width === "undefined") && 800 || width;
    height = (typeof height === "undefined") && 300 || height;
    const {patients, highlightedPatient, highlightedPatientIdx, 
            events, highlightEvts} = this.state;
    let timelineOpts = 
          {
            direction: 'down',
            initialWidth: width,
            initialHeight: 2500,
            layerGap: 30,
            labella: {
              //minPos: 100, 
              maxPos: width * .85, //stubWidth: 100,
              nodeHeight: 25,
            },
            timeFn: d => d.valueOf(),
            textFn: d => `${d.records.length} events`,
            dotRadius: d => Math.pow(d.records.length, 3/4),
            //dotColor: 'rgba(50, 80, 100, 0.5)',
            dotColor: dot => {
              let highlighted = _.any(dot.children,
                    evt=> _.contains(this.getHighlightedEvts(), evt.toString())); // SLOW!
              console.log(this.getHighlightedEvts().length, highlighted);
              return highlighted ?  'rgba(70, 120, 140, 0.7)' : 'rgba(50, 80, 100, 0.4)';
            },
            linkColor: 'rgba(50, 80, 100, 0.5)',
          };
            //textFn: d => `${d.concept_name}<br/>
              //${(d.end_date - d.start_date)/(1000*60*60*24)} days`,
    let timelineEvents = {
      labelMouseover: this.labelOver.bind(this),
      dotMouseover: this.labelOver.bind(this),
    }
    let evtList = highlightEvts.map(d=><p key={d}>{d}</p>);
    let listicle = <EventListicle 
                      router={router}
                      configChange={configChange}
                      highlightEvts={highlightEvts}
                      width={250} height={300} 
                      events={events} 
                    />;
    return  <Grid> 
              <Row>
                <Col md={8}>
                  {patients.table({
                    patientFilter:null,
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
                <Col md={3} mdOffset={1} className="evt-list">
                  {listicle}
                  {evtList}
                </Col>
              </Row>;
            </Grid>;
  }
  labelOver(node) {
    //NEXT: have this filter the listicle
    //THEN: listicle highlight filters patient list
    let highlightEvts = node.children.map(String);
    this.setState({highlightEvts});
  }
  highlightPatient(patient, idx) {
    let highlightEvts = patient.allEvts().rawValues();
    this.setState({highlightedPatient:patient, highlightedPatientIdx:idx, highlightEvts});
  }
}

class EventListicle extends Component {
  constructor() {
    super();
    this.state = {};
    this.state.eventFreqFunc = eventFreqFuncs('patients');
  }
  changeValFunc(eventFreqFunc) {
    this.setState({eventFreqFunc});
  }
  highlight(eventHighlighted) {
    this.setState({eventHighlighted});
  }
  endHighlight(eventHighlighted) {
  }
  isHighlighted(eventHighlighted) {
  }
  render() {
    const {width, height, events, highlightEvts, configChange, router} = this.props;
    if (! (events && events.length))
      return <div/>;
    let radio
    const buttons = eventFreqFuncs().map((f,i) =>
        <Input type="radio" name="eventFreqFunc" label={f.label} 
          defaultChecked={f.label === this.state.eventFreqFunc.label}
          value={f.func} key={f.label} onClick={()=>this.changeValFunc.bind(this)(f)}
        />);
    let controls = [ 
          new ListicleControl('check', configChange, router),
          new ListicleControl('remove', configChange, router),
          new ListicleControl('indexEvt', configChange, router),
      //<ListicleControl key={0} name="filter"/>,
      //<ListicleControl key={1} name="indexEvt"/>,
      //<ListicleControl key={2} name="remove"/>,
    ];
    return <div style={{width, height, overflow:'auto', padding: '8px'}}>
            {buttons}
            <Listicle  things={events.filter(d=>_.contains(highlightEvts, d.toString()))}
                        valFunc={this.state.eventFreqFunc.func}
                        controls={controls}
                        width={width}
                        height={height - 70}
                        highlight={this.highlight.bind(this)}
                        endHighlight={this.endHighlight.bind(this)}
                        isHighlighted={this.isHighlighted.bind(this)}
              >
              </Listicle>
           </div>
  }
}
class ListicleControl {
  constructor(name, configChange, router) {
    this.name = name;
    this.configChange = configChange;
    this.router = router;
  }
  render() {
    const {name} = this;
    return <Glyphicon style={{padding:"0px 4px 0px 4px", }} 
            glyph={ ({check:'ok-circle', remove:'remove-circle', indexEvt:'object-align-left'})
                      [name] }
            />
  }
  click(d) {
    if (this.name === 'indexEvt') {
      this.configChange(this.router, 'indexEvt', d.toString());
    }
  }
}
function eventFreqFuncs(pick) {
  const all = [
    { label: 'Patients',
      key:   'patients',
      func:   d => d.children.length,
    },
    { label: 'Occurrences',
      key:   'occurrences',
      func:   d => d.records.length,
    },
  ];
  if (pick)
    return _.find(all, {key: pick});
  return all;
}
