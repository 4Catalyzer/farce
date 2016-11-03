import { combineReducers, createStore } from 'redux';

import Actions from './Actions';
import createHistoryEnhancer from './createHistoryEnhancer';
import createStoreHistory from './createStoreHistory';
import locationReducer from './locationReducer';

export default function createHistory(protocol, middlewares, options) {
  const store = createStore(
    combineReducers({
      location: locationReducer,
    }),
    createHistoryEnhancer(protocol, middlewares, options),
  );

  store.dispatch(Actions.init());

  return createStoreHistory(store, state => state);
}
