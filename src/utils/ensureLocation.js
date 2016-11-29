export default function ensureLocation(location) {
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
