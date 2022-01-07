import ActionTypes from '../src/ActionTypes';

export function shouldWarn(about) {
  console.warn.expected.push(about); // eslint-disable-line no-console
}

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
    type: ActionTypes.NAVIGATE,
    payload: location,
  }).payload;
}

export function invokeMakeLocation(middleware, location) {
  return invokeLocationMiddleware(middleware, {
    type: ActionTypes.UPDATE_LOCATION,
    payload: location,
  }).payload;
}
