import Actions from './Actions';
import ActionTypes from './ActionTypes';

function resolveMaybePromise(maybePromise, callback) {
  if (maybePromise && typeof maybePromise.then === 'function') {
    maybePromise.then((result) => {
      callback(result);
    });

    return null;
  }

  return callback(maybePromise);
}

function shouldAllowTransition(transitionHooks, location, callback) {
  if (!transitionHooks.length) {
    callback(true);
    return;
  }

  resolveMaybePromise(transitionHooks[0](location), (result) => {
    if (result === true) {
      shouldAllowTransition(
        transitionHooks.slice(1),
        location,
        (nextResult) => {
          callback(nextResult);
        },
      );
      return;
    }

    if (result === false) {
      callback(false);
      return;
    }

    callback(window.confirm(result)); // eslint-disable-line no-alert
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

  function transitionHookMiddleware() {
    let nextStep = null;

    return next => (action) => {
      const { type, payload } = action;

      // This would be cleaner with a real generator, but I'd rather not pull
      // in the Regenerator runtime here.
      if (nextStep && type === ActionTypes.LOCATION_UPDATED) {
        const step = nextStep;
        nextStep = null;
        return step();
      }

      switch (type) {
        case ActionTypes.TRANSITION:
          return shouldAllowTransition(
            transitionHooks,
            payload,
            allowTransition => (allowTransition ? next(action) : null),
          );

        case ActionTypes.LOCATION_UPDATED:
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

          nextStep = () => {
            shouldAllowTransition(
              transitionHooks,
              payload,
              (allowTransition) => {
                if (!allowTransition) {
                  return null;
                }

                nextStep = () => {
                  next(action);
                };

                next(Actions.go(payload.delta));
                return null;
              },
            );
          };

          next(Actions.go(-payload.delta));
          return null;

        default:
          return next(action);
      }
    };
  }

  transitionHookMiddleware.addTransitionHook = addTransitionHook;
  return transitionHookMiddleware;
}
