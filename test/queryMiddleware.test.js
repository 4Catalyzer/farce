import queryMiddleware from '../src/queryMiddleware';

import { invokeMakeLocation, invokeMakeLocationDescriptor } from './helpers';

describe('queryMiddleware', () => {
  describe('makeLocationDescriptor', () => {
    it('should create a search string', () => {
      expect(invokeMakeLocationDescriptor(queryMiddleware, {
        path: '/path',
        query: {
          foo: 'bar',
        },
      })).to.include({
        path: '/path',
        search: '?foo=bar',
      });
    });

    it('should not modify the search string without a query', () => {
      expect(invokeMakeLocationDescriptor(queryMiddleware, {
        path: '/path',
        search: '?foo',
      })).to.include({
        path: '/path',
        search: '?foo',
      });
    });

    it('should replace the existing search string', () => {
      expect(invokeMakeLocationDescriptor(queryMiddleware, {
        path: '/path',
        query: {
          foo: 'bar',
        },
        search: '?baz',
      })).to.include({
        path: '/path',
        search: '?foo=bar',
      });
    });
  });

  describe('makeLocation', () => {
    it('should create a search string', () => {
      expect(invokeMakeLocation(queryMiddleware, {
        path: '/path',
        search: '?foo=bar',
      })).to.deep.include({
        path: '/path',
        query: {
          foo: 'bar',
        },
      });
    });

    it('should preserve the supplied query', () => {
      expect(invokeMakeLocation(queryMiddleware, {
        path: '/path',
        query: {
          foo: 'bar',
          baz: undefined,
        },
        search: '?foo=bar',
      })).to.deep.include({
        path: '/path',
        query: {
          foo: 'bar',
          baz: undefined,
        },
      });
    });

    it('should handle malformed search strings', () => {
      expect(invokeMakeLocation(queryMiddleware, {
        path: '/path',
        search: '?%%7C',
      })).to.deep.include({
        path: '/path',
        query: {
          '%|': null,
        },
      });
    });
  });
});
