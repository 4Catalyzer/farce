export default function createPath({ pathname, search, hash }) {
  return `${pathname}${search}${hash}`;
}
