import isPromise from 'is-promise';
import warning from 'warning';

import ActionTypes from './ActionTypes';
import Actions from './Actions';

function runHookEntry({ hook }, location, callback) {
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

function runHookEntries(hookEntries, location, callback) {
  if (!hookEntries.length) {
    return callback(true);
  }

  return runHookEntry(hookEntries[0], location, (result) =>
    result != null
      ? callback(result)
      : runHookEntries(hookEntries.slice(1), location, callback),
  );
}

function maybeConfirm(result) {
  if (typeof result === 'boolean') {
    return result;
  }

  return window.confirm(result); // eslint-disable-line no-alert
}

function runAllowTransition(hookEntries, location, callback) {
  return runHookEntries(hookEntries, location, (result) =>
    callback(maybeConfirm(result)),
  );
}

export default function createTransitionHookMiddleware() {
  let nextStep = null;
  let hookEntries = [];

  /* istanbul ignore next: not testable with Karma */
  function onBeforeUnload(event) {
    const syncResult = runHookEntries(hookEntries, null, (result) => result);

    if (syncResult === true || syncResult === undefined) {
      // An asynchronous transition hook usually means there will be a custom
      //  confirm dialog. However, we'll already be showing the before unload
      //  dialog, and there's no way to prevent the custom dialog from showing.
      //  In such cases, the application code will need to explicitly handle
      //  the null location anyway, so don't potentially show two confirmation
      //  dialogs.
      return undefined;
    }

    const resultSafe = syncResult || '';

    event.preventDefault();
    event.returnValue = resultSafe; // eslint-disable-line no-param-reassign
    return resultSafe;
  }

  function addHook(hook, { beforeUnload = false } = {}) {
    // Add the beforeunload event listener only as needed, as its presence
    //  prevents the page from being added to the page navigation cache.
    if (beforeUnload && hookEntries.every((item) => !item.beforeUnload)) {
      window.addEventListener('beforeunload', onBeforeUnload);
    }

    const hookEntry = { hook, beforeUnload };
    hookEntries.push(hookEntry);

    return () => {
      hookEntries = hookEntries.filter((item) => item !== hookEntry);

      if (beforeUnload && hookEntries.every((item) => !item.beforeUnload)) {
        window.removeEventListener('beforeunload', onBeforeUnload);
      }
    };
  }

  function transitionHookMiddleware({ dispatch }) {
    return (next) => (action) => {
      const { type, payload } = action;

      if (nextStep && type === ActionTypes.UPDATE_LOCATION) {
        const step = nextStep;
        nextStep = null;
        return step(next, action);
      }

      switch (type) {
        case ActionTypes.TRANSITION:
          return runAllowTransition(
            hookEntries,
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
        case ActionTypes.UPDATE_LOCATION: {
          // No transition hooks to run.
          if (!hookEntries.length) {
            return next(action);
          }

          // This is the initial load. It doesn't make sense to block this
          // transition.
          if (payload.delta === 0) {
            return next(action);
          }

          // Without delta, we can't restore the location.
          if (payload.delta == null) {
            return runAllowTransition(
              hookEntries,
              payload,
              (allowTransition) => (allowTransition ? next(action) : null),
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

          const syncResult = runHookEntries(hookEntries, payload, (result) => {
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
          if (hookEntries.length > 0 && onBeforeUnload) {
            window.removeEventListener('beforeunload', onBeforeUnload);
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
