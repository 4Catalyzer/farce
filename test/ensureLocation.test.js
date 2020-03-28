import ensureLocation from '../src/ensureLocation';

describe('ensureLocation', () => {
  it('should preserve fully-defined location descriptor objects', () => {
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

  it('should add default search and hash', () => {
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

  it('should parse full path strings', () => {
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
