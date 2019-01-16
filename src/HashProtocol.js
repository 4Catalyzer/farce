import off from 'dom-helpers/events/off';
import on from 'dom-helpers/events/on';
import invariant from 'invariant';

import StateStorage from './StateStorage';
import createPath from './utils/createPath';
import ensureLocation from './utils/ensureLocation';

export default class HashProtocol {
  constructor() {
    this.stateStorage = new StateStorage(this, '@@farce');

    this._index = null;
    this._numExpectedHashChanges = 0;
  }

  init() {
    // TODO: Do we still need to work around the old Firefox bug here?
    const location = ensureLocation(window.location.hash.slice(1) || '/');

    const { index = 0, state } = this.stateStorage.read(location, null) || {};
    const delta = this._index != null ? index - this._index : 0;
    this._index = index;

    return {
      action: 'POP',
      ...location,
      index,
      delta,
      state,
    };
  }

  subscribe(listener) {
    const onHashChange = () => {
      // Ignore hash change events triggered by our own navigation.
      if (this._numExpectedHashChanges > 0) {
        --this._numExpectedHashChanges;
        return;
      }

      listener(this.init());
    };

    on(window, 'hashchange', onHashChange);
    return () => off(window, 'hashchange', onHashChange);
  }

  transition(location) {
    const { action, state } = location;

    const push = action === 'PUSH';
    invariant(
      push || action === 'REPLACE',
      `Unrecognized hash protocol action: %s.`,
      action,
    );

    const delta = push ? 1 : 0;
    this._index += delta;

    const path = createPath(location);

    ++this._numExpectedHashChanges;
    if (push) {
      window.location.hash = path;
    } else {
      window.location.replace(`#${path}`);
    }

    this.stateStorage.save(location, null, { index: this._index, state });

    return { ...location, index: this._index, delta };
  }

  go(delta) {
    window.history.go(delta);
  }

  createHref(location) {
    return `#${createPath(location)}`;
  }
}
