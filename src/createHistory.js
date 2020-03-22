import { createStore } from 'redux';

import Actions from './Actions';
import createHistoryEnhancer from './createHistoryEnhancer';
import createStoreHistory from './createStoreHistory';
import locationReducer from './locationReducer';

export default function createHistory(options) {
  const store = createStore(locationReducer, createHistoryEnhancer(options));
  store.dispatch(Actions.init());

  return createStoreHistory(store, (location) => location);
}
