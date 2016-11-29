import createPath from './utils/createPath';
import ensureLocation from './utils/ensureLocation';

export default class ServerProtocol {
  constructor(url) {
    this.location = ensureLocation(url);
  }

  init() {
    return {
      action: 'POP',
      ...this.location,
    };
  }

  subscribe() {
    // Server protocol emits no events.
  }

  createHref(location) {
    return createPath(location);
  }

  // The other methods are not implemented, because ServerProtocol instances
  // cannot navigate.
}
