import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
//import DataTable from './DataTable';
import { Table, Column, Cell } from 'fixed-data-table';
import ApiWrapper from './Wrapper';
import Histogram from './Histogram';
import { Grid, Row, Col, Glyphicon, Button, Panel, ButtonToolbar, Input } from 'react-bootstrap';
import * as Selector from '../selectors';
import _ from 'supergroup';
import {Timeline} from './Timeline';
//var css = require('css!bootstrap/dist/css/bootstrap.css');
require('!style!css!fixed-data-table/dist/fixed-data-table.min.css');
//require("!style!css!less!bootstrap/less/bootstrap.less");
require('expose?$!expose?jQuery!jquery');
require("bootstrap-webpack");

class TableCell extends React.Component {
  render() {
    const {rowIndex, field, data, ...props} = this.props;
    return (
      <Cell {...props}>
        {data[rowIndex][field]}
      </Cell>
    );
  }
}
class PtTable extends React.Component {
  constructor(props) {
    super(props);
    const {data, ptEras} = props;
    this.state = {
      PtTableData: data.length && data || [],
      ptEras,
    };
  }
  componentWillReceiveProps(props) {
    const {data, ptEras} = props;
    this.setState({
      PtTableData: data.length && data || [],
      ptEras,
    });
  }
  ptHover(evt, idx) {
    let ptId = this.state.PtTableData[idx].person_id;
    let pt = this.state.ptEras.lookup(ptId);
    this.props.parent.setState({showPt: pt});
    console.log(`highlight pt ${pt.person_id}`);
  }
  render() {
    return (
      <Table
        onRowMouseEnter={this.ptHover.bind(this)}
        rowsCount={this.state.PtTableData.length}
        rowHeight={25}
        headerHeight={50}
        width={700}
        height={250}>
        <Column
          header={<Cell>PersonId</Cell>}
          cell={
            <TableCell
              data={this.state.PtTableData}
              field="person_id"
            />
          }
          width={100}
        />
        <Column
          header={<Cell>Dates</Cell>}
          cell={
            <TableCell
              data={this.state.PtTableData}
              field="dates"
            />
          }
          width={100}
        />
        <Column
          header={<Cell>Conditions</Cell>}
          cell={
            <TableCell
              data={this.state.PtTableData}
              field="Condition"
            />
          }
          width={100}
        />
        <Column
          header={<Cell>Drugs</Cell>}
          cell={
            <TableCell
              data={this.state.PtTableData}
              field="Drug"
            />
          }
          width={100}
        />
        <Column
          header={<Cell>Days</Cell>}
          cell={
            <TableCell
              data={this.state.PtTableData}
              field="days"
            />
          }
          width={100}
        />
        <Column
          header={<Cell>Eras</Cell>}
          cell={
            <TableCell
              data={this.state.PtTableData}
              field="eras"
            />
          }
          width={100}
        />
      </Table>
    );
  }
}
export default class PatientViz extends Component {
  constructor() {
    super();
    this.state = {
      data:[], 
      dataForTable:[],
    };
  }
  render() {
    let {width, height} = this.props;
    width = (typeof width === "undefined") && 1100 || width;
    height = (typeof height === "undefined") && 500 || height;
    const {data, dataForTable, ptEras, showPt} = this.state;
    let timelineOpts = 
          {
            direction: 'down',
            initialWidth: width,
            initialHeight: height,
            labella: {
              //minPos: 100, 
              maxPos: width * .85, //stubWidth: 100,
            },
            timeFn: d => d.start_date,
            textFn: d => d.concept_name,
          };
    return  <div> 
              <h2>Here we are! 
                {data.length} records,  
                {dataForTable.length} patients
              </h2>
              <Timeline height={height} width={width}
                opts={timelineOpts}
                eras={showPt && showPt.records}
              >
              </Timeline>
              <PtTable 
                  data={dataForTable} 
                  ptEras={ptEras}
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
  componentWillMount() {
    let self = this;
    d3.csv('./data/person_data.csv', data => {
      data.forEach(rec=>{
        rec.start_date = new Date(rec.era_start_date);
        rec.end_date = new Date(rec.era_end_date);
      });
      let ptStartDates = _.supergroup(data, ['person_id','start_date']);
      let ptDateMins = ptStartDates.aggregates(_.min,'start_date','dict');
      let ptEndDates = _.supergroup(data, ['person_id','start_date']);
      let ptDateMaxes = ptEndDates.aggregates(_.max,'end_date','dict');
      let ptEras = _.supergroup(data,
        ['person_id', 'domain_id', 'soc_concept_name', 'concept_name']);
      let dataForTable = ptEras.map(d=>
        { 
          let p = {
            person_id: d.toString(),
            dates: ptStartDates.lookup(d).children.length,
            days: (ptDateMaxes[d] - 
                   ptDateMins[d]) / 
                     (1000 * 60 * 60 * 24),
            eras: d.records.length,
          };
          d.children.forEach(domain=>{
            p[domain] = domain.children.length;
          });
          return p;
        });
      self.setState({data, dataForTable, ptEras});
    });
  }
}
