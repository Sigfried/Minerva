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
function granularityDenom(granularity) {
  let denom = 1;
  if (granularity === "month")
    denom = 30;
  if (granularity === "year")
    denom = 365;
  return denom;
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
  dateRange(granularity) {
    let denom = granularityDenom(granularity);
    return this._date_range || 
          (this._data_range = [
            Math.round(_.min(this.eras.map(d=>d.days_from_index)) / denom),
            Math.round(_.max(this.eras.map(d=>d.days_from_index)) / denom),
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
  dotTimeline(granularity, timelineMouseEvents, evtColors) {
    if (!this.dataLoaded) {
      return <div/>;
      return <div>Waiting for data for patient {this.id}</div>;
    }
    let dr = this.dateRange(granularity);
    let zeroCenterDomain = [ -(Math.max(Math.abs(dr[0]),Math.abs(dr[1]))),
                              (Math.max(Math.abs(dr[0]),Math.abs(dr[1])))];
    let timelineOpts = 
          {
            direction: 'down',
            initialWidth: 500,
            initialHeight: 150,
            layerGap: 30,
            margin: {left: 20, top: 10, right: 20, bottom: 10},
            labella: {
              //minPos: 100, 
              maxPos: 300 * .85, //stubWidth: 100,
              nodeHeight: 25,
            },
            //dotsOnly: true,
            scale: d3.scale.linear(),
            domain: zeroCenterDomain,
            timeFn: d => d.valueOf(),
            textFn: d => `${d.records.length} events`,
            dotRadius: d => Math.pow(d.records.length, 3/4),
            //dotColor: 'rgba(50, 80, 100, 0.5)',
            dotColor: dot => {
              //if (dot.valueOf() === 0) return 'red';
              //let highlighted = _.any(dot.children, evt=> _.contains(this.opts.getHighlightedEvts(), evt.toString())); // SLOW!
              //return highlighted ?  'rgba(70, 130, 150, 0.8)' : 'rgba(50, 80, 100, 0.2)';
              let dotColor = 'rgba(50, 80, 100, 0.3)';
              _.any(evtColors, (color, specialEvt) => {
                if (_.any(dot.children, evt => evt == specialEvt))
                  dotColor = color;
              });
              //if (dot == 0) debugger;
              return dotColor;
            },
            linkColor: 'rgba(50, 80, 100, 0.5)',
          };
    return <Timeline width={300}
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
    let ext = this.dateRange();
    let dr = ext[1] - ext[0];
    return <div>
       Pt {this.get('id')}: {this.get('age')} {this.get('race')} {this.get('gender')}. {
         this.eras.length} eras; {dr} days of history; 
         Events group into {this.periods('day').length} distinct days, {
           this.periods('month').length} months, or {
             this.periods('year').length} years
       </div>;
  }
  rowByDaysFromIndex(days = 0, granularity) {
    let multiplier = granularityDenom(granularity);
    let spot = days * multiplier;
    return _.findIndex(this.eras, d=>d.days_from_index >= spot) - 1;
  }
}
export class PatientDisplay extends Component {
  constructor() {
    super();
    this.state = {dataLoaded:false};
  }
  componentDidMount() {
    const {patient} = this.props;
    //console.log(`fetching data, patient: ${patient.id}`);
    if (!patient.dataLoaded) {
      patient.fetchData(()=>{
        this.setState({dataLoaded:patient.dataLoaded});
        //console.log(`data ready for pt ${patient.id}: ${patient.dataLoaded}`);
      })
    }
  }
  componentWillReceiveProps(props) {
    const {patient} = props;
    if (!patient.dataLoaded) {
      //console.log(`componentUpdate fetching data, patient: ${patient.id}`);
      patient.fetchData(()=>{
        this.setState({dataLoaded:patient.dataLoaded});
        //console.log(`data ready for pt ${patient.id}: ${patient.dataLoaded}`);
      })
    }
  }
  render() {
    const {patient, field, args} = this.props;
    return <div>{patient && patient.get(field, args) || ''}</div>;
    if (!this.state.dataLoaded) // this was supposed to help load cells without
                                // user having to mouseover them. it's not working
                                // leaving in place and moving on for now
      return <div/>;
    return <div>{patient.get(field, args)}</div>;
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
    const {dots, opts} = this.props;
    let chart = this.state.chart;
    //console.log(opts.domain, dots && dots[0].records[0]);
    chart.options(opts);
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
