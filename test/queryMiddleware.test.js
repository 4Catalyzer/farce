import queryMiddleware from '../src/queryMiddleware';
import { invokeMakeLocation, invokeMakeLocationDescriptor } from './helpers';

describe('queryMiddleware', () => {
  describe('makeLocationDescriptor', () => {
    it('should create a search string', () => {
      expect(
        invokeMakeLocationDescriptor(queryMiddleware, {
          pathname: '/path',
          query: {
            foo: 'bar',
          },
        }),
      ).to.include({
        pathname: '/path',
        search: '?foo=bar',
      });
    });

    it('should not modify the search string without a query', () => {
      expect(
        invokeMakeLocationDescriptor(queryMiddleware, {
          pathname: '/path',
          search: '?foo',
        }),
      ).to.include({
        pathname: '/path',
        search: '?foo',
      });
    });

    it('should replace the existing search string', () => {
      expect(
        invokeMakeLocationDescriptor(queryMiddleware, {
          pathname: '/path',
          query: {
            foo: 'bar',
          },
          search: '?baz',
        }),
      ).to.include({
        pathname: '/path',
        search: '?foo=bar',
      });
    });

    it('should create empty search for empty query', () => {
      expect(
        invokeMakeLocationDescriptor(queryMiddleware, {
          pathname: '/path',
          query: {},
        }),
      ).to.include({
        pathname: '/path',
        search: '',
      });
    });
  });

  describe('makeLocation', () => {
    it('should create a search string', () => {
      expect(
        invokeMakeLocation(queryMiddleware, {
          pathname: '/path',
          search: '?foo=bar',
        }),
      ).to.deep.include({
        pathname: '/path',
        query: {
          foo: 'bar',
        },
      });
    });

    it('should preserve the supplied query', () => {
      expect(
        invokeMakeLocation(queryMiddleware, {
          pathname: '/path',
          query: {
            foo: 'bar',
            baz: undefined,
          },
          search: '?foo=bar',
        }),
      ).to.deep.include({
        pathname: '/path',
        query: {
          foo: 'bar',
          baz: undefined,
        },
      });
    });

    it('should handle malformed search strings', () => {
      expect(
        invokeMakeLocation(queryMiddleware, {
          pathname: '/path',
          search: '?%%7C',
        }),
      ).to.deep.include({
        pathname: '/path',
        query: {
          '%|': null,
        },
      });
    });

    it('should handle broken search strings', () => {
      expect(
        invokeMakeLocation(queryMiddleware, {
          pathname: '/path',
          search: null,
        }),
      ).to.include({
        pathname: '/path',
        query: null,
      });
    });
  });
});
