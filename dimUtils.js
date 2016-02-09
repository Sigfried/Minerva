import _ from 'supergroup';


export function propList(recs, cb) {
  if (! (_.isArray(recs) && recs.length && _.isObject(recs[0])))
    return [];
  let rec = recs[0];
  let props = _.keys(rec);
  if (cb)
    props = props.map(cb);
  return props;
}
export function fromRecs(recs) {
  let list = propList(recs);
  return list.map(dimFromPropName).map(
    d => Object.assign(d, 
          {vals: _.supergroup(recs, d.field)}));
}
export function dimFromPropName(propName) {
  let parts = propName.split('_');
  let pretty = parts.map(
    s => s[0].toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
  return {field: propName, name: pretty};
}
