import ServerProtocol from '../src/ServerProtocol';

describe('ServerProtocol', () => {
  it('should parse the initial location', () => {
    const protocol = new ServerProtocol('/foo?bar=baz#qux');

    expect(protocol.init()).to.eql({
      action: 'POP',
      pathname: '/foo',
      search: '?bar=baz',
      hash: '#qux',
    });
  });

  it('should have dummy support for subscriptions', () => {
    const protocol = new ServerProtocol('/foo?bar=baz#qux');
    const unsubscribe = protocol.subscribe();
    expect(unsubscribe).to.not.throw();
  });

  it('should support createHref', () => {
    const protocol = new ServerProtocol('/foo?bar=baz#qux');

    expect(
      protocol.createHref({
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      }),
    ).to.equal('/foo?bar=baz#qux');
  });
});
