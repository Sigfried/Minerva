//import 'babel-core/polyfill';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { ReduxRouter } from 'redux-router';
import configureStore from './store/configureStore';
//import { devTools, persistState } from 'redux-devtools';
//import { DevTools, DebugPanel, LogMonitor } from 'redux-devtools/lib/react';
//import explorerconf from './explorer.conf';

const store = configureStore();
window.store = store; // for debugging
console.log('making window.store available for debugging');

render(
  <div>
  <Provider store={store}>
    <ReduxRouter />
  </Provider>
  </div>,
  document.getElementById('root')
);
/*
  <DebugPanel top right bottom>
      <DevTools store={store} monitor={LogMonitor} />
  </DebugPanel>
*/

if (process.env.NODE_ENV !== 'production') {
  // Use require because imports can't be conditional.
  // In production, you should ensure process.env.NODE_ENV
  // is envified so that Uglify can eliminate this
  // module and its dependencies as dead code.
  //require('./createDevToolsWindow')(store);
}
