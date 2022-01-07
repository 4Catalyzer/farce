import createPath from './createPath';
import ensureLocation from './ensureLocation';

const STATE_KEY = '@@farce/state';

export default class MemoryProtocol {
  constructor(initialLocation, { persistent = false } = {}) {
    this._persistent = persistent;

    const initialState = persistent ? this._loadState() : null;
    if (initialState) {
      this._stack = initialState.stack;
      this._index = initialState.index;
    } else {
      this._stack = [ensureLocation(initialLocation)];
      this._index = 0;
    }

    this._keyPrefix = Math.random().toString(36).slice(2, 8);
    this._keyIndex = 0;

    this._listener = null;
  }

  _loadState() {
    try {
      const { stack, index } = JSON.parse(
        window.sessionStorage.getItem(STATE_KEY),
      );

      // Check that the stack and index at least seem reasonable before using
      // them as state. This isn't foolproof, but it might prevent mistakes.
      if (Array.isArray(stack) && typeof index === 'number' && stack[index]) {
        return { stack, index };
      }
    } catch (e) {} // eslint-disable-line no-empty

    return null;
  }

  init(delta = 0) {
    return {
      ...this._stack[this._index],
      action: 'POP',
      index: this._index,
      delta,
    };
  }

  subscribe(listener) {
    this._listener = listener;

    return () => {
      this._listener = null;
    };
  }

  navigate(location) {
    // Match BrowserProtocol here in only saving these fields.
    const { action, pathname, search, hash, state } = location;

    const push = action === 'PUSH';

    if (!push && action !== 'REPLACE')
      throw Error(`Unrecognized browser protocol action: ${action}`);

    const delta = push ? 1 : 0;
    this._index += delta;

    const keyIndex = this._keyIndex++;
    const key = `${this._keyPrefix}:${keyIndex.toString(36)}`;

    this._stack[this._index] = { pathname, search, hash, state, key };
    if (push) {
      this._stack.length = this._index + 1;
    }

    if (this._persistent) {
      this._saveState();
    }

    return { ...location, key, index: this._index, delta };
  }

  go(delta) {
    const prevIndex = this._index;

    this._index = Math.min(
      Math.max(this._index + delta, 0),
      this._stack.length - 1,
    );

    if (this._index === prevIndex) {
      return;
    }

    if (this._persistent) {
      this._saveState();
    }

    if (this._listener) {
      this._listener(this.init(this._index - prevIndex));
    }
  }

  _saveState() {
    try {
      window.sessionStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          stack: this._stack,
          index: this._index,
        }),
      );
    } catch (e) {} // eslint-disable-line no-empty
  }

  createHref(location) {
    return createPath(location);
  }
}
