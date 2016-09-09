import Actions from './Actions';

import maybePromisify from './utils/maybePromisify';

export default function createStoreHistory(store, selectLocation) {
  return {
    listen(listener) {
      let location = selectLocation(store.getState());
      listener(location);

      return store.subscribe(() => {
        const nextLocation = selectLocation(store.getState());

        if (nextLocation !== location) {
          listener(nextLocation);
          location = nextLocation;
        }
      });
    },

    listenBefore(hook) {
      return store.addTransitionHook(maybePromisify(hook, 1));
    },

    push(location) {
      store.dispatch(Actions.push(location));
    },

    replace(location) {
      store.dispatch(Actions.replace(location));
    },

    goBack() {
      store.dispatch(Actions.go(-1));
    },

    goForward() {
      store.dispatch(Actions.go(1));
    },

    go(delta) {
      store.dispatch(Actions.go(delta));
    },

    createHref(location) {
      return store.dispatch(Actions.createHref(location));
    },

    createLocation(location) {
      return store.dispatch(Actions.createLocation(location));
    },

    dispose() {
      store.dispatch(Actions.dispose());
    },

    // For compatibility with React Router v2.x.
    __v2_compatible__: true,
  };
}
