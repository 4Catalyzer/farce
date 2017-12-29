import ActionTypes from '../src/ActionTypes';

export function invokeLocationMiddleware(middleware, action) {
  let result;

  function next(nextAction) {
    result = nextAction;
  }

  middleware()(next)(action);

  return result;
}

export function invokeMakeLocationDescriptor(middleware, location) {
  return invokeLocationMiddleware(middleware, {
    type: ActionTypes.TRANSITION,
    payload: location,
  }).payload;
}

export function invokeMakeLocation(middleware, location) {
  return invokeLocationMiddleware(middleware, {
    type: ActionTypes.UPDATE_LOCATION,
    payload: location,
  }).payload;
}

export function timeout(delay) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}
