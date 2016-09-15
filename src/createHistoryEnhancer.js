import { applyMiddleware } from 'redux';

import createHistoryMiddleware from './createHistoryMiddleware';
import createTransitionHookMiddleware from './createTransitionHookMiddleware';
import ensureLocationMiddleware from './ensureLocationMiddleware';

export default function createHistoryEnhancer(protocol, ...middlewares) {
  return function historyEnhancer(createStore) {
    return (...args) => {
      const transitionHookMiddleware = createTransitionHookMiddleware();

      const middlewareEnhancer = applyMiddleware(
        ensureLocationMiddleware,
        ...middlewares,
        transitionHookMiddleware,
        createHistoryMiddleware(protocol),
      );

      const store = middlewareEnhancer(createStore)(...args);

      return {
        ...store,
        addTransitionHook: transitionHookMiddleware.addTransitionHook,
      };
    };
  };
}
