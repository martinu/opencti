import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import {
  compose,
  append,
  filter,
  propOr,
  assoc,
  dissoc,
  pipe,
  toPairs,
  map,
  last,
  head,
} from 'ramda';
import { withRouter } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import { QueryRenderer } from '../../../relay/environment';
import ListLines from '../../../components/list_lines/ListLines';
import StixObservablesLines, {
  stixObservablesLinesQuery,
} from './stix_observables/StixObservablesLines';
import inject18n from '../../../components/i18n';
import StixObservableCreation from './stix_observables/StixObservableCreation';
import StixObservablesRightBar from './stix_observables/StixObservablesRightBar';
import {
  buildViewParamsFromUrlAndStorage,
  saveViewParameters,
} from '../../../utils/ListParameters';

const styles = () => ({
  container: {
    margin: 0,
    padding: '0 250px 0 0',
  },
});

class StixObservables extends Component {
  constructor(props) {
    super(props);
    const params = buildViewParamsFromUrlAndStorage(
      props.history,
      props.location,
      'view-stix_observables',
    );
    this.state = {
      sortBy: propOr('created_at', 'sortBy', params),
      orderAsc: propOr(false, 'orderAsc', params),
      searchTerm: propOr('', 'searchTerm', params),
      view: propOr('lines', 'view', params),
      filters: {},
      types: [],
      openExports: false,
      numberOfElements: { number: 0, symbol: '' },
    };
  }

  saveView() {
    saveViewParameters(
      this.props.history,
      this.props.location,
      'view-stix_observables',
      dissoc('filters', this.state),
    );
  }

  handleSearch(value) {
    this.setState({ searchTerm: value }, () => this.saveView());
  }

  handleSort(field, orderAsc) {
    this.setState({ sortBy: field, orderAsc }, () => this.saveView());
  }

  handleToggleExports() {
    this.setState({ openExports: !this.state.openExports });
  }

  handleToggle(type) {
    if (this.state.types.includes(type)) {
      this.setState({ types: filter((t) => t !== type, this.state.types) }, () => this.saveView());
    } else {
      this.setState({ types: append(type, this.state.types) }, () => this.saveView());
    }
  }

  handleAddFilter(key, id, value, event) {
    event.stopPropagation();
    event.preventDefault();
    this.setState({
      filters: assoc(key, [{ id, value }], this.state.filters),
    });
  }

  handleRemoveFilter(key) {
    this.setState({ filters: dissoc(key, this.state.filters) });
  }

  setNumberOfElements(numberOfElements) {
    this.setState({ numberOfElements });
  }

  renderLines(paginationOptions) {
    const {
      sortBy,
      orderAsc,
      searchTerm,
      filters,
      numberOfElements,
    } = this.state;
    const dataColumns = {
      entity_type: {
        label: 'Type',
        width: '15%',
        isSortable: true,
      },
      observable_value: {
        label: 'Value',
        width: '35%',
        isSortable: true,
      },
      tags: {
        label: 'Tags',
        width: '20%',
        isSortable: false,
      },
      created_at: {
        label: 'Creation date',
        width: '15%',
        isSortable: true,
      },
      markingDefinitions: {
        label: 'Marking',
        isSortable: false,
      },
    };
    return (
      <ListLines
        sortBy={sortBy}
        orderAsc={orderAsc}
        dataColumns={dataColumns}
        handleSort={this.handleSort.bind(this)}
        handleSearch={this.handleSearch.bind(this)}
        handleRemoveFilter={this.handleRemoveFilter.bind(this)}
        exportEntityType="Stix-Observable"
        keyword={searchTerm}
        filters={filters}
        paginationOptions={paginationOptions}
        numberOfElements={numberOfElements}
      >
        <QueryRenderer
          query={stixObservablesLinesQuery}
          variables={{ count: 25, ...paginationOptions }}
          render={({ props }) => (
            <StixObservablesLines
              data={props}
              paginationOptions={paginationOptions}
              dataColumns={dataColumns}
              initialLoading={props === null}
              onTagClick={this.handleAddFilter.bind(this)}
              setNumberOfElements={this.setNumberOfElements.bind(this)}
            />
          )}
        />
      </ListLines>
    );
  }

  render() {
    const { classes } = this.props;
    const {
      view,
      types,
      sortBy,
      orderAsc,
      searchTerm,
      filters,
      openExports,
    } = this.state;
    const finalFilters = pipe(
      toPairs,
      map((pair) => {
        const values = last(pair);
        const valIds = map((v) => v.id, values);
        return { key: head(pair), values: valIds };
      }),
    )(filters);
    const paginationOptions = {
      types: this.state.types.length > 0 ? this.state.types : null,
      search: searchTerm,
      filters: finalFilters,
      orderBy: sortBy,
      orderMode: orderAsc ? 'asc' : 'desc',
    };
    return (
      <div className={classes.container}>
        {view === 'lines' ? this.renderLines(paginationOptions) : ''}
        <StixObservableCreation
          paginationOptions={paginationOptions}
          openExports={openExports}
        />
        <StixObservablesRightBar
          types={types}
          handleToggle={this.handleToggle.bind(this)}
          openExports={openExports}
        />
      </div>
    );
  }
}

StixObservables.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  history: PropTypes.object,
  location: PropTypes.object,
};

export default compose(
  inject18n,
  withRouter,
  withStyles(styles),
)(StixObservables);
