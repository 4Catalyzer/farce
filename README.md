# Farce [![Travis][build-badge]][build] [![npm][npm-badge]][npm]

_History repeats itself._

Farce provides a [Redux](http://redux.js.org/) store enhancer that wraps a series of middlewares to allow controlling browser navigation by dispatching actions and to allow managing location state with the rest of your store state.

[![Codecov][codecov-badge]][codecov]

<!-- prettier-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Usage](#usage)
- [Guide](#guide)
  - [Installation](#installation)
  - [Basic usage](#basic-usage)
  - [Protocols](#protocols)
    - [`BrowserProtocol`](#browserprotocol)
    - [`HashProtocol`](#hashprotocol)
    - [`ServerProtocol`](#serverprotocol)
    - [`MemoryProtocol`](#memoryprotocol)
  - [Middlewares](#middlewares)
    - [`queryMiddleware` and `createQueryMiddleware`](#querymiddleware-and-createquerymiddleware)
    - [`createBasenameMiddleware`](#createbasenamemiddleware)
  - [Locations and location descriptors](#locations-and-location-descriptors)
  - [Navigation listeners](#navigation-listeners)
  - [Transient state storage](#transient-state-storage)
  - [Minimizing bundle size](#minimizing-bundle-size)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- prettier-ignore-end -->

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

// To navigate to a new location:
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

`BrowserProtocol` uses the browser URL path and the HTML5 History API.

```js
const protocol = new BrowserProtocol();
```

The examples here assume the use of a `new BrowserProtocol()`.

#### `HashProtocol`

`HashProtocol` uses the URL hash for navigation, and is intended for use in cases where server-side routing is not available, or in legacy environments where the HTML5 History API is not available. Prefer using `BrowserProtocol` over `HashProtocol` when possible.

```js
const protocol = new HashProtocol();
```

#### `ServerProtocol`

`ServerProtocol` uses a fixed, in-memory location for use in server-side rendering. It takes the path for the location to use. `ServerProtocol` instances do not support `location.state` and cannot navigate.

```js
// Given a standard Node request object:
const protocol = new ServerProtocol(req.url);
```

#### `MemoryProtocol`

`MemoryProtocol` tracks the current location and the location history in memory. It is intended for use in tests exercising navigation, and in cases where actual browser navigation is not possible or not desired, such as in browser plugins and in Electron apps. `MemoryProtocol` requires an initial location.

```js
const protocol = new MemoryProtocol(initialLocation);
```

`MemoryProtocol` also supports persisting the location history state to session storage, which allows for use cases like preserving navigation state when refreshing in an Electron app.

```js
const protocol = new MemoryProtocol(initialLocation, { persistent: true });
```

### Middlewares

#### `queryMiddleware` and `createQueryMiddleware`

The `queryMiddleware` middleware adds support for the `query` property, which enables the use of query objects to set the search string.

The `createQueryMiddleware` middleware factory creates a custom query middleware. It takes a configuration object with `parse` and `stringify` functions as properties to configure parsing and stringifying queries.

```js
import qs from 'qs';

const customQueryMiddleware = createQueryMiddleware({
  parse: qs.parse,
  stringify: qs.stringify,
});
```

The examples here assume the use of `queryMiddleware`.

#### `createBasenameMiddleware`

The `createBasenameMiddleware` middleware factory creates a middleware that implicitly prepends all paths with a base path. It takes a configuration object with a `basename` string.

```js
// With this middleware, dispatching FarceActions.push('/bar') will navigate to
// /foo/bar:
const basenameMiddleware = createBasenameMiddleware({ basename: '/foo' });
```

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

If a `queryMiddleware` is applied, the location object will also contain a `query` property that is the parsed query object from the search string. If a `basenameMiddleware` is applied, `pathname` will be relative to the specified `basename`.

`FarceActions.push` and `FarceActions.replace` take a location descriptor. A location descriptor can be an object with the shape of the location object. If it is an object, the `action`, `key`, `index`, and `delta` keys are ignored. A location descriptor can also be a string with the full path.

```js
// Location descriptor string:
store.dispatch(FarceActions.push('/foo?bar=baz#qux'));

// Equivalent location descriptor object:
store.dispatch(
  FarceActions.push({
    pathname: '/foo',
    search: '?bar=baz',
    hash: '#qux',
  }),
);

// Given a location object, you can override a subset of its properties:
store.dispatch(
  FarceActions.replace({
    ...location,
    query: { the: 'new-query' },
    hash: '#new-hash',
  }),
);
```

The history enhancer adds a `farce` object as a property to the store that exposes `createHref` and `createLocation` methods. `createHref` takes a location descriptor and returns a link `href`. `createLocation` takes a location descriptor and returns a fully-populated location descriptor object.

```js
const href = store.farce.createHref({
  pathname: '/foo',
  query: { the: 'query' },
});
// -> '/foo?the=query'

const location = store.farce.createLocation('/foo?the=query');
// -> { pathname: '/foo', query: { the: 'query' }, ... }
```

### Navigation listeners

The `farce` object on the store also has an `addNavigationListener` method. This method takes a navigation listener function and an optional options object and returns a function to remove the navigation listener.

```js
const removeNavigationListener = store.farce.addNavigationListener(
  (location) =>
    location.pathname === '/bar'
      ? 'Are you sure you want to go to /bar?'
      : true,
);

// To remove the navigation listener:
removeNavigationListener();
```

The navigation listener function receives the location to which the user is attempting to navigate. This function may return:

- `true` to allow navigation
- `false` to block navigation
- A string to prompt the user with that string as the message
- A nully value to call the next navigation listener and use its return value, if present, or else to allow the navigation
- A promise that resolves to any of the above values, to allow or block navigation once the promise resolves

When adding a navigation listener, you can set the `beforeUnload` option to run the listener when the user attempts to leave the page entirely. If `beforeUnload` is set, the navigation listener will be called with a `null` location when the user attempts to leave the page. In this scenario, the navigation listener must return a non-promise value.

```js
store.farce.addNavigationListener(
  (location) => {
    if (!location) {
      return false;
    }

    return asyncConfirm(location);
  },
  { beforeUnload: true },
);
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

### Minimizing bundle size

The top-level `farce` package exports everything available in this library. It is unlikely that any single application will use all the features available. As such, for real applications, you should import the modules you need directly, to pull in only the code that you use.

```js
import BrowserProtocol from 'farce/BrowserProtocol';
import createHistoryEnhancer from 'farce/createHistoryEnhancer';
import queryMiddleware from 'farce/queryMiddleware';

// Instead of:
// import {
//  BrowserProtocol,
//  createHistoryEnhancer,
//  queryMiddleware,
// } from 'farce';
```

[build-badge]: https://img.shields.io/travis/4Catalyzer/farce/master.svg
[build]: https://travis-ci.org/4Catalyzer/farce
[npm-badge]: https://img.shields.io/npm/v/farce.svg
[npm]: https://www.npmjs.org/package/farce
[codecov-badge]: https://img.shields.io/codecov/c/github/4Catalyzer/farce/master.svg
[codecov]: https://codecov.io/gh/4Catalyzer/farce
