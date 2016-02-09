import {createAction} from 'redux-actions';
export const CLICK_CHART = 'CLICK_CHART';

export const clickChart = createAction(CLICK_CHART);

export function onChartClick(what) {
  return (dispatch, getState) => {
    const { chartdata } = getState();
    var action = clickChart(what);
    dispatch(clickChart(what));
  };
}

export function incrementAsync(delay = 1000) {
  return dispatch => {
    setTimeout(() => {
      dispatch(increment());
    }, delay);
  };
}

