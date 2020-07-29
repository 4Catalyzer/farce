import MemoryProtocol from '../src/MemoryProtocol';

describe('MemoryProtocol', () => {
  it('should parse the initial location', () => {
    const protocol = new MemoryProtocol('/foo?bar=baz#qux');

    expect(protocol.init()).to.eql({
      action: 'POP',
      pathname: '/foo',
      search: '?bar=baz',
      hash: '#qux',
      index: 0,
      delta: 0,
    });
  });

  it('should support basic navigation', () => {
    const protocol = new MemoryProtocol('/foo');

    const listener = sinon.spy();
    protocol.subscribe(listener);

    const barLocation = protocol.navigate({
      action: 'PUSH',
      pathname: '/bar',
      state: { the: 'state' },
    });

    expect(barLocation).to.deep.include({
      action: 'PUSH',
      pathname: '/bar',
      index: 1,
      delta: 1,
      state: { the: 'state' },
    });
    expect(barLocation.key).not.to.be.empty();

    expect(protocol.navigate({ action: 'PUSH', pathname: '/baz' })).to.include(
      {
        action: 'PUSH',
        pathname: '/baz',
        index: 2,
        delta: 1,
      },
    );

    expect(
      protocol.navigate({ action: 'REPLACE', pathname: '/qux' }),
    ).to.include({
      action: 'REPLACE',
      pathname: '/qux',
      index: 2,
      delta: 0,
    });

    expect(listener).not.to.have.been.called();

    protocol.go(-1);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      action: 'POP',
      pathname: '/bar',
      key: barLocation.key,
      index: 1,
      delta: -1,
      state: { the: 'state' },
    });
  });

  it('should support subscribing and unsubscribing', () => {
    const protocol = new MemoryProtocol('/foo');
    protocol.navigate({ action: 'PUSH', pathname: '/bar' });
    protocol.navigate({ action: 'PUSH', pathname: '/baz' });

    const listener = sinon.spy();
    const unsubscribe = protocol.subscribe(listener);

    protocol.go(-1);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      action: 'POP',
      pathname: '/bar',
    });
    listener.resetHistory();

    unsubscribe();

    protocol.go(-1);

    expect(listener).not.to.have.been.called();
  });

  it('should respect stack bounds', () => {
    const protocol = new MemoryProtocol('/foo');
    protocol.navigate({ action: 'PUSH', pathname: '/bar' });
    protocol.navigate({ action: 'PUSH', pathname: '/baz' });

    const listener = sinon.spy();
    protocol.subscribe(listener);

    protocol.go(-390);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      action: 'POP',
      pathname: '/foo',
      delta: -2,
    });
    listener.resetHistory();

    protocol.go(-1);

    expect(listener).not.to.have.been.called();

    protocol.go(+22);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      action: 'POP',
      pathname: '/baz',
      delta: 2,
    });
    listener.resetHistory();

    protocol.go(+1);

    expect(listener).not.to.have.been.called();
  });

  it('should reset forward entries on push', () => {
    const protocol = new MemoryProtocol('/foo');
    protocol.navigate({ action: 'PUSH', pathname: '/bar' });
    protocol.navigate({ action: 'PUSH', pathname: '/baz' });
    protocol.go(-2);
    protocol.navigate({ action: 'REPLACE', pathname: '/qux' });

    const listener = sinon.spy();
    protocol.subscribe(listener);

    protocol.go(+1);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      action: 'POP',
      pathname: '/bar',
      delta: 1,
    });
  });

  it('should not reset forward entries on replace', () => {
    const protocol = new MemoryProtocol('/foo');
    protocol.navigate({ action: 'PUSH', pathname: '/bar' });
    protocol.navigate({ action: 'PUSH', pathname: '/baz' });
    protocol.go(-2);
    protocol.navigate({ action: 'PUSH', pathname: '/qux' });

    const listener = sinon.spy();
    protocol.subscribe(listener);

    protocol.go(+1);

    expect(listener).not.to.have.been.called();
  });

  it('should support createHref', () => {
    const protocol = new MemoryProtocol('/foo');

    expect(
      protocol.createHref({
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      }),
    ).to.equal('/foo?bar=baz#qux');
  });

  describe('persistence', () => {
    beforeEach(() => {
      window.sessionStorage.clear();
    });

    it('should support persistence', () => {
      const protocol1 = new MemoryProtocol('/foo', { persistent: true });
      expect(protocol1.init()).to.include({
        pathname: '/foo',
      });

      protocol1.navigate({ action: 'PUSH', pathname: '/bar' });
      protocol1.navigate({ action: 'PUSH', pathname: '/baz' });
      protocol1.go(-1);

      const protocol2 = new MemoryProtocol('/foo', { persistent: true });
      expect(protocol2.init()).to.include({
        pathname: '/bar',
      });

      protocol2.go(+1);
      expect(protocol2.init()).to.include({
        pathname: '/baz',
      });
    });

    it('should ignore broken session storage entry', () => {
      sessionStorage.setItem(
        '@@farce/state',
        JSON.stringify({ stack: [], index: 2 }),
      );

      const protocol = new MemoryProtocol('/foo', { persistent: true });
      expect(protocol.init()).to.include({
        pathname: '/foo',
      });
    });
  });
});
