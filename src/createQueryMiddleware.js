import createLocationMiddleware from './createLocationMiddleware';

export default function createQueryMiddleware({ parse, stringify }) {
  return createLocationMiddleware({
    makeLocationDescriptor(location) {
      const { query } = location;
      if (query === undefined) {
        return location;
      }

      const queryString = stringify(query);
      const search = queryString ? `?${queryString}` : '';

      return { ...location, search };
    },

    makeLocation(location) {
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
    },
  });
}
