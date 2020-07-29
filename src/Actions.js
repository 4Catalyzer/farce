import ActionTypes from './ActionTypes';

export default {
  init: () => ({
    type: ActionTypes.INIT,
  }),

  push: (location) => ({
    type: ActionTypes.PUSH,
    payload: location,
  }),

  replace: (location) => ({
    type: ActionTypes.REPLACE,
    payload: location,
  }),

  go: (delta) => ({
    type: ActionTypes.GO,
    payload: delta,
  }),

  dispose: () => ({
    type: ActionTypes.DISPOSE,
  }),
};
