//import 'babel-core/polyfill';
import React, {Component} from 'react';
import { render } from 'react-dom';
import 'knockout-react';

export default class Test extends Component {
  render() {
    const {person} = this.props;
    console.log(person);
    let data = this.props.testprop || "nothing came through";
    return <h3>Are we here? {data} {person && person.eraSets && person.eraSets.length} eras</h3>;
  }
}
