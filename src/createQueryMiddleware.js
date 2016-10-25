import ActionTypes from './ActionTypes';

function stringifyQuery(location, stringify) {
  const { query } = location;
  if (query === undefined) {
    return location;
  }

  const queryString = stringify(query);
  const search = queryString ? `?${queryString}` : '';

  return { ...location, search };
}

function parseQuery(location, parse) {
  if (location.query !== undefined) {
    return location;
  }

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
          return next({
            type,
            payload: stringifyQuery(payload, stringify),
          });
        case ActionTypes.CREATE_LOCATION:
          return parseQuery(
            next({
              type,
              payload: stringifyQuery(payload, stringify),
            }),
            parse,
          );
        case ActionTypes.UPDATE_LOCATION:
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
