import { createStore } from 'redux';

import Actions from './Actions';
import ActionTypes from './ActionTypes';
import createHistoryEnhancer from './createHistoryEnhancer';
import createStoreHistory from './createStoreHistory';

function reducer(state, action) {
  if (action.type === ActionTypes.LOCATION_UPDATED) {
    return action.payload;
  }

  return state;
}

export default function createHistory(protocol, ...middlewares) {
  const enhancer = createHistoryEnhancer(protocol, ...middlewares);
  const store = createStore(reducer, enhancer);
  store.dispatch(Actions.init());

  return createStoreHistory(store, state => state);
}
