import React, { Component, PropTypes } from 'react';
import * as Selector from '../selectors';

/*
    <ApiWrapper apiParams={{api, where, datasetLabel}} >
        <ChildComponent />
    </ApiWrapper>
 */

export default class ApiWrapper extends Component {
    constructor(props) {
        super();
        this.state = {};
        this.state.apiString;
        this.state.data = props.startingData || [];
        this.state.dataReady = false;
        this.state.dataRequested = false;
    }
    getData(props) {
        const {apiParams, apicall, startingData, datasets} = props;
        let {apiString, data, dataReady, dataRequested} = this.state;

        //console.log('getData', dataReady, dataRequested, apiParams.where, data, arguments);

        if (_.isEmpty(apiParams)) {
            if (!_.isEmpty(data))
                this.setState({data: [], dataReady: false, apiString: null});
            return;
        }

        let newRequest = true;
        if (_.isEqual(this.state.apiParams, apiParams)) {
            if (dataReady) // nothing left to do
                return;
            if (dataRequested) {
                newRequest = false;
            }
        }

        const curApiString = Selector.apiId(apiParams);
        if (apiString === curApiString && newRequest) {
            console.log('how could this happen?');
            debugger;
        } else {
            apiString = curApiString;
        }

        const status = apicall(apiString);

        if (status === "ready") {
            const loadedData = datasets[apiString];
            if (loadedData.requestedOnly) // not propogated to state yet
                return;
            this.setState({
                apiString: curApiString,
                apiParams, data: loadedData, 
                dataReady: true, dataRequested: true});
            return;
        }
        if (status === "requested") {
            this.setState({
                apiString: curApiString,
                apiParams, data: [], 
                dataReady: false, dataRequested: true});
            return;
        }
        // it's a new request (do the same as an old request, right?)
        this.setState({
            apiString: curApiString,
            apiParams, data: [], 
            dataReady: false, dataRequested: true});
    }
    componentWillMount() {
        this.getData(this.props);
    }
    componentWillReceiveProps(newprops, otherarg) {
        this.getData(newprops);
    }
    /*
    componentDidUpdate() {
        this.getData(this.props);
    }
    */
    render() {
        const {children, passthrough} = this.props;
        const {apiString, data, dataReady, dataRequested} = this.state;
        /*
        console.log('render', dataReady, dataRequested, 
                    this.props.apiParams && this.props.apiParams.where || 'no props params', 
                    this.state.apiParams && this.state.apiParams.where || 'no state params', 
                    data);
        */
        if (dataReady && data.requestedOnly)
            debugger;
        let newChildren = React.Children.map(children, function(child) {
            return React.cloneElement(child, 
                {data, dataReady, apiString, passthrough})
        });
        return (
            <div>
                {newChildren}
            </div>
        );
    }
}
ApiWrapper.propTypes = {
    apiParams: React.PropTypes.object.isRequired,
    // query change stuff optional
};
ApiWrapper.defaultProps = {
    apiParams: {},
    startingData: [],
};
