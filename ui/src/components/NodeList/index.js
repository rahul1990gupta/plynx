import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import AlertContainer from 'react-alert-es6';
import { PlynxApi } from '../../API.js';
import List from './List.js'
import ReactPaginate from 'react-paginate';
import LoadingScreen from '../LoadingScreen.js'
import { ALERT_OPTIONS, OPERATIONS } from '../../constants.js';
import SearchBar from '../Common/SearchBar.js';
import './style.css';
import '../Common/ListPage.css';
import '../controls.css';


export default class ListPage extends Component {
  constructor(props) {
    super(props);
    document.title = "Node List - Plynx";
    this.state = {
      nodes: [],
      loading: true,
      pageCount: 0,
      search: "",
    };
    this.perPage = 20;

    this.loadNodes();
  }

  showAlert(message, type) {
    this.msg.show(message, {
      time: 5000,
      type: 'error',
      icon: <img src={"/alerts/" + type +".svg"} width="32" height="32" alt={type}/>
    });
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  async loadNodes() {
    // Loading

    var self = this;
    var loading = true;
    var sleepPeriod = 1000;
    const sleepMaxPeriod = 10000;
    const sleepStep = 1000;

    if (this.mounted) {
      self.setState({
        loading: true,
      });
    }

    var handleResponse = function (response) {
      let data = response.data;
      console.log(data.nodes);
      self.setState(
        {
          nodes: data.nodes,
          pageCount: Math.ceil(data.total_count / self.perPage)
        });
      loading = false;
      ReactDOM.findDOMNode(self.nodeList).scrollTop = 0;
    };

    var handleError = function (error) {
      if (error.response.status === 401) {
        PlynxApi.getAccessToken()
        .then(function (isSuccessfull) {
          if (!isSuccessfull) {
            console.error("Could not refresh token");
            self.props.history.push("/login/");
          } else {
            self.showAlert('Updated access token', 'success');
          }
        });
      }
    };

    while (loading) {
      await PlynxApi.endpoints.nodes.getAll( {
        query: {
          offset: self.state.offset,
          per_page: self.perPage,
          base_node_names: OPERATIONS,
          search: self.state.search,
        }
      })
      .then(handleResponse)
      .catch(handleError);
      if (loading) {
        await self.sleep(sleepPeriod);
        sleepPeriod = Math.min(sleepPeriod + sleepStep, sleepMaxPeriod);
      }
    }

    // Stop loading
    self.setState({
      loading: false,
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handlePageClick = (data) => {
    let selected = data.selected;
    let offset = Math.ceil(selected * this.perPage);
    console.log(selected, offset);

    this.setState({offset: offset}, () => {
      this.loadNodes();
    });
  };

  handleSearchUpdate(search) {
    this.setState({
      offset: 0,
      search: search,
    }, () => {
      this.loadNodes();
    });
  }

  render() {
    return (
      <div className='ListPage'>
        {this.state.loading &&
          <LoadingScreen />
        }
        <AlertContainer ref={a => this.msg = a} {...ALERT_OPTIONS} />
        <div className="menu">
          <a className="menu-button" href="/nodes/new">
            {"Create new Operation"}
          </a>
        </div>
        <div className="search">
          <SearchBar
              onSearchUpdate={(search) => this.handleSearchUpdate(search)}
          />
        </div>
        <List nodes={this.state.nodes}
                   ref={(child) => { this.nodeList = child; }}/>
        <ReactPaginate previousLabel={"Previous"}
                       nextLabel={"Next"}
                       breakLabel={<a>...</a>}
                       breakClassName={"break-me"}
                       pageCount={this.state.pageCount}
                       marginPagesDisplayed={2}
                       pageRangeDisplayed={5}
                       onPageChange={this.handlePageClick}
                       containerClassName={"pagination"}
                       subContainerClassName={"pages pagination"}
                       activeClassName={"active"} />
      </div>
    );
  }
}
