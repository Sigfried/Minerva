"use strict";
var NO_DB = true;
var fs = require('fs');
var pg = require('pg');
var webpack = require('webpack');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');
var config = require('./webpack.config');
var compression = require('compression');
var express = require('express');
//var munge = require('./data/dqcdm_munge');
require('babel-polyfill');
var _ = require('supergroup-es6').default; // why need default?

let json = fs.readFileSync('./static/data/person_data_all.json');
let data = JSON.parse(json);
let patients = _.supergroup(data, 'person_id');


var app = new express();
var port = process.env.PORT || 5000;
app.use(compression())
app.use(express.static('static'))
//app.use('/data', express.static('static/data'));

var compiler = webpack(config);
app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath }));
app.use(webpackHotMiddleware(compiler));

app.listen(port, function(error) {
  if (error) {
    console.error(error);
  } else {
    console.info("==> 🌎  Listening on port %s. Open up http://localhost:%s/ in your browser.", port, port);
  }
});

app.get("/data/person_ids", function(req, res) {
  res.json(patients.rawValues());
});
app.get("/data/patient/:id", function(req, res) {
  let pt = patients.lookup(req.params.id);
  console.log(`pt ${req.params.id} found: ${!!pt}`);
  res.json(patients.lookup(req.params.id).records);
});
app.get("/data/person_data", function(req, res) {
  if (NO_DB) {
    console.log(req.query);
    readJSONFile( './static/data/person_data_all.json',
        function (err, json) {
          if(err) { throw err; }
          console.log(json.length);
          let data = json.map(rec=>{
            rec.start_date = new Date(rec.era_start_date);
            rec.end_date = new Date(rec.era_end_date);
            condNames(rec);
            return rec;
          });
          if (req.query.indexEvt) {
            let byEvt = _.supergroup(data, ['name_0','person_id']);
            let evt = byEvt.lookup(req.query.indexEvt);
            console.log(`${evt.children.length} patients with ${evt}`);
            let cohortIds = evt.children.rawValues();
            let indexDates = [];
            evt.children.forEach(p=>{
              let pid = Number(p);
              indexDates[pid]= new Date();
              p.records.forEach(r=>{
                indexDates[pid] = Math.min(r.start_date, indexDates[pid]);
              });
            })
            let cohortRecs = data.filter(d=>_.contains(cohortIds,d.person_id));
            let pts = _.supergroup(cohortRecs,'person_id');
            pts.forEach(p=>{
              let pid = Number(p);
              p.records.forEach(r=>{
                r.days_from_index = daysDiff(indexDates[pid], r.start_date)
                r.index_date = indexDates[pid];
              });
            });
            res.json(pts.records);
          } else {
            res.json(data);
          }
        });
    //res.sendFile('./static/data/person_data_all.json',{ root: __dirname });
    return;
  }
  var q = 'SELECT * ' +
          'FROM cdm.person_data LIMIT 5000';
  var postprocess = rows=>rows.map(row=> {
    try {
      return _.extend(row, {
        age:parseInt(row.age),
      });
    } catch(e) {
      console.error(e);
    }
  });
  getData(q, null)
    .then(json => {
      console.log(req.url, json.length, 'results');
      if (postprocess)
        return postprocess(json);
      return json;
    })
    .then(json => res.json(json));
});
app.use(function(req, res) {
  res.sendFile(__dirname + '/index.html');
});


function pgErr(msg, err, done, reject, client) {
  console.log(msg, err.toString());
  done();
  client.end();
  reject(err.error);
}
function getData(sql, params) {
  console.log(sql, params && params.length && params || '');
  var promise = new Promise(function(resolve, reject) {
      pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        if (err) {
          console.log("connection error", err);
          reject(Error("connection failed", err));
          return;
        }
        //console.log(sql, params);
        var query = client.query(sql, params);
        query.on('error', function(err) {
          done();
          pgErr('getData(' + sql + ': ' + (params&&params||'') + ')',
                err, done, reject, client);
          reject(Error("getData failed", err));
        })
        query.on('row', function(row, result) {
          result.addRow(row);
        });
        query.on('end', function(result) {
          //console.log(result.rows.length, 'from', sql);
          //var ret = dqmunge.mungeDims(result.rows);
          resolve(result.rows);
          done();
        });
      });
    });
    return promise;
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

function readJSONFile(filename, callback) {
  fs.readFile(filename, function (err, data) {
    if(err) {
      callback(err);
      return;
    }
    try {
      callback(null, JSON.parse(data));
    } catch(exception) {
      callback(exception);
    }
  });
}
function daysDiff(d0, d1) {
    var diff = new Date(+d1).setHours(12) - new Date(+d0).setHours(12);
      return Math.round(diff/8.64e7);
}
