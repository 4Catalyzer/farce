import { applyMiddleware, bindActionCreators } from 'redux';

import ActionTypes from './ActionTypes';
import createHistoryMiddleware from './createHistoryMiddleware';
import createTransitionHookMiddleware from './createTransitionHookMiddleware';
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

export default function createHistoryEnhancer({
  protocol,
  middlewares = [],
  useBeforeUnload,
}) {
  return function historyEnhancer(createStore) {
    return (...args) => {
      const transitionHookMiddleware = createTransitionHookMiddleware({
        useBeforeUnload,
      });

      const middlewareEnhancer = applyMiddleware(
        ensureLocationMiddleware,
        transitionHookMiddleware,
        ...middlewares,
        createHistoryMiddleware(protocol),
        ...[...middlewares].reverse(),
        transitionHookMiddleware,
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
          addTransitionHook: transitionHookMiddleware.addHook,
        },
      };
    };
  };
}
