import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import d3KitTimeline from '../d3Kit-timeline/dist/d3Kit-timeline';
require('isomorphic-fetch');

function dateRound(offset, granularity) {
  if (granularity === 'day')
    return offset;
  if (granularity === 'month')
    return Math.round(offset / 365.25 * 12);
  if (granularity === 'year')
    return Math.round(offset / 365.25);
  throw new Error(`unknown granularity: ${granularity}`);
}
/*
function dateRound(date, granularity) {
  let day = new Date(date).setHours(0);
  if (granularity === 'day')
    return day;
  let month = new Date(day).setDate(1);
  if (granularity === 'month')
    return month;
  let year = new Date(month).setMonth(0);
  if (granularity === 'year')
    return year;
  throw new Error(`unknown granularity: ${granularity}`);
}
*/
export class Patient {
  constructor(id, eras, opts) {
    this.id = id;
    this.eras = eras;
    this.opts = opts;
    this._periods = {};
    this.patientQueryString = this.opts.patientQueryString;
  }
  dateRange() {
    return this._date_range || 
          (this._data_range = [
            _.min(this.eras.map(d=>d.days_from_index)),
            _.max(this.eras.map(d=>d.days_from_index)),
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
              [d=>dateRound(d.days_from_index, granularity), 'name_0'], 
                {dimNames: [granularity, 'name_0']}));
  }
  allEvts() {
    try {
      this._allEvts = this._allEvts || 
                      this.eras && _.supergroup(this.eras, 'name_0') ||
                        [];
      return this._allEvts;
    } catch(e) {
      console.warn(e);
      debugger;
    }
  }
  dotTimeline(granularity, timelineMouseEvents) {
    if (!this.dataLoaded) {
      return <div>Waiting for data for patient {this.id}</div>;
    }
    let timelineOpts = 
          {
            dotsOnly: true,
            direction: 'down',
            initialWidth: 300,
            initialHeight: 150,
            layerGap: 30,
            labella: {
              //minPos: 100, 
              maxPos: 300 * .85, //stubWidth: 100,
              nodeHeight: 25,
            },
            timeFn: d => d.valueOf(),
            textFn: d => `${d.records.length} events`,
            dotRadius: d => Math.pow(d.records.length, 3/4),
            //dotColor: 'rgba(50, 80, 100, 0.5)',
            dotColor: dot => {
              let highlighted = _.any(dot.children,
                    evt=> _.contains(this.opts.getHighlightedEvts(), evt.toString())); // SLOW!
              //return highlighted ?  'rgba(150, 80, 100, 0.9)' : 'rgba(50, 80, 100, 0.4)';
              return highlighted ?  'rgba(70, 130, 150, 0.8)' : 'rgba(50, 80, 100, 0.2)';
            },
            linkColor: 'rgba(50, 80, 100, 0.5)',
          };
    return <Timeline height={150} width={300}
                opts={timelineOpts}
                timelineMouseEvents={timelineMouseEvents}
                    dots={this.eventsBy(granularity)}
                  />
  }
  fetchData(callback) {
    if (this.eras && this.eras.length || this.fetching) {
      callback();
      return;
    }
    this.fetching = true;
    fetch(`/data/patient/${this.id}?${this.patientQueryString}`)
      .then(response => {
        if (response.status >= 400) {
          debugger;
        }
        return response.json()
      })
      .then(json => {
        //console.log(json);
        this.eras = json.map(d=>{
          let rec = _.clone(d);
          rec.start_date = new Date(rec.era_start_date);
          rec.end_date = new Date(rec.era_end_date);
          condNames(rec);
          return rec;
        });
        this.dataLoaded = true;
        callback();
        //console.log(this.eras);
      });
  }
  get(field, args) {
    if (typeof field === "function")
      return field(this);
    if (typeof field !== "string")
      throw new Error("what do you want me to do?");
    if (typeof this[field] === "function") // pt.get('eventDays')
      return this[field](...args);
    if (field in this) // pt.get('id')
      return this[field];
    if (this.eras && this.eras.length && field in this.eras[0]) // pt.get('race')
      return this.eras[0][field];
  }
  desc() {
    return `
       Pt Id: ${this.get('id')},
       Age: ${this.get('age')},
       Gender: ${this.get('gender')},
       Race: ${this.get('race')},
       Ethnicity: ${this.get('ethnicity')}`;
  }
}
export class PatientDisplay extends Component {
  constructor() {
    super();
  }
  componentDidMount() {
    const {patient} = this.props;
    //console.log(`fetching data, patient: ${patient.id}`);
    if (!patient.dataLoaded) {
      patient.fetchData(()=>{
        //console.log(`data ready for pt ${patient.id}`);
      })
    }
  }
  componentWillReceiveProps(props) {
    const {patient} = props;
    if (!patient.dataLoaded) {
      //console.log(`componentUpdate fetching data, patient: ${patient.id}`);
      patient.fetchData(()=>{
        //console.log(`componentUpdate data ready for pt ${patient.id}`);
      })
    }
  }
  render() {
    const {patient, field, args} = this.props;
    //if (patient.id > 12) debugger;
    return <div>{patient && patient.get(field, args) || 'no data'}</div>;
  }
}
export class Timeline extends Component {
  constructor() {
    super();
    this.state = {
    };
  }
  render() {
    const {dots, width, height} = this.props;
    return (<div
            style={{display: (dots && dots.length && 'block' || 'none'),
                    //height:height+'px', 
                    width:width+'px',
                    fontSize: 10, //overflow: 'auto',
                  }} />);
  }
  componentDidUpdate(nextProps, nextState) {
    const {dots} = this.props;
    let chart = this.state.chart;
    let el = ReactDOM.findDOMNode(this);
    //let data = this.state.starwars.slice(3);
    chart && chart.data(dots || []);
    //let layers = d3.max(d3.select(el).selectAll('.label-g').data().map(d=>d.layerIndex))||-1 + 1;
    //console.log(`layers: ${layers}`);

  }
  componentDidMount() {
    const {dots, width, height, opts, timelineMouseEvents} = this.props;
    let el = ReactDOM.findDOMNode(this);
    var chart = new d3KitTimeline.Timeline(el, opts);
    for (let e in timelineMouseEvents) {
      chart.on(e, timelineMouseEvents[e]);
    }
    chart.data([]);
    this.setState({chart});
  }
}
function condNames(rec) {
  let names = _.chain([ 'soc_concept_name', 
            'hglt_concept_name',
            'hlt_concept_name',
            'pt_concept_name',
            'concept_name'
          ]).map(d=>rec[d]).compact().value();
  names.forEach((name, i) => rec['name_' + i] = name);
}
