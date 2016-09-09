import ActionTypes from './ActionTypes';

function stringifyQuery(location, stringify) {
  return {
    ...location,
    search: `?${stringify(location.query)}`,
  };
}

function parseQuery(location, parse) {
  let query;
  try {
    query = parse(location.search.slice(1));
  } catch (e) {
    query = null;
  }

  return { ...location, query };
}

export default function createQueryMiddleware({ parse, stringify }) {
  return function queryMiddleware() {
    return next => (action) => {
      const { type, payload } = action;

      switch (type) {
        case ActionTypes.TRANSITION:
        case ActionTypes.CREATE_HREF:
        case ActionTypes.CREATE_LOCATION:
          return next({
            type,
            payload: payload.query !== undefined ?
              stringifyQuery(payload, stringify) :
              parseQuery(payload, parse),
          });
        case ActionTypes.LOCATION_UPDATED:
          return next({
            type,
            payload: parseQuery(payload, parse),
          });
        default:
          return next(action);
      }
    };
  };
}
