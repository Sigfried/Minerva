import * as ActionTypes from '../actions';
import merge from 'lodash/object/merge';
import { routerStateReducer as router } from 'redux-router';
import { combineReducers } from 'redux';
import {DATA_RECEIVED, SUPERGROUPED_DIM, DIMLIST_SET,
        DATA_CACHED,
        CONFIG_CHANGED,
        DATA_REQUESTED,
        //MSG,
       } from '../actions';

// Updates an entity cache in response to any action with response.entities.
function entities(state = { users: {}, repos: {} }, action) {
  if (action.response && action.response.entities) {
    return merge({}, state, action.response.entities);
  }

  return state;
}

// Updates error message to notify about the failed fetches.
function errorMessage(state = null, action) {
  const { type, error } = action;

  if (type === ActionTypes.RESET_ERROR_MESSAGE) {
    return null;
  } else if (error) {
    return action.error;
  }

  return state;
}
function datasets(state = {person_data:[]}, action) {
  switch (action.type) {
    case DATA_RECEIVED:
      if (!Array.isArray(action.payload))
        return Object.assign({}, state, action.payload);
    case DATA_REQUESTED:
      let empty = [];
      empty.requestedOnly = true;
      return Object.assign({}, state,
              { [action.payload.apistring]: empty });
    case DATA_CACHED:
      const {apistring, url, data} = action.payload;
      if (state[apistring] && !state[apistring].requestedOnly &&
          _.isEqual(state[apistring], data))
        debugger;
      return Object.assign({}, state,
        { [action.payload.apistring]: action.payload.data });
    default:
      return state;
  }
}
const rootReducer = combineReducers({
  datasets,
  entities,
  errorMessage,
  router,
});

export default rootReducer;
