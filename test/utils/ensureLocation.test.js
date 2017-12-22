import ensureLocation from '../../src/utils/ensureLocation';

describe('ensureLocation', () => {
  it('should return same shape if pathname, search, hash are defined', () => {
    expect(
      ensureLocation({
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      }),
    ).to.eql({
      pathname: '/foo',
      search: '?bar=baz',
      hash: '#qux',
    });
  });

  // eslint-disable-next-line max-len
  it("should create location with default search, hash if they doesn't exist", () => {
    expect(
      ensureLocation({
        pathname: '/new/pathname',
      }),
    ).to.eql({
      pathname: '/new/pathname',
      search: '',
      hash: '',
    });
  });

  it('should parse pathname, search, hash correctly', () => {
    expect(ensureLocation('/foo')).to.eql({
      pathname: '/foo',
      search: '',
      hash: '',
    });

    expect(ensureLocation('/foo?bar=baz')).to.eql({
      pathname: '/foo',
      search: '?bar=baz',
      hash: '',
    });

    expect(ensureLocation('/foo#qux')).to.eql({
      pathname: '/foo',
      search: '',
      hash: '#qux',
    });

    expect(ensureLocation('/foo?bar=baz#qux')).to.eql({
      pathname: '/foo',
      search: '?bar=baz',
      hash: '#qux',
    });
  });
});
