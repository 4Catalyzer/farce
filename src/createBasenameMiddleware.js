import createLocationMiddleware from './createLocationMiddleware';

export default function createBasenameMiddleware({ basename }) {
  if (!basename || basename === '/') {
    // Fast path in case basename is trivial.
    return () => (next) => next;
  }

  // Normalize away trailing slash on basename.
  const pathnamePrefix =
    basename.slice(-1) === '/' ? basename.slice(0, -1) : basename;

  return createLocationMiddleware({
    makeLocationDescriptor: (location) => ({
      ...location,
      pathname: `${pathnamePrefix}${location.pathname}`,
    }),
    makeLocation: (location) => ({
      ...location,
      pathname:
        location.pathname.indexOf(pathnamePrefix) === 0
          ? location.pathname.slice(pathnamePrefix.length)
          : null,
    }),
  });
}
