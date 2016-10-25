import FarceActions from 'farce/lib/Actions';
import BrowserProtocol from 'farce/lib/BrowserProtocol';
import createHistoryEnhancer from 'farce/lib/createHistoryEnhancer';
import locationReducer from 'farce/lib/locationReducer';
import queryMiddleware from 'farce/lib/queryMiddleware';
import { combineReducers, createStore } from 'redux';

const store = createStore(
    combineReducers({
      location: locationReducer,
    }),
    createHistoryEnhancer(
      new BrowserProtocol(),
      [queryMiddleware],
    ),
);

store.subscribe(() => {
  console.log(store.getState().location); // eslint-disable-line no-console
});

store.dispatch(FarceActions.init());

global.store = store;
global.FarceActions = FarceActions;
