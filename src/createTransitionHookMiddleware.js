import Actions from './Actions';
import ActionTypes from './ActionTypes';

function resolveMaybePromise(maybePromise, callback) {
  if (maybePromise && typeof maybePromise.then === 'function') {
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
    let step = null;

    return next => (action) => {
      const { type, payload } = action;

      // This would be cleaner with a real generator, but I'd rather not pull
      // in the Regenerator runtime here.
      if (step && type === ActionTypes.UPDATE_LOCATION) {
        const currentStep = step;
        step = null; // Null out step so we don't hit this check again.
        return currentStep();
      }

      switch (type) {
        case ActionTypes.TRANSITION:
          return shouldAllowTransition(
            transitionHooks,
            payload,
            allowTransition => (allowTransition ? next(action) : null),
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

          step = () => {
            shouldAllowTransition(
              transitionHooks,
              payload,
              (allowTransition) => {
                if (!allowTransition) {
                  return null;
                }

                step = () => {
                  next(action);
                };

                dispatch(Actions.go(payload.delta));
                return null;
              },
            );
          };

          // TODO: Don't rewind if the transition is synchronously allowed.
          dispatch(Actions.go(-payload.delta));
          return null;

        default:
          return next(action);
      }
    };
  }

  transitionHookMiddleware.addTransitionHook = addTransitionHook;
  return transitionHookMiddleware;
}
