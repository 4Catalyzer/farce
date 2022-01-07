import { applyMiddleware, bindActionCreators } from 'redux';

import ActionTypes from './ActionTypes';
import createHistoryMiddleware from './createHistoryMiddleware';
import createNavigationListenerMiddleware from './createNavigationListenerMiddleware';
import ensureLocationMiddleware from './ensureLocationMiddleware';

function createHref(location) {
  return {
    type: ActionTypes.CREATE_HREF,
    payload: location,
  };
}

function createLocation(location) {
  return {
    type: ActionTypes.CREATE_LOCATION,
    payload: location,
  };
}

export default function createHistoryEnhancer({ protocol, middlewares = [] }) {
  return function historyEnhancer(createStore) {
    return (...args) => {
      const navigationListenerMiddleware =
        createNavigationListenerMiddleware();

      const middlewareEnhancer = applyMiddleware(
        ensureLocationMiddleware,
        navigationListenerMiddleware,
        ...middlewares,
        createHistoryMiddleware(protocol),
        ...[...middlewares].reverse(),
        navigationListenerMiddleware,
      );

      const store = middlewareEnhancer(createStore)(...args);
      const boundActionCreators = bindActionCreators(
        { createHref, createLocation },
        store.dispatch,
      );

      return {
        ...store,
        farce: {
          ...boundActionCreators,
          addNavigationListener: navigationListenerMiddleware.addListener,
        },
      };
    };
  };
}
