# farce [![npm][npm-badge]][npm]

_History repeats itself._

farce provides a [Redux](http://redux.js.org/) store enhancer that wraps a series of middlewares to allow controlling browser navigation by dispatching actions and to allow managing location state with the rest of your store state.

farce can also create a history object that is compatible with [history](https://github.com/mjackson/history) v2 for use with [React Router](https://github.com/ReactTraining/react-router) v2.

## Usage

```js
import {
  Actions as FarceActions,
  BrowserProtocol,
  createHistoryEnhancer,
  locationReducer,
  queryMiddleware,
} from 'farce';
import { combineReducers, createStore } from 'redux';

const store = createStore(
  combineReducers({
    location: locationReducer,
  }),
  createHistoryEnhancer({
    protocol: new BrowserProtocol(),
    middlewares: [queryMiddleware],
  }),
);

store.dispatch(FarceActions.init());

// To transition to a new location:
store.dispatch(FarceActions.push('/new/path'));

// To get the current location:
const location = store.getState().location;
// -> { action: 'PUSH', pathname: '/new/path', ... }
```

## Guide

### Installation

```
$ npm i -S redux
$ npm i -S farce
```

### Basic usage

Create a history enhancer with `createHistoryEnhancer`. Configure it with an options object with a `protocol` property to control how to interact with browser APIs and an optional `middlewares` property to customize handling of location objects. Use this history enhancer to enhance your store.

Install `locationReducer` to track the current location state in your store.

```js
const store = createStore(
  combineReducers({
    location: locationReducer,
  }),
  createHistoryEnhancer({
    protocol: new BrowserProtocol(),
    middlewares: [queryMiddleware],
  }),
);
```

Dispatch `FarceActions.init()` to initialize up your store with the current browser state and to set up event listeners.

Dispatch `FarceActions.push(location)`, `FarceActions.replace(location)`, or `FarceActions.go(delta)` to navigate.

```js
// Add a /foo history entry.
store.dispatch(FarceActions.push('/foo'));

// Replace the current history entry with /bar.
store.dispatch(FarceActions.replace('/bar'));

// Go back one entry.
store.dispatch(FarceActions.go(-1));
```

If you want to tear down all event listeners, dispatch `FarceActions.dispose()`.

```js
store.dispatch(FarceActions.dispose());
```

### Protocols

#### `BrowserProtocol`

The `BrowserProtocol` class uses the HTML5 History API. It takes an optional configuration object. This configuration object supports a `basename` property; if specified, all paths will be implicitly prepended by `basename`.

```js
const protocol = new BrowserProtocol({ basename: '/foo' });
// Dispatching FarceActions.push('/bar') will navigate to /foo/bar.
```

The examples here assume the use of a `new BrowserProtocol()`.

### Middlewares

#### `queryMiddleware` and `createQueryMiddleware`

The `queryMiddleware` middleware adds support for the `query` property, which enables the use of query objects to set the search string.

The `createQueryMiddleware` middleware factory creates a custom query middleware. It takes a configuration object with `parse` and `stringify` functions as properties to configure parsing and stringifying queries.

```js
import qs from 'qs';

const customQueryMiddleware = createQueryMiddleware({
  parse: qs.parse, stringify: qs.stringify,
});
```

The examples here assume the use of `queryMiddleware`.

### Locations and location descriptors

The `locationReducer` reducer updates the store state with a location object. Location objects have the following properties:

- `action`: `'PUSH'` or `'REPLACE'` if the location was reached via `FarceActions.push` or `FarceActions.replace` respectively; `'POP'` on the initial location, or if the location was reached via the browser back or forward buttons or via `FarceActions.go`
- `pathname`: the path name; as on `window.location`
- `search`: the search string; as on `window.location`
- `hash`: the location hash; as on `window.location`
- `key`: if present, a unique key identifying the current history entry
- `index`: the current index of the history entry, starting at 0 for the initial entry; this increments on `FarceActions.push` but not on `FarceActions.replace`
- `delta`: the difference between the current `index` and the `index` of the previous location
- `state`: additional location state that is not part of the URL

If a `basename` is provided to `BrowserProtocol`, `pathname` will be relative to that `basename`. If `queryMiddleware` is applied, the location object will also contain a `query` property that is the parsed query object from the search string.

`FarceActions.push` and `FarceActions.replace` take a location descriptor. A location descriptor can be an object with the shape of the location object. If it is an object, the `action`, `key`, `index`, and `delta` keys are ignored. A location descriptor can also be a string with the full path.

```js
// Location descriptor string:
store.dispatch(FarceActions.push('/foo?bar=baz#qux'));

// Equivalent location descriptor object:
store.dispatch(FarceActions.push({
  pathname: '/foo',
  search: '?bar=baz',
  hash: '#qux',
}));

// Given a location object, you can override a subset of its properties:
store.dispatch(FarceActions.replace({
  ...location,
  query: { the: 'new-query' },
  hash: '#new-hash',
}));
```

The history enhancer adds a `farce` object as a property to the store that exposes `createHref` and `createLocation` methods. `createHref` takes a location descriptor and returns a link `href`. `createLocation` takes a location descriptor and returns the corresponding location object.

```js
const href = store.farce.createHref({
  pathname: '/foo',
  query: { the: 'query' },
});
// -> '/foo?the=query'

const location = store.farce.createLocation('/foo?the=query');
// -> { pathname: '/foo', query: { the: 'query' }, ... }
```

### Transition hooks

The `farce` object on the store also has an `addTransitionHook` method. This method takes a transition hook function and returns a function to remove the transition hook.

```js
const removeTransitionHook = store.farce.addTransitionHook(location => (
  location.pathname === '/bar' ? 'Are you sure you want to go to /bar?' : true
));

// To remove the transition hook:
removeTransitionHook();
```

The transition hook function receives the location to which the user is attempting to navigate. This function may return:

- `true` to allow the transition
- `false` to block the transition
- A string to prompt the user with that string as the message
- A nully value to call the next transition hook and use its return value, if present, or else to allow the transition
- A promise that resolves to any of the above values, to allow or block the transition once the promise resolves

When creating the history enhancer, you can set the `useBeforeUnload` option to run transition hooks when the user attempts to leave the page entirely.

```js
const historyEnhancer = createHistoryEnhancer({
  ...options,
  useBeforeUnload: true,
});
```

If `useBeforeUnload` is set, transition hooks will be called with a `null` location when the user attempts to leave the page. In this scenario, the transition hook must return a non-promise value.

```js
function transitionHook(location) {
  if (location === null) {
    return false;
  }
  
  return asyncConfirm(location);
}
```

### Transient state storage

The `StateStorage` class provides transient storage associated with location objects. This can be used for tracking values like scroll position that should not be propagated when using a location object to build a new location descriptor. The `StateStorage` constructor takes the `farce` property from the store and a `namespace` string to uniquely identify the state storage instance.

```js
const stateStorage = new StateStorage(store.farce, 'my-transient-state');
```

The state storage object exposes `read` and `save` methods. The `save` method takes a location object, an optional key to further qualify the saved property, and a JSON-serializable value; it saves the value to session storage. The `read` method takes the location object and the key; it returns the saved value if retrievable or `undefined` otherwise.

```js
stateStorage.save(location, null, 1);
stateStorage.save(location, 'foo', [2, 3]);

const value1 = stateStorage.read(location);
// -> 1
const value2 = stateStorage.read(location, 'foo');
// -> [2, 3]
const value3 = stateStorage.read(location, 'bar');
// -> undefined
```

`StateStorage` intentionally ignores errors. As such, it should be treated as unreliable. Do not use `StateStorage` for managing state that is critical to the operation of your application.

### `history` interoperation

Call `createStoreHistory` on a store enhanced with `createHistoryEnhancer` to create a history object that is API-compatible with `history` v2. This object has an additional `dispose` method for tearing down event listeners.

If you don't have a store, `createHistory` will create a history object. It takes the same configuration options as `createHistoryEnhancer`.

[npm-badge]: https://img.shields.io/npm/v/farce.svg
[npm]: https://www.npmjs.org/package/farce
