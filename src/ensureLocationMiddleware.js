import ActionTypes from './ActionTypes';

function ensureLocation(location) {
  if (typeof location === 'object') {
    // Set default values for fields other than pathname.
    return {
      search: '',
      hash: '',
      ...location,
    };
  }

  let remainingPath = location;

  const hashIndex = remainingPath.indexOf('#');
  let hash;
  if (hashIndex !== -1) {
    hash = remainingPath.slice(hashIndex);
    remainingPath = remainingPath.slice(0, hashIndex);
  } else {
    hash = '';
  }

  const searchIndex = remainingPath.indexOf('?');
  let search;
  if (searchIndex !== -1) {
    search = remainingPath.slice(searchIndex);
    remainingPath = remainingPath.slice(0, searchIndex);
  } else {
    search = '';
  }

  return {
    pathname: remainingPath,
    search,
    hash,
  };
}

export default function ensureLocationMiddleware() {
  return next => (action) => {
    const { type, payload } = action;

    switch (type) {
      case ActionTypes.PUSH:
        return next({
          type: ActionTypes.TRANSITION,
          payload: { ...ensureLocation(payload), action: 'PUSH' },
        });
      case ActionTypes.REPLACE:
        return next({
          type: ActionTypes.TRANSITION,
          payload: { ...ensureLocation(payload), action: 'REPLACE' },
        });
      case ActionTypes.CREATE_HREF:
      case ActionTypes.CREATE_LOCATION:
        return next({
          type,
          payload: ensureLocation(payload),
        });
      default:
        return next(action);
    }
  };
}
