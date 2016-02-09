import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Table, Column } from 'fixed-data-table';
import _ from 'supergroup';
//var css = require("css!./lineChart.css"); // hitting some bug...won't compile
// including dist/fixed-data-table.css from index.html
//import d3 from 'd3';

export default class DataTable extends Component {
    render() {
      const { recs, width, height, cols } = this.props;
      if (!(recs && recs.length))
        return (<div/>);

      const columnNames = cols || _.keys(recs[0]);
      let colidx = 0;
      const columns = _.map(columnNames,
            col => <Column
                  isResizable={true}
                  label={col}
                  width={(Math.min(20, (_.chain(recs) // 50 max col width
                    .pluck(col)
                    .pluck('length').concat(5) // 5 min col width
                    .max()
                    .value())) + 10) * 7}
                  dataKey={colidx++}
                  key={colidx}
                />);
                  //width={colval1.length + 'em'}

      function rowGetter(rowIndex) {
        let row = _.values(_.pick(recs[rowIndex], columnNames))
        return row;
      }
      function resize(newWidth, datakey) {
        //console.log(newWidth, datakey);
        debugger;
      }
      return ( 
            <div>
              <Table
                onColumnResizeEndCallback={resize}
                onRowClick={
                  (evt,idx,row)=>
                    this.props.rowClick(recs[idx])}
                rowHeight={25}
                rowGetter={rowGetter}
                rowsCount={recs.length}
                width={width || 800}
                height={height || 300}
                headerHeight={40}>
                {columns}
              </Table>
            </div>
            );
    }
}
