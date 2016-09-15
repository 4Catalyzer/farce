import ActionTypes from './ActionTypes';

export default {
  init: () => ({
    type: ActionTypes.INIT,
  }),

  push: location => ({
    type: ActionTypes.PUSH,
    payload: location,
  }),

  replace: location => ({
    type: ActionTypes.REPLACE,
    payload: location,
  }),

  go: delta => ({
    type: ActionTypes.GO,
    payload: delta,
  }),

  createHref: location => ({
    type: ActionTypes.CREATE_HREF,
    payload: location,
  }),

  createLocation: location => ({
    type: ActionTypes.CREATE_LOCATION,
    payload: location,
  }),

  dispose: () => ({
    type: ActionTypes.DISPOSE,
  }),
};
