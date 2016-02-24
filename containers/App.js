import 'babel-polyfill';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { createAction } from 'redux-actions';
import { resetErrorMessage } from '../actions';
import * as Selector from '../selectors';
import PatientViz from '../components/PatientViz';
import * as Actions from '../actions';
import { Navbar, NavBrand, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
//require('expose?$!expose?jQuery!jquery');
//require("bootstrap-webpack");

class App extends Component {
/*
  getChildContext() {
    const {dispatch, router} = this.props;
    return {
      queryChange: (key, val) =>
        Actions.queryChange(
          this.props.dispatch,
          this.props.router,
          key, val),
    };
  }
*/
  componentWillMount() {
    const {configChange, router} = this.props;
    configChange(router, 'granularity', 'month');
    configChange(router, null, null, '/patientviz');
  }
  render() {
        //<PickData tableWidth={700} tableHeight={1000}/>
    const { datasets, configChange, router, apicall, cacheData } = this.props;
    let granularity = router.location.state &&
                      router.location.state.granularity &&
                      router.location.state.granularity || 'month';

    let granularityChoices = ['day','month','year'].map(
      gran => <MenuItem onSelect={() => this.granularityChoose(gran, configChange, router)} key={'gran'+gran} eventKey={gran}>{gran}</MenuItem>);

    let patientViz = this.props.children && this.props.children[0];

    let children = React.Children.map(this.props.children, (child, i) =>
        React.cloneElement(child, {
          apicall,
          cacheData,
          granularity,
          datasets,
          configChange,
          router,
        })
    );
    /*
              <NavItem eventKey={1} href="/dqdata">DQ Data</NavItem>
              <NavItem eventKey={2} href="/seedims">See Dims</NavItem>
    */
    let data = datasets[Selector.apiurl('/data/person_data', router.location.query)] || [];
    let counts = data && data.length && `${data.length} records` || '';
    counts += data && data.length && `, ${data.length} patients` || '';
    return (
      <div>
        <Navbar>
            <NavBrand><a href="/">Miverva / OHDSI</a></NavBrand>
            <Nav>
              <NavItem eventKey={3} href="/patientviz">Patient Viz</NavItem>
            </Nav>
            <Nav>
              <NavDropdown eventKey={4} title={granularity || 'Choose granularity'} id="basic-nav-dropdown">
                {granularityChoices}
              </NavDropdown>
              <NavItem>{counts}</NavItem>
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
  granularityChoose(granularity, configChange, router) {
    configChange(router, 'granularity', granularity);
  }
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
    //explorer: Selector.explorer(state),
    router: state.router,
    viz_data: state.viz_data,
    datasets: state.datasets,
    //inputValue: state.router.location.pathname.substring(1),
    //explorer: state.explorer,
    //explorer: state.explorer.explorerReducer,
  };
}

export default connect(mapStateToProps, {
  apicall: Actions.apicall,
  cacheData: Actions.cacheData,
  configChange: Actions.configChange,
  resetErrorMessage,
  dispatch: d => d
  //pushState,
})(App);
