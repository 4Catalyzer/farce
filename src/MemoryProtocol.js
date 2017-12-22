import createPath from './utils/createPath';
import ensureLocation from './utils/ensureLocation';

function noop() {}

const STACK_KEY = '@@farce/memory-stack';
const storage = window.sessionStorage;

const sessionHistory = {
  stack: null,
  init(initialLocation = '/') {
    this.stack = JSON.parse(storage.getItem(STACK_KEY) || 'null') || [
      ensureLocation(initialLocation),
    ];
  },
  last() {
    return this.stack[this.stack.length - 1];
  },

  put(idx, frame) {
    this.stack.length = idx;
    this.stack[idx] = frame;
    storage.setItem(STACK_KEY, JSON.stringify(this.stack));
  },

  replace(idx, frame) {
    this.stack[idx] = frame;
    storage.setItem(STACK_KEY, JSON.stringify(this.stack));
  },
};

export default class MemoryProtocol {
  static _history = sessionHistory;

  constructor(initialLocation) {
    sessionHistory.init(initialLocation);
    this.index = null;
  }

  init() {
    const index = sessionHistory.stack.length - 1;
    const location = sessionHistory.stack[index];

    this.index = index;

    return {
      ...location,
      action: 'POP',
    };
  }

  transition(location) {
    const { action, pathname, search, hash } = location;

    const push = action === 'PUSH';
    this.index += push ? 1 : 0;

    sessionHistory[push ? 'put' : 'replace'](this.index, {
      pathname,
      search,
      hash,
    });

    return location;
  }

  go(delta) {
    const nextIdx = Math.min(
      Math.max(this.index + delta, 0),
      sessionHistory.stack.length - 1,
    );
    if (nextIdx === this.index) return;

    this.index = nextIdx;
    const location = sessionHistory.stack[this.index];
    if (this.listener) this.listener(location);
  }

  createHref(location) {
    return createPath(location);
  }

  subscribe(listener) {
    this.listener = listener;
    return () => {
      this.listener = noop;
    };
  }
}
