import createBasenameMiddleware from '../src/createBasenameMiddleware';
import { invokeMakeLocation, invokeMakeLocationDescriptor } from './helpers';

describe('createBasenameMiddleware', () => {
  [
    ['/foo', 'basic usage'],
    ['/foo/', 'trailing slash in basename'],
  ].forEach(([basename, title]) => {
    describe(title, () => {
      const basenameMiddleware = createBasenameMiddleware({ basename });

      it('should prepend basename to location descriptors', () => {
        expect(
          invokeMakeLocationDescriptor(basenameMiddleware, {
            pathname: '/path',
          }),
        ).to.eql({
          pathname: '/foo/path',
        });
      });

      it('should strip basename from locations', () => {
        expect(
          invokeMakeLocation(basenameMiddleware, {
            pathname: '/foo/path',
          }),
        ).to.eql({
          pathname: '/path',
        });
      });

      it('should set unrecognized paths to null', () => {
        expect(
          invokeMakeLocation(basenameMiddleware, {
            pathname: '/bar/path',
          }),
        ).to.eql({
          pathname: null,
        });
      });
    });
  });

  describe('trivial basename', () => {
    const basenameMiddleware = createBasenameMiddleware({ basename: '/' });

    it('should not modify location descriptors', () => {
      const location = { pathname: '/path' };
      expect(
        invokeMakeLocationDescriptor(basenameMiddleware, location),
      ).to.equal(location);
    });

    it('should not modify locations', () => {
      const location = { pathname: '/path' };
      expect(invokeMakeLocation(basenameMiddleware, location)).to.equal(
        location,
      );
    });
  });
});
