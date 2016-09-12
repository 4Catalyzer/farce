# farce

History repeats itself.

farce is a simple, extensible library for managing browser history and navigation. It uses [Redux](http://redux.js.org/) internally to manage state and offer a clean API for extending and configuring behavior.

farce can create a history object that is compatible with [history](https://github.com/mjackson/history) v2 for use with [React Router](https://github.com/reactjs/react-router) v2, or it can enhance your own Redux store and let you manage history location with the rest of your state.

## Usage

Without Redux:

```js
import { BrowserProtocol, createHistory, queryMiddleware } from 'farce';

const history = createHistory(
  new BrowserProtocol(),
  queryMiddleware,
);
```

With Redux:

```js
import {
  Actions as FarceActions,
  BrowserProtocol,
  createHistoryEnhancer,
  createStoreHistory,
  locationReducer,
  queryMiddleware,
} from 'farce';
import { combineReducers, createStore } from 'redux';

const store = createStore(
  combineReducers({ location: locationReducer }),
  createHistoryEnhancer(
    new BrowserProtocol(),
    queryMiddleware,
  ),
);

store.dispatch(FarceActions.init());

const history = createStoreHistory(store, state => state.location);
```
