import FarceActions from 'farce/Actions';
import BrowserProtocol from 'farce/BrowserProtocol';
import createHistoryEnhancer from 'farce/createHistoryEnhancer';
import locationReducer from 'farce/locationReducer';
import queryMiddleware from 'farce/queryMiddleware';
import { bindActionCreators, combineReducers, createStore } from 'redux';

const store = createStore(
  combineReducers({
    location: locationReducer,
  }),
  createHistoryEnhancer({
    protocol: new BrowserProtocol(),
    middlewares: [queryMiddleware],
  }),
);

store.subscribe(() => {
  console.log(store.getState().location); // eslint-disable-line no-console
});

store.dispatch(FarceActions.init());

global.store = store;
global.FarceActions = FarceActions;
global.BoundFarceActions = bindActionCreators(FarceActions, store.dispatch);
