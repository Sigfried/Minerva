import React, { Component, PropTypes } from 'react';
import { Table, Column, Cell } from 'fixed-data-table';
import {Patient, Timeline} from './Patient';

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

class TableCell extends React.Component {
  render() {
    const {rowIndex, field, args, data, ...props} = this.props;
    return (
      <Cell {...props}>
        { data.length && data[rowIndex].get(field, args) || '' }
      </Cell>
    );
  }
}
export class PtTable extends React.Component {
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
        width={800}
        height={250}>
        <Column header={<Cell>PersonId</Cell>}
          cell={ <TableCell data={this.state.patients} field="id" args={[]}/> } width={100} />
        <Column header={<Cell>Days w/ Events</Cell>} 
          cell={ <TableCell data={this.state.patients} field='eventPeriods' args={['day']} /> } width={100} />
        <Column header={<Cell>Months w/ Events</Cell>} 
          cell={ <TableCell data={this.state.patients} field='eventPeriods' args={['month']} /> } width={100} />
        <Column header={<Cell>Years w/ Events</Cell>} 
          cell={ <TableCell data={this.state.patients} field='eventPeriods' args={['year']} /> } width={100} />
      </Table>
    );
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
