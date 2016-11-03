import Actions from './Actions';

import maybePromisify from './utils/maybePromisify';

export default function createStoreHistory(
  store,
  getLocation = ({ location }) => location,
) {
  return {
    listen(listener) {
      let location = getLocation(store.getState());
      listener(location);

      return store.subscribe(() => {
        const nextLocation = getLocation(store.getState());

        if (nextLocation !== location) {
          listener(nextLocation);
          location = nextLocation;
        }
      });
    },

    listenBefore(hook) {
      return store.farce.addHook(maybePromisify(hook, 1));
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
      return store.farce.createHref(location);
    },

    createLocation(location) {
      return store.farce.createLocation(location);
    },

    dispose() {
      store.dispatch(Actions.dispose());
    },

    // For compatibility with React Router v2.x.
    __v2_compatible__: true,
  };
}
