import React from 'react';
import { Route } from 'react-router';
import App from './containers/App';
import PatientViz from './components/PatientViz';
//import UserPage from './containers/UserPage';
//import RepoPage from './containers/RepoPage';

export default (
  <Route path="/" component={App}>
    <Route path="/patientviz"
           component={PatientViz} />
  </Route>
);
/*
    <Route path="/seedims"
           component={SeeDims} />
    <Route path="/dqdata"
           component={DQData} />
export default (
  <Route path="/" component={DQData}>
    <Route path="/:login/:name"
           component={RepoPage} />
    <Route path="/:login"
           component={UserPage} />
  </Route>
);
*/
