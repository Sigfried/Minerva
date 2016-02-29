import React, { Component, PropTypes } from 'react';
import { Table, Column, Cell } from 'fixed-data-table';
import {Patient, PatientDisplay, Timeline} from './Patient';

export class PatientGroup extends Array {
  constructor(data, opts={}) {
    /* expecting (for now) data like:
    "person_id","age","gender","race","ethnicity","era_start_date","era_end_date","domain_id","concept_name","pt_concept_name","hlt_concept_name","hlgt_concept_name","soc_concept_name","concept_id","concept_code"
    0,83,"Male","White","Not Hispanic or Latino","2008-02-19","2008-02-19","Condition","Impacted cerumen","External ear disorders NEC","External ear disorders (excl congenital)","","",374375,"18070006" */
   /*   moved following to server
    let data = rawData.map(d=>{
      let rec = _.clone(d);
      rec.start_date = new Date(rec.era_start_date);
      rec.end_date = new Date(rec.era_end_date);
      condNames(rec);
      return rec;
    });
    */
    super();
    let patients = data.map(pid=>new Patient(pid, null, opts));
    this.push(...patients);
    this.data = data;
  }
  filter(filt) {
    return Object.setPrototypeOf(Array.filter(this, filt), PatientGroup.prototype);
  }
  count() {
    return this.length;
  }
  facet(dims) {
    return _.supergroup(this.data, dims);
  }
  rowHighlight(idx, highlightedPatientIdx) {
    if (idx === highlightedPatientIdx)
      return "highlighted";
  }
  table(opts={}) {
    let filter = opts.patientFilter || ()=>true;
    return <PtTable patients={this.filter(filter)} 
                    highlightPatient={opts.highlightPatient}
                    rowHighlight={(idx)=>this.rowHighlight.bind(this)(idx,opts.highlightedPatientIdx)}
                    granularity={opts.granularity}
                    evtColors={opts.evtColors}
                    timelineMouseEvents={opts.timelineMouseEvents}
           />
  }
}
    /*
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
    */
// TABLE STUFF

class TableCell extends Component {
  render() {
    const {patients, rowIndex, field, args, data, ...props} = this.props;
    return (
      <Cell {...props}>
        <PatientDisplay patient={patients[rowIndex]}
            field={field} args={args} />
      </Cell>
      || <div>waiting</div>
    );
  }
}
export class PtTable extends Component {
  ptHover(evt, idx) {
    let pt = this.props.patients[idx];
    let ptId = pt.valueOf();
    this.props.highlightPatient(pt, idx);
  }
  render() {
    const {patients, granularity, timelineMouseEvents, evtColors, rowHighlight} = this.props;
    if (!patients) debugger;
    return (
      <Table
        onRowMouseEnter={this.ptHover.bind(this)}
        rowClassNameGetter={rowHighlight}
        rowsCount={patients.count()}
        rowHeight={35}
        headerHeight={50}
        width={1000}
        height={250}>
        <Column header={<Cell>PersonId</Cell>}
          cell={props => this.getTableCell.bind(this)(props, "id", [])} width={80} />
        <Column header={<Cell>Age</Cell>} 
          cell={props => this.getTableCell.bind(this)(props, "age", [])} width={50} />
        <Column header={<Cell>Gender</Cell>} 
          cell={props => this.getTableCell.bind(this)(props, "gender", [])} width={70} />
        <Column header={<Cell>Race</Cell>} 
          cell={props => this.getTableCell.bind(this)(props, "race", [])} width={70} />
        <Column header={<Cell>Ethnicity</Cell>} 
          cell={props => this.getTableCell.bind(this)(props, "ethnicity", [])} width={180} />
        <Column header={<Cell>Timeline</Cell>} 
          cell={props => this.getTableCell.bind(this)(props, "dotTimeline", [granularity, timelineMouseEvents, evtColors])} width={550} />
      </Table>
    );
  }
  getTableCell(props, field, args) {
    const {patients} = this.props;
    if (!patients) debugger;
    return (
      <Cell {...props}>
        <PatientDisplay patient={patients[props.rowIndex]}
            field={field} args={args} />
      </Cell>);
  }
}
