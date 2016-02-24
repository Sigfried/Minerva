import {createAction} from 'redux-actions';
import { pushState } from 'redux-router';
//import fetch from 'isomorphic-fetch';
import _ from 'supergroup-es6';
import * as dimUtils from '../dimUtils';
import * as Selectors from '../selectors';
require('isomorphic-fetch');

// old stuff... still using what? configChange... ?

export const CONFIG_CHANGED = 'CONFIG_CHANGED';
export const configChange = (router, key, val, path) => {
  let query = router.location.query;
  if (typeof key !== "undefined" && key !== null)
    query[key] = val;
  return pushState(query, path || router.location.pathname, query);
}

export const queryChange = (dispatch, router, key, val) => {
  let query = router.location.query;
  query[key] = val;
  dispatch(pushState(query, router.location.pathname, query));
};

export const DATA_REQUESTED = 'DATA_REQUESTED';
export const DATA_RECEIVED = 'DATA_RECEIVED';
export const DIMLIST_SET = 'DIMLIST_SET';
const requestData = createAction(DATA_REQUESTED);

export const DATA_CACHED = 'DATA_CACHED';
export const cacheData = createAction(DATA_CACHED);

export function apicall(path, query, dontFetch) {
  const url = Selectors.apiurl(path, query);

  return (dispatch, getState) => {
    const state = getState();
    if (state.datasets[url]) {
      if (state.datasets[url].requestedOnly)
        return 'requested';
      return 'ready';
    }
    if (dontFetch)
      return 'not requested';
    console.log('new API call', url);
    dispatch(requestData({key:url}));

    return fetch(url)
      .then(response => response.json())
      .then(json => { //debugger;
        console.log('API call', url, 'returned', json);
        dispatch(cacheData({key:url,data:json}))
      })
  }
}

