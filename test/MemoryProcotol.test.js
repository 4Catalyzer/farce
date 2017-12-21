import MemoryProtocol from '../src/MemoryProtocol';

describe('MemoryProtocol', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('should create initial location when init is called', () => {
    const protocol = new MemoryProtocol('/foo?bar=baz#qux');
    expect(protocol.init()).to.eql({
      action: 'POP',
      pathname: '/foo',
      search: '?bar=baz',
      hash: '#qux',
    });
  });

  it('should not throw when unsubscribe is called', () => {
    const protocol = new MemoryProtocol();
    const unsubscribe = protocol.subscribe();
    expect(unsubscribe).to.not.throw();
  });

  it('should track location stack', () => {
    const protocol = new MemoryProtocol('/foo');
    protocol.transition({ pathname: '/foo/bar', action: 'PUSH' });
    protocol.transition({ pathname: '/baz', action: 'PUSH' });
    protocol.go(-1);
    protocol.transition({ pathname: '/foobar', action: 'PUSH' });
    protocol.transition({ pathname: '/quz', action: 'REPLACE' });

    expect(MemoryProtocol._history.stack.map(l => l.pathname)).to.eql([
      '/foo',
      '/foo/bar',
      '/quz',
    ]);
  });

  it.only('should respect stack bounds', () => {
    const spy = sinon.spy();
    const protocol = new MemoryProtocol('/foo');
    protocol.transition({ pathname: '/foo/bar', action: 'PUSH' });
    protocol.transition({ pathname: '/quz', action: 'PUSH' });

    protocol.subscribe(spy);
    protocol.go(-390);
    protocol.go(-1);
    protocol.go(+22);
    protocol.go(+1);

    expect(spy).to.have.been.calledTwice();
    expect(spy.getCall(0).args[0]).to.have.property('pathname').equal('/foo');
    expect(spy.getCall(1).args[0]).to.have.property('pathname').equal('/quz');
  });

  it('should create href when createHref is called with location', () => {
    const protocol = new MemoryProtocol();
    expect(protocol.createHref({
      pathname: '/foo',
      search: '?bar=baz',
      hash: '#qux',
    })).to.equal('/foo?bar=baz#qux');
  });
});
