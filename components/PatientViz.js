import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
//import DataTable from './DataTable';
import ApiWrapper from './Wrapper';
import Histogram from './Histogram';
import { Grid, Row, Col, Glyphicon, Button, Panel, ButtonToolbar, 
         Input, Tabs, Tab } from 'react-bootstrap';
import * as Selector from '../selectors';
import _, {Supergroup} from 'supergroup-es6';
import {Patient, Timeline} from './Patient';
import {PatientGroup} from './PatientList';
import Listicle from './Listicle';
require('isomorphic-fetch');
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
      highlightEvts: [], // groups of evts from pt or pt time period
      highlightEvt: null,// single evt highlighted from EventListicle
    };
  }
  componentWillMount() {
    this.requestData();
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.search !== this.props.router.location.search) {
      this.requestData();
    }
  }
  requestData() {
    let search = this.props.router.location.search;
    fetch(`/data/person_ids?${search}`)
      .then(response => response.json())
      .then(json => {
        let patients = new PatientGroup(json, {
            getHighlightedEvts: this.getHighlightedEvts.bind(this), 
            patientQueryString: this.props.router.location.search,
        });
        this.setState({person_ids: json, patients, search})
      });
    fetch('/data/events')
      .then(response => response.json())
      .then(json => {
        let patients = new PatientGroup(json, {
            getHighlightedEvts: this.getHighlightedEvts.bind(this), 
        });
        this.setState({events: json})
      });
  }
  getHighlightedEvts() {
    return this.state.highlightEvts;
  }
  render() {
    let {width, height, granularity, configChange, router} = this.props;
    width = (typeof width === "undefined") && 800 || width;
    height = (typeof height === "undefined") && 300 || height;
    const {patients, highlightedPatient, highlightedPatientIdx, 
            events, highlightEvts, highlightEvt} = this.state;
    let indexEvt = router.location.query.indexEvt;

    let timelineMouseEvents = {
      labelMouseover: this.labelHover.bind(this),
      dotMouseover: this.labelHover.bind(this),
    }
    let info = <h4>{patients && patients.length || 0} patients in cohort
                    {indexEvt && ` with ${indexEvt}`}
               </h4>;
    let zeroCenterDomain = [-1, 1];
    if (highlightedPatient) {
      let dr = highlightedPatient.dateRange(granularity);
      zeroCenterDomain = [ -(Math.max(Math.abs(dr[0]),Math.abs(dr[1]))),
                                (Math.max(Math.abs(dr[0]),Math.abs(dr[1])))];
    }
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
            //dotsOnly: true,
            scale: d3.scale.linear(),//.domain(zeroCenterDomain),
            domain: zeroCenterDomain,
            timeFn: d => d.valueOf(),
            textFn: d => `${d.records.length} events`,
            dotRadius: d => Math.pow(d.records.length, 3/4),
            //dotColor: 'rgba(50, 80, 100, 0.5)',
            dotColor: dot => {
              if (dot.valueOf() === 0)
                return 'red';
              let highlighted = _.any(dot.children,
                    evt=> _.contains(this.getHighlightedEvts(), evt.toString())); // SLOW!
              return highlighted ?  'rgba(70, 120, 140, 0.7)' : 'rgba(50, 80, 100, 0.4)';
            },
            linkColor: 'rgba(50, 80, 100, 0.5)',
          };
            //textFn: d => `${d.concept_name}<br/>
              //${(d.end_date - d.start_date)/(1000*60*60*24)} days`,
    let evtColors = {
      [indexEvt]: 'blue',
    }
    return  <Grid> 
              <Row>
                <Col md={12}>
                  {info}
                  {patients && patients.table({
                    patientFilter:null,
                    granularity, timelineMouseEvents, evtColors,
                    highlightedPatient, highlightedPatientIdx,
                    highlightPatient:this.highlightPatient.bind(this),
                  })}
                  <h5>{highlightedPatient && highlightedPatient.desc() || ''}</h5>
                </Col>
              </Row>
              <hr/>
              <Row>
                <Col md={7}>
                  <Timeline height={height} width={width}
                    opts={timelineOpts}
                    timelineMouseEvents={timelineMouseEvents}
                    //eras={highlightedPatient && highlightedPatient.lookup("Condition").records}
                    dots={highlightedPatient && highlightedPatient.eventsBy(granularity)}
                  >
                  </Timeline>
                </Col>
                <Col mdOffset={2} md={3}>
                  <EventList
                    patient={highlightedPatient}
                  />
                </Col>
              </Row>
              <hr/>
              <Row>
                <Col md={12}>
                  <Tabs defaultActiveKey={1}>
                    <Tab eventKey={1} title="Index Evt">
                      <EventListicle 
                        router={router}
                        configChange={configChange}
                        evtHover={this.evtHover.bind(this)}
                        highlightEvts={highlightEvts}
                        highlightEvt={highlightEvt && highlightEvt.toString()}
                        width={650} height={600} 
                        events={events} 
                      />
                    </Tab>
                    <Tab eventKey={2} title="Evts of Interest">Tab 2 content</Tab>
                    <Tab eventKey={3} title="Settings" >Tab 3 content</Tab>
                  </Tabs>
                </Col>
              </Row>
            </Grid>;

            /*
    let timelineMouseEvents = {
      labelMouseover: this.labelHover.bind(this),
      dotMouseover: this.labelHover.bind(this),
    }
    let evtList = highlightEvts.map(d=><p key={d.toString()}>{d.toString()}</p>);
    let listicle = <EventListicle 
                      router={router}
                      configChange={configChange}
                      evtHover={this.evtHover.bind(this)}
                      highlightEvts={highlightEvts}
                      highlightEvt={highlightEvt && highlightEvt.toString()}
                      width={250} height={300} 
                      events={events} 
                    />;
    let XXinfo = highlightEvt && <h5>{highlightEvt.children.length} patients 
              with {highlightEvt.records.length} (total) {highlightEvt.toString()}</h5> 
                || '';
    return  (<Grid> 
              <Row>
                <Col md={8}>
                  {info}
                  {patients.table({
                    patientFilter:null,
                    granularity, timelineMouseEvents,
                    highlightedPatient, highlightedPatientIdx,
                    highlightPatient:this.highlightPatient.bind(this),
                  })}


                  <h4>{highlightedPatient && highlightedPatient.desc() || ''}</h4>
                  <Timeline height={height} width={width}
                    opts={timelineOpts}
                    timelineMouseEvents={timelineMouseEvents}
                    //eras={highlightedPatient && highlightedPatient.lookup("Condition").records}
                    eras={highlightedPatient && highlightedPatient.eventsBy(granularity)}
                  >
                  </Timeline>
                </Col>
                <Col md={3} mdOffset={1} className="evt-list">
                  {listicle}
                  {evtList}
                </Col>
              </Row>
            </Grid>);
            */
  }
  labelHover(node) {
    let highlightEvts = node.children.map(String); // labels/dots have event children
    this.setState({highlightEvts, highlightEvt: null});
  }
  evtHover(highlightEvt) { // WHAT ABOUT END HOVER?
    //THEN: listicle highlight filters patient list
    this.setState({highlightEvts: [highlightEvt], highlightEvt});
  }
  highlightPatient(patient, idx) {
    let highlightEvts = patient.allEvts().rawValues();
    this.setState({highlightedPatient:patient, highlightedPatientIdx:idx, highlightEvts});
  }
}
class EventList extends Component {
  render() {
    const {patient} = this.props;
    if (!patient)
      return <div/>;
    let list = patient.eras.map((d,i)=>
      <p key={i}>Day {d.days_from_index}: {d.name_0} 
        { d.name_0 === d.concept_name ? '' : (' -> ' + d.concept_name)}
      </p>);
    return <div>{list}</div>;
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
    this.props.evtHover(eventHighlighted);
    //this.setState({eventHighlighted}); FIX
  }
  endHighlight(eventHighlighted) {
    //this.setState({eventHighlighted: null}); FIX
  }
  isHighlighted(eventHighlighted) {
    return eventHighlighted === this.props.eventHighlighted;
  }
  eventClass(event) {
    const {highlightEvts, eventHighlighted} = this.props;
    //const {eventHighlighted} = this.state;
    if (eventHighlighted) {
      if (event.toString() === eventHighlighted) {
        return 'highlighted';
      } else {
        return 'grayout';
      }
    } else {
      if (_.contains(highlightEvts, event.toString())) {
        return 'highlighted';
      } else {
        return 'grayout';
      }
    }
  }
  render() {
    const {width, height, events, highlightEvts, eventHighlighted,
            configChange, router, evtHover} = this.props;
    if (! (events && events.length))
      return <div/>;
    let radio
    const buttons = eventFreqFuncs().map((f,i) =>
        <Input type="radio" name="eventFreqFunc" label={f.label} 
          defaultChecked={f.label === this.state.eventFreqFunc.label}
          value={f.func} key={f.label} onClick={()=>this.changeValFunc.bind(this)(f)}
        />);
    return <Grid>
            <Row>
              <Col md={2}>
                <h4 style={{textAlign:'right'}}>Index by first:</h4>
                <br/>
                <br/>
                <br/>
                <br/>
                <h5>Sort by</h5>
                {buttons}
              </Col>
              <Col md={9}>
                <br/>
                <Listicle  
                        //things={events.filter(d=>_.contains(highlightEvts, d.toString()))}
                        things={events}
                        itemClass={this.eventClass.bind(this)}
                        //eventHighlighted={eventHighlighted}
                        valFunc={this.state.eventFreqFunc.func}
                        labelFunc={d=>d.name}
                        evtHover={evtHover}
                        width={width}
                        height={height - 70}
                        hover={this.highlight.bind(this)}
                        endHover={this.endHighlight.bind(this)}
                        isHighlighted={this.isHighlighted.bind(this)}
                        click={ evt=>configChange(router, 
                                    'indexEvt', evt.name) }
                >
                </Listicle>
              </Col>
            </Row>
           </Grid>
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
      func:   d => d.patients,
    },
    { label: 'Occurrences',
      key:   'occurrences',
      func:   d => d.occurrences,
    },
  ];
  if (pick)
    return _.find(all, {key: pick});
  return all;
}
