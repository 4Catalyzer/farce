import createPath from '../src/createPath';

describe('createPath', () => {
  it('should create path using pathname, search, and hash', () => {
    expect(
      createPath({
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      }),
    ).to.equal('/foo?bar=baz#qux');
  });
});
