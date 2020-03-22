import isPromise from 'is-promise';
import warning from 'warning';

import ActionTypes from './ActionTypes';
import Actions from './Actions';

function runHook(hook, location, callback) {
  let result;
  try {
    result = hook(location);
  } catch (e) {
    warning(
      false,
      'Ignoring transition hook `%s` that failed with `%s`.',
      hook.name,
      e,
    );

    result = null;
  }

  if (!isPromise(result)) {
    return callback(result);
  }

  result
    .catch((e) => {
      warning(
        false,
        'Ignoring transition hook `%s` that failed with `%s`.',
        hook.name,
        e,
      );

      return null;
    })
    .then(callback);

  return undefined;
}

function runHooks(hooks, location, callback) {
  if (!hooks.length) {
    return callback(true);
  }

  return runHook(hooks[0], location, (result) =>
    result != null
      ? callback(result)
      : runHooks(hooks.slice(1), location, callback),
  );
}

function maybeConfirm(result) {
  if (typeof result === 'boolean') {
    return result;
  }

  return window.confirm(result); // eslint-disable-line no-alert
}

function runAllowTransition(hooks, location, callback) {
  return runHooks(hooks, location, (result) => callback(maybeConfirm(result)));
}

export default function createTransitionHookMiddleware({
  useBeforeUnload = false,
}) {
  let nextStep = null;
  let hooks = [];

  function addHook(hook) {
    hooks.push(hook);

    return () => {
      hooks = hooks.filter((item) => item !== hook);
    };
  }

  let onBeforeUnload = null;

  function transitionHookMiddleware({ dispatch }) {
    return (next) => (action) => {
      const { type, payload } = action;

      if (nextStep && type === ActionTypes.UPDATE_LOCATION) {
        const step = nextStep;
        nextStep = null;
        return step(next, action);
      }

      switch (type) {
        case ActionTypes.INIT:
          // Only attach this listener once.
          if (useBeforeUnload && !onBeforeUnload) {
            /* istanbul ignore next: not testable with Karma */
            onBeforeUnload = (event) => {
              const syncResult = runHooks(hooks, null, (result) => result);

              if (syncResult === true || syncResult === undefined) {
                // An asynchronous transition hook usually means there will be
                // a custom confirm dialog. However, we'll already be showing
                // the before unload dialog, and there's no way to prevent the
                // custom dialog from showing. In such cases, the application
                // code will need to explicitly handle the null location
                // anyway, so don't potentially show two confirmation dialogs.
                return undefined;
              }

              const resultSafe = syncResult || '';

              event.returnValue = resultSafe; // eslint-disable-line no-param-reassign
              return resultSafe;
            };

            window.addEventListener('beforeunload', onBeforeUnload);
          }

          return next(action);
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
            return runAllowTransition(hooks, payload, (allowTransition) =>
              allowTransition ? next(action) : null,
            );
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
              nextStep = () => {
                rewindDone = true;
              };
              break;
            default:
              // Show the confirm dialog after the rewind.
              nextStep = () => finishRunAllowTransition(syncResult);
          }

          dispatch(Actions.go(-payload.delta));
          return undefined;
        }
        case ActionTypes.DISPOSE:
          if (onBeforeUnload) {
            window.removeEventListener('beforeunload', onBeforeUnload);
            onBeforeUnload = null;
          }

          return next(action);
        default:
          return next(action);
      }
    };
  }

  transitionHookMiddleware.addHook = addHook;
  return transitionHookMiddleware;
}
