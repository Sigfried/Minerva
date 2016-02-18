import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import d3KitTimeline from '../d3Kit-timeline/dist/d3Kit-timeline';

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
  dotTimeline(granularity, timelineEvents) {
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
            dotColor: 'rgba(50, 80, 100, 0.5)',
            linkColor: 'rgba(50, 80, 100, 0.5)',
          };
    return <Timeline height={150} width={300}
                opts={timelineOpts}
                timelineEvents={timelineEvents}
                    eras={this.eventsBy(granularity)}
                  />
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
    if (this.eras.length && field in this.eras[0]) // pt.get('race')
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
export class Timeline extends Component {
  constructor() {
    super();
    this.state = {
    };
  }
  render() {
    const {eras, width, height} = this.props;
    return (<div
            style={{display: (eras && eras.length && 'block' || 'none'),
                    //height:height+'px', 
                    width:width+'px',
                    fontSize: 10, //overflow: 'auto',
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
    const {eras, width, height, opts, timelineEvents} = this.props;
    let el = ReactDOM.findDOMNode(this);
    var chart = new d3KitTimeline.Timeline(el, opts);
    for (let e in timelineEvents) {
      chart.on(e, timelineEvents[e]);
    }
    chart.data([]);
    this.setState({chart});
  }
}
