/* eslint-disable no-console */

import ActionTypes from './ActionTypes';
import Actions from './Actions';

function runListenerEntry({ listener }, location, callback) {
  let result;
  try {
    result = listener(location);
  } catch (e) {
    if (__DEV__)
      console.warn(
        `Ignoring navigation listener \`${listener.name}\` that failed with \`${e}\`.`,
      );

    result = null;
  }

  if (typeof result === 'object' && result && result.then) {
    result
      .catch((e) => {
        if (__DEV__)
          console.warn(
            `Ignoring navigation listener \`${listener.name}\` that failed with \`${e}\`.`,
          );

        return null;
      })
      .then(callback);

    return undefined;
  }

  return callback(result);
}

function runListenerEntries(listenerEntries, location, callback) {
  if (!listenerEntries.length) {
    return callback(true);
  }

  return runListenerEntry(listenerEntries[0], location, (result) =>
    result != null
      ? callback(result)
      : runListenerEntries(listenerEntries.slice(1), location, callback),
  );
}

function maybeConfirm(result) {
  if (typeof result === 'boolean') {
    return result;
  }

  return window.confirm(result); // eslint-disable-line no-alert
}

function runAllowNavigation(listenerEntries, location, callback) {
  return runListenerEntries(listenerEntries, location, (result) =>
    callback(maybeConfirm(result)),
  );
}

export default function createNavigationListenerMiddleware() {
  let nextStep = null;
  let listenerEntries = [];

  /* istanbul ignore next: not testable with Karma */
  function onBeforeUnload(event) {
    const syncResult = runListenerEntries(
      listenerEntries,
      null,
      (result) => result,
    );

    if (syncResult === true || syncResult === undefined) {
      // An asynchronous navigation listener usually means there will be a
      //  custom confirm dialog. However, we'll already be showing the before
      //  unload dialog, and there's no way to prevent the custom dialog from
      //  showing. This is really an error condition in the navigation
      //  listener, but this is the most reasonable thing we can do.
      return undefined;
    }

    const resultSafe = syncResult || '';

    event.preventDefault();
    event.returnValue = resultSafe; // eslint-disable-line no-param-reassign
    return resultSafe;
  }

  function addListener(listener, { beforeUnload = false } = {}) {
    // Add the beforeunload event listener only as needed, as its presence
    //  prevents the page from being added to the page navigation cache.
    if (beforeUnload && listenerEntries.every((item) => !item.beforeUnload)) {
      window.addEventListener('beforeunload', onBeforeUnload);
    }

    const listenerEntry = { listener, beforeUnload };
    listenerEntries.push(listenerEntry);

    return () => {
      listenerEntries = listenerEntries.filter(
        (item) => item !== listenerEntry,
      );

      if (
        beforeUnload &&
        listenerEntries.every((item) => !item.beforeUnload)
      ) {
        window.removeEventListener('beforeunload', onBeforeUnload);
      }
    };
  }

  function navigationListenerMiddleware({ dispatch }) {
    return (next) => (action) => {
      const { type, payload } = action;

      if (nextStep && type === ActionTypes.UPDATE_LOCATION) {
        const step = nextStep;
        nextStep = null;
        return step(next, action);
      }

      switch (type) {
        case ActionTypes.NAVIGATE:
          return runAllowNavigation(
            listenerEntries,
            payload,
            (allowNavigation) => {
              if (!allowNavigation) {
                return null;
              }

              // Skip the repeated navigation listener check on
              //  UPDATE_LOCATION.
              nextStep = (nextNext, nextAction) => nextNext(nextAction);

              return next(action);
            },
          );
        case ActionTypes.UPDATE_LOCATION: {
          // No navigation listeners to run.
          if (!listenerEntries.length) {
            return next(action);
          }

          // This is the initial load. It doesn't make sense to block this
          //  navigation.
          if (payload.delta === 0) {
            return next(action);
          }

          // Without delta, we can't restore the location.
          if (payload.delta == null) {
            return runAllowNavigation(
              listenerEntries,
              payload,
              (allowNavigation) => (allowNavigation ? next(action) : null),
            );
          }

          const finishRunAllowNavigation = (result) => {
            if (!maybeConfirm(result)) {
              return null;
            }

            // Release the original UPDATE_LOCATION when the un-rewind
            //  happens. We need to do so here to maintain the invariant that
            //  the store location only updates after the window location.
            nextStep = () => next(action);

            dispatch(Actions.go(payload.delta));
            return undefined;
          };

          let sync = true;
          let rewindDone = false;

          const syncResult = runListenerEntries(
            listenerEntries,
            payload,
            (result) => {
              if (sync) {
                return result;
              }

              if (!rewindDone) {
                // The rewind hasn't finished yet. Replace the next step listener
                //  so we finish running when that happens.
                nextStep = () => finishRunAllowNavigation(result);
                return undefined;
              }

              return finishRunAllowNavigation(result);
            },
          );

          sync = false;

          switch (syncResult) {
            case true:
              // The navigation was synchronously allowed, so skip the rewind.
              return next(action);
            case false:
              // We're done as soon as the rewind finishes.
              nextStep = () => {};
              break;
            case undefined:
              // Let the callback from runListeners take care of things.
              nextStep = () => {
                rewindDone = true;
              };
              break;
            default:
              // Show the confirm dialog after the rewind.
              nextStep = () => finishRunAllowNavigation(syncResult);
          }

          dispatch(Actions.go(-payload.delta));
          return undefined;
        }
        case ActionTypes.DISPOSE:
          if (listenerEntries.length > 0 && onBeforeUnload) {
            window.removeEventListener('beforeunload', onBeforeUnload);
          }

          return next(action);
        default:
          return next(action);
      }
    };
  }

  navigationListenerMiddleware.addListener = addListener;
  return navigationListenerMiddleware;
}
