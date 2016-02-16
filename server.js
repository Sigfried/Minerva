var pg = require('pg');
var webpack = require('webpack');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');
var config = require('./webpack.config');
var compression = require('compression');
var express = require('express');
//var munge = require('./data/dqcdm_munge');
var _ = require('lodash');

var app = new express();
var port = process.env.PORT || 5000;
app.use(compression())
app.use(express.static('static'))
app.use(express.static('data'));

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

app.get("/data/person_data", function(req, res) {
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
