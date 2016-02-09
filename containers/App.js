import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { createAction } from 'redux-actions';
import { resetErrorMessage } from '../actions';
import * as Selector from '../selectors';
import PatientViz from '../components/PatientViz';

import * as ExplorerActions from '../actions';
import { Navbar, NavbarBrand, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
//require('expose?$!expose?jQuery!jquery');
//require("bootstrap-webpack");

class App extends Component {
/*
  getChildContext() {
    const {dispatch, router} = this.props;
    return {
      queryChange: (key, val) =>
        ExplorerActions.queryChange(
          this.props.dispatch,
          this.props.router,
          key, val),
    };
  }
*/
  componentWillMount() {
    const {configChange, router} = this.props;
    configChange(router, null, null, '/patientviz');
  }
  render() {
        //<PickData tableWidth={700} tableHeight={1000}/>
    const { explorer, configChange, router, apicall } = this.props;

    let apiparams = {
        api:'dimsetsets',
        datasetLabel: 'dimsetsets-summary',
    };
    /*
    let dimsetsets = explorer.datasets[Selector.apiId(apiparams)];
    let dimsetsetChoices = dimsetsets ?
      _.sortBy(dimsetsets, d => -d.records)
      .map(
        dc => <MenuItem onSelect={this.dssChoose.bind(this)} key={'dss'+dc.dimsetset} eventKey={dc.dimsetset}>{dc.dimsetset} ({dc.records})</MenuItem>)
      : '';
    */

    //console.log('dimsetsetchoices', dimsetsetChoices, dimsetsets);
    let children = React.Children.map(this.props.children, (child, i) =>
        React.cloneElement(child, {
          apicall,
          datasets: explorer.datasets,
          dimsetset: explorer.dimsetset,
          recs: explorer.recs,
        })
    );
    /*
              <NavItem eventKey={1} href="/dqdata">DQ Data</NavItem>
              <NavItem eventKey={2} href="/seedims">See Dims</NavItem>
    */
    return (
      <div>
        <Navbar>
            <NavbarBrand><a href="/">Cassandra / OHDSI</a></NavbarBrand>
            <Nav>
              <NavItem eventKey={3} href="/patientviz">Patient Viz</NavItem>
            </Nav>
          </Navbar>
        {this.renderErrorMessage()}
        {children}
      </div>
    );
    /*
              <NavDropdown eventKey={5} title={router.location.query.dimsetset || 'Choose dimsetset'} id="basic-nav-dropdown">
                {dimsetsetChoices}
              </NavDropdown>
    */
  }
/*
  dssChoose(evt, dss) {
    ExplorerActions.queryChange(
      this.props.dispatch,
      this.props.router,
      'dimsetset', dss);
    //location.reload();
  }
*/
  renderErrorMessage() {
    const { errorMessage } = this.props;
    if (!errorMessage) {
      return null;
    }

    return (
      <p style={{ backgroundColor: '#e99', padding: 10 }}>
        <b>{errorMessage}</b>
        {' '}
        (<a href="#"
            onClick={this.handleDismissClick}>
          Dismiss
        </a>)
      </p>
    );
  }
}
App.childContextTypes =  {
  queryChange: React.PropTypes.func,
};
        /*
        <hr />
        <Explore value={inputValue}
                 onChange={this.handleChange} />
        */
        // not sure what this stuff from example does, may be useful later

App.propTypes = {
  // Injected by React Redux
  //errorMessage: PropTypes.string,
  //resetErrorMessage: PropTypes.func.isRequired,
  //pushState: PropTypes.func.isRequired,
  //inputValue: PropTypes.string.isRequired,
  //explorer: PropTypes.object.isRequired,
  // Injected by React Router
  children: PropTypes.node
};

function mapStateToProps(state) {
  return {
    errorMessage: state.errorMessage,
    explorer: Selector.explorer(state),
    router: state.router,
    viz_data: state.viz_data
    //inputValue: state.router.location.pathname.substring(1),
    //explorer: state.explorer,
    //explorer: state.explorer.explorerReducer,
  };
}

export default connect(mapStateToProps, {
  apicall: ExplorerActions.apicall,
  configChange: ExplorerActions.configChange,
  resetErrorMessage,
  dispatch: d => d
  //pushState,
})(App);
