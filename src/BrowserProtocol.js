import off from 'dom-helpers/events/off';
import on from 'dom-helpers/events/on';
import invariant from 'invariant';

import createPath from './utils/createPath';

export default class BrowserProtocol {
  constructor({ basename = '' } = {}) {
    this.basename = basename.slice(-1) === '/' ?
      basename.slice(0, -1) : basename;

    this.keyPrefix = Math.random().toString(36).slice(2, 8);
    this.keyIndex = 0;

    this.index = null;
  }

  init() {
    const { pathname, search, hash } = window.location;

    let relativePathname;
    if (pathname.indexOf(this.basename) === 0) {
      relativePathname = pathname.slice(this.basename.length);
    } else {
      relativePathname = null;
    }

    const { key, index = 0, state } = window.history.state || {};
    const delta = this.index != null ? index - this.index : 0;
    this.index = index;

    return {
      action: 'POP',
      pathname: relativePathname,
      search,
      hash,
      key,
      index,
      delta,
      state,
    };
  }

  subscribe(listener) {
    const onPopState = () => {
      listener(this.init());
    };

    on(window, 'popstate', onPopState);
    return () => off(window, 'popstate', onPopState);
  }

  transition(location) {
    const { action, state } = location;

    const push = action === 'PUSH';
    invariant(
      push || action === 'REPLACE',
      `unrecognized browser protocol action ${action}`,
    );

    const delta = push ? 1 : 0;
    const extraState = this.createExtraState(delta);

    const browserState = { state, ...extraState };
    const path = `${this.basename}${createPath(location)}`;

    if (push) {
      window.history.pushState(browserState, null, path);
    } else {
      window.history.replaceState(browserState, null, path);
    }

    return { ...location, ...extraState, delta };
  }

  go(delta) {
    window.history.go(delta);
  }

  createHref(location) {
    return createPath(location);
  }

  createExtraState(delta) {
    const keyIndex = this.keyIndex++;
    this.index += delta;

    return {
      key: `${this.keyPrefix}:${keyIndex.toString(36)}`,
      index: this.index,
    };
  }
}
