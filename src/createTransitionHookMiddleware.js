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

function runHooks(hooks, location, callback) {
  if (!hooks.length) {
    return callback(true);
  }

  return resolveMaybePromise(hooks[0](location), (result) => {
    if (result == null) {
      return runHooks(
        hooks.slice(1),
        location,
        (nextResult) => {
          callback(nextResult);
        },
      );
    }

    return callback(result);
  });
}

function maybeConfirm(result) {
  if (typeof result === 'boolean') {
    return result;
  }

  return window.confirm(result); // eslint-disable-line no-alert
}

function runAllowTransition(hooks, location, callback) {
  return runHooks(hooks, location, result => (
    callback(maybeConfirm(result))
  ));
}

export default function createTransitionHookMiddleware() {
  let nextStep = null;
  let hooks = [];

  function addHook(hook) {
    hooks.push(hook);

    return () => {
      hooks = hooks.filter(item => item !== hook);
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
          return runAllowTransition(hooks, payload, (allowTransition) => {
            if (!allowTransition) {
              return null;
            }

            // Skip the repeated transition hook check on UPDATE_LOCATION.
            nextStep = (nextNext, nextAction) => nextNext(nextAction);

            return next(action);
          });
        case ActionTypes.UPDATE_LOCATION: {
          // No transition hooks to run.
          if (!hooks.length) {
            return next(action);
          }

          // This is the initial load. It doesn't make sense to block this
          // transition.
          if (payload.delta === 0) {
            return next(action);
          }

          // Without delta, we can't restore the location.
          if (payload.delta == null) {
            return runAllowTransition(hooks, payload, allowTransition => (
              allowTransition ? next(action) : null
            ));
          }

          const finishRunAllowTransition = (result) => {
            if (!maybeConfirm(result)) {
              return null;
            }

            // Release the original UPDATE_LOCATION when the un-rewind
            // happens. We need to do so here to maintain the invariant that
            // the store location only updates after the window location.
            nextStep = () => next(action);

            dispatch(Actions.go(payload.delta));
            return undefined;
          };

          let sync = true;
          let rewindDone = false;

          const syncResult = runHooks(hooks, payload, (result) => {
            if (sync) {
              return result;
            }

            if (!rewindDone) {
              // The rewind hasn't finished yet. Replace the next step hook so
              // we finish running when that happens.
              nextStep = () => finishRunAllowTransition(result);
              return undefined;
            }

            return finishRunAllowTransition(result);
          });

          sync = false;

          switch (syncResult) {
            case true:
              // The transition was synchronously allowed, so skip the rewind.
              return next(action);
            case false:
              // We're done as soon as the rewind finishes.
              nextStep = () => {};
              break;
            case undefined:
              // Let the callback from runHooks take care of things.
              nextStep = () => { rewindDone = true; };
              break;
            default:
              // Show the confirm dialog after the rewind.
              nextStep = () => finishRunAllowTransition(syncResult);
          }

          dispatch(Actions.go(-payload.delta));
          return undefined;
        }
        default:
          return next(action);
      }
    };
  }

  transitionHookMiddleware.addHook = addHook;
  return transitionHookMiddleware;
}
