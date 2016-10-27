import isPromise from 'is-promise';

import Actions from './Actions';
import ActionTypes from './ActionTypes';

function resolveMaybePromise(maybePromise, callback) {
  if (isPromise(maybePromise)) {
    maybePromise.then(callback);
    return undefined;
  }

  return callback(maybePromise);
}

function shouldAllowTransition(transitionHooks, location, callback) {
  if (!transitionHooks.length) {
    return callback(true);
  }

  return resolveMaybePromise(transitionHooks[0](location), (result) => {
    if (result == null) {
      return shouldAllowTransition(
        transitionHooks.slice(1),
        location,
        (nextResult) => {
          callback(nextResult);
        },
      );
    }

    if (typeof result === 'boolean') {
      return callback(result);
    }

    return callback(window.confirm(result)); // eslint-disable-line no-alert
  });
}

export default function createTransitionHookMiddleware() {
  let nextStep = null;
  let transitionHooks = [];

  function addTransitionHook(transitionHook) {
    transitionHooks.push(transitionHook);

    return () => {
      transitionHooks = transitionHooks.filter(
        item => item !== transitionHook
      );
    };
  }

  function transitionHookMiddleware({ dispatch }) {
    return next => (action) => {
      const { type, payload } = action;

      if (nextStep && type === ActionTypes.UPDATE_LOCATION) {
        const step = nextStep;
        nextStep = null;
        return step(next, action);
      }

      switch (type) {
        case ActionTypes.TRANSITION:
          return shouldAllowTransition(
            transitionHooks,
            payload,
            (allowTransition) => {
              if (!allowTransition) {
                return null;
              }

              // Skip the repeated transition hook check on UPDATE_LOCATION.
              nextStep = (nextNext, nextAction) => nextNext(nextAction);

              return next(action);
            },
          );

        case ActionTypes.UPDATE_LOCATION:
          // No transition hooks to run.
          if (!transitionHooks.length) {
            return next(action);
          }

          // This is the initial load. It doesn't make sense to block this
          // transition.
          if (payload.delta === 0) {
            return next(action);
          }

          // Without delta, we can't restore the location.
          if (payload.delta == null) {
            return shouldAllowTransition(
              transitionHooks,
              payload,
              allowTransition => (allowTransition ? next(action) : null),
            );
          }

          // This step handles the rewind. It needs to run after the rewind so
          // the window location is on the original location while prompting.
          nextStep = () => shouldAllowTransition(
            transitionHooks,
            payload,
            (allowTransition) => {
              if (!allowTransition) {
                return null;
              }

              // Release the original UPDATE_LOCATION when the un-rewind
              // happens. We need to do so here to maintain the invariant that
              // the store location only updates after the window location.
              nextStep = () => next(action);

              dispatch(Actions.go(payload.delta));
              return undefined;
            },
          );

          // TODO: Don't rewind if the transition is synchronously allowed.
          dispatch(Actions.go(-payload.delta));
          return undefined;

        default:
          return next(action);
      }
    };
  }

  transitionHookMiddleware.addTransitionHook = addTransitionHook;
  return transitionHookMiddleware;
}
