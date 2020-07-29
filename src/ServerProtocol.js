import createPath from './createPath';
import ensureLocation from './ensureLocation';

function noop() {}

export default class ServerProtocol {
  constructor(url) {
    this._location = ensureLocation(url);
  }

  init() {
    return {
      action: 'POP',
      ...this._location,
    };
  }

  subscribe() {
    // Server protocol emits no events.
    return noop;
  }

  createHref(location) {
    return createPath(location);
  }

  // The other methods are not implemented, because ServerProtocol instances
  // cannot navigate.
}
