import ServerProtocol from '../src/ServerProtocol';

describe('ServerProtocol', () => {
  it('should create initial location when init be called', () => {
    const protocol = new ServerProtocol('/foo?bar=baz#qux');
    expect(protocol.init()).to.eql({
      action: 'POP',
      pathname: '/foo',
      search: '?bar=baz',
      hash: '#qux',
    });
  });

  it('should not throw when unsubscribe be called', () => {
    const protocol = new ServerProtocol('/foo?bar=baz#qux');
    const unsubscribe = protocol.subscribe();
    expect(unsubscribe).to.not.throw();
  });

  it('should create link when createHref be called with location', () => {
    const protocol = new ServerProtocol('/foo?bar=baz#qux');
    expect(protocol.createHref({
      pathname: '/foo',
      search: '?bar=baz',
      hash: '#qux',
    })).to.equal('/foo?bar=baz#qux');
  });
});
