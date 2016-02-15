import {createAction} from 'redux-actions';
import { pushState } from 'redux-router';
//import fetch from 'isomorphic-fetch';
import _ from 'supergroup-es6';
import * as dimUtils from '../dimUtils';
import * as Selectors from '../selectors';
require('isomorphic-fetch');

export const CONFIG_CHANGED = 'CONFIG_CHANGED';
export const configChange = (router, key, val, path) => {
  let query = router.location.query;
  if (typeof key !== "undefined" && key !== null)
    query[key] = val;
  return pushState(query, path || router.location.pathname, query);
}

/*
// should be pathChange, not schemaChange
export const schemaChange = (dispatch, router, schema) => {
  let query = router.location.query;
  query.schema = schema;
  dispatch(pushState(query, router.location.pathname, query));
};
*/
export const queryChange = (dispatch, router, key, val) => {
  let query = router.location.query;
  query[key] = val;
  dispatch(pushState(query, router.location.pathname, query));
};

export const DATA_REQUESTED = 'DATA_REQUESTED';
export const DATA_RECEIVED = 'DATA_RECEIVED';
export const DIMLIST_SET = 'DIMLIST_SET';
const requestData = createAction(DATA_REQUESTED);

const receiveData = createAction(DATA_RECEIVED);

export const DATA_CACHED = 'DATA_CACHED';
const cacheData = createAction(DATA_CACHED);

export function apicall(apistring, dontFetch) {
  if (typeof apistring !== 'string')
        debugger;

  const params = Selectors.parseApiId(apistring);

  return (dispatch, getState) => {
    const state = getState();
    if (state.explorer.datasets[apistring]) {
      if (state.explorer.datasets[apistring].requestedOnly)
        return 'requested';
      return 'ready';
    }
    if (dontFetch)
      return 'not requested';
    console.log('new API call', apistring);
    let url = apiurl(params);
    dispatch(requestData({apistring, url:url}));

    return fetch(url)
      .then(response => response.json())
      /*
      .then(json => {
        if (callbacks.recsFilter)
          json = json.filter(callbacks.recsFilter);
        if (callbacks.recsMap)
          json = json.map(callbacks.recsMap);
        if (callbacks.sortBy)
          json = _.sortBy(json, callbacks.sortBy);
        if (dataset)
          dispatch(receiveData({[dataset]: json}))
        else
          dispatch(receiveData(json))
        return json;
      })
      .then(callbacks.postFetchAction || (d=>d))
      */
      .then(json => { //debugger;
        console.log('API call', apistring, 'returned', json);
        dispatch(cacheData({apistring, url:url,data:json}))
      })
  }
}
function apiurl(params={}) {
  let {schema, api, where, datasetLabel} = params;
  if (!(schema && api && datasetLabel))
    debugger;
  let qs = _.chain(where).pairs()
              .map(d=>d.join('='))
              .join('&').value();
  let url = '/data/' + schema + '/' + api + '?' + qs;
  return url;
}
/*
export function fetchRecsAsync(apiquery) {
  return dispatch => {
    dispatch(requestData(apiquery));
    return fetch('/data/' + apiquery)
      .then(response => response.json())
      .then(json => {
        dispatch(receiveData(json))
      });
  }
}
*/

const dimsSet = createAction(DIMLIST_SET);
export function setDimsFromRecs(recs) {
  let dims = dimUtils.fromRecs(recs);
  return dimsSet(dims);
}
/*
export const SUPERGROUPED_DIM = 'SUPERGROUPED_DIM';
const supergrouped =  // puts dim into meta
  createAction(SUPERGROUPED_DIM, (data,dim)=>data, (data,dim)=>dim);
export function supergroup(dim, recs) {
  var sg = _.supergroup(recs, dim.func || dim.field);
  if (sg.length)
    sg = sg.sortBy(dim.sortBy || (a=>-a.records.length));
  //DEBUG
  //sg = sg.slice(0,3);
  var action = supergrouped(sg, dim);
  return action;
  //return dispatch(action);
}
*/
export function supergroupAsync(dim, recs) {
  return (dispatch, getState) => {
    var sg = _.supergroup(recs, dim.func || dim.field);
    if (sg.length)
      sg = sg.sortBy(a=>-a.records.length);
    //DEBUG
    //sg = sg.slice(0,3);
    var action = supergrouped(sg, dim);
    return dispatch(action);
  };
}
export const valHighlighted = (dispatch, router, dim, val) => {
  let query = router.location.query;
  if (dim && val)
    query.highlighted = [dim.field, val.toString()];
  else
    delete query.highlighted;
  dispatch(pushState(query, router.location.pathname, query));
};
export const filterOut = (dispatch, router, dim, val, which) => {
  //const { pushState, explorer, router, dispatch } = this.context;
  //const { dim, val } = this.props;
  let query = router.location.query;
  query.filters = query.filters || {};
  query.filters[dim.field] = query.filters[dim.field] || {};
  if (which === false)
    delete query.filters[dim.field][val];
  else
    query.filters[dim.field][val] = true;
  dispatch(pushState(query, router.location.pathname,query));
};

/*
export const MSG = 'MSG';
export const messageChanged = createAction(MSG);
export const sgValMsg = createAction(MSG,
  d=>d,
  (val,dim,ctr)=>{return {
    name:dim.field||'general', val:val, dim:dim,ctr:ctr}});
*/

