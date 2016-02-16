
import { createSelector } from 'reselect'
import _ from 'lodash';

export const loc = state => state.router.location;
export const locQuery = state => createSelector(
  loc,
  state => loc.query || {}
);
export const schema = createSelector(
  locQuery,
  state => locQuery.schema || 'phis_dq'
);

let exp = {};
exp.recs = state => state.recs;
exp.rawDims = state => state.dims;
exp.dimList = state => state.dimList;

/*
exp.schema = state => {
  return state.router.location.query.schema || state.config.schema;
};
*/
exp.dimsetset = state => {
  return state.router.location.query.dimsetset || 
    state.datasets.dimsetsets.length &&
    state.datasets.dimsetsets[0].dimsetset || 'dimsetset';
};

exp.filterSettings = state => state.router.location.query.filters;
exp.filteredVals = createSelector(
  exp.filterSettings,
  settings => dim => _.keys(settings && settings[dim.field || dim])
);

exp.highlighted = state => state.router &&
    state.router.location.query.highlighted || [,];

exp.highlightedDim = createSelector(
  exp.highlighted,
  highlighted => highlighted[0]);

exp.highlightedVal = createSelector(
  exp.highlighted,
  highlighted => highlighted[1]);

exp.isDimHighlighted = createSelector(
  exp.highlightedDim,
  highlightedDim => (dim) => highlightedDim === dim.field
);
exp.isValHighlighted = createSelector(
  exp.highlightedDim,
  exp.highlightedVal,
  (highlightedDim, highlightedVal) =>
    (dim,val) => 
      highlightedDim === dim.field &&
      highlightedVal === val.toString()
);

exp.filteredRecs = createSelector(
  exp.recs, exp.filterSettings,
  (recs, filts) => {
    return _.chain(recs).filter(
      rec => {
        let flatFilts = 
          _.chain(filts)
           .map((fs,dimname) => 
                _.map(fs, (setting,val) => [dimname, val, setting]))
           .flatten()
           .filter(f=>f[2]==="true")
           .map(f=>f.slice(0,2)).value();
        return !_.some(flatFilts, ff => rec[ff[0]] === ff[1]);
      }).value();
  });


exp.dimsFoundInRecs = createSelector(
  exp.recs, recs => {
    let k = {};
    recs.forEach(r=>Object.assign(k, r))
    return _.keys(k);
  }
);
exp.extraDims = createSelector(
  exp.rawDims,
  exp.dimsFoundInRecs,
  (dims, other) => _.chain(other)
      .difference(_.keys(exp.dims))
      .map(d => [d, {field: d, name: d, extra: true}])
      .object().value()
);
/*
exp.rawDims2 = createSelector(
  exp.rawDims,
  exp.extraDims,
  (raw, extra) => Object.assign({}, raw, extra)
);
*/

exp.dims = exp.rawDims;

/*
exp.dimsVals = createSelector(
  exp.filteredRecs, exp.dims,
  //exp.filteredRecs, exp.rawDims2,
  (recs, dims) => _.chain(dims).map(dim => 
      [dim.field, dimVals(dim,recs)]).object().value()
);
*/
/*
exp.dims = createSelector(
  exp.rawDims2,
  exp.dimsVals,
  (raw, vals) => _.filter(raw, d=>vals[d.field].length > 1)
);
export const explorer = state => {
  let es = Object.assign({}, state.explorer);
  _.each(exp, (f,k) => es[k] = f(state));
  return es;
}
*/


// OTHER STUFF, not really selectors
//
export const apiId = params => {
  const {api, datasetLabel, schema, where} = params;
  return [api, datasetLabel, schema, 
    JSON.stringify(where||'{}')].join('##');
};
export const parseApiId = str => {
  let [api, datasetLabel, schema, where] = str.split('##');
  try {
  return ({api, datasetLabel, schema,
            where: JSON.parse(where || '{}')});
  } catch(e) {
    debugger;
  }
};

/*
export const dimVals = (dim, recs) =>
  _.supergroup(recs, dim.func || dim.field)
      .sortBy(dim.sortBy || (a=>-a.records.length))
      .addLevel(d=>isFinite(d.value) ? 'Not Missing' : 'Missing',
                {dimName: 'Missing value'});
*/
