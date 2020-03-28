import delay from 'delay';

import HashProtocol from '../src/HashProtocol';

describe('HashProtocol', () => {
  beforeEach(() => {
    window.history.replaceState(null, null, '/');
  });

  it('should parse the initial location', () => {
    window.history.replaceState(
      null,
      null,
      '/pathname?search#/foo?bar=baz#qux',
    );
    const protocol = new HashProtocol();

    expect(protocol.init()).to.eql({
      action: 'POP',
      pathname: '/foo',
      search: '?bar=baz',
      hash: '#qux',
      index: 0,
      delta: 0,
      state: undefined,
    });
  });

  it('should support basic navigation', async () => {
    const protocol = new HashProtocol();

    const listener = sinon.spy();
    protocol.subscribe(listener);

    const barLocation = protocol.navigate({
      action: 'PUSH',
      pathname: '/bar',
      search: '?search',
      hash: '#hash',
      state: { the: 'state' },
    });

    expect(window.location.hash).to.equal('#/bar?search#hash');
    expect(barLocation).to.deep.include({
      action: 'PUSH',
      pathname: '/bar',
      search: '?search',
      hash: '#hash',
      index: 1,
      delta: 1,
      state: { the: 'state' },
    });

    expect(
      protocol.navigate({
        action: 'PUSH',
        pathname: '/baz',
        search: '',
        hash: '',
      }),
    ).to.include({
      action: 'PUSH',
      pathname: '/baz',
      index: 2,
      delta: 1,
    });

    expect(window.location.hash).to.equal('#/baz');

    expect(
      protocol.navigate({
        action: 'REPLACE',
        pathname: '/qux',
        search: '',
        hash: '',
      }),
    ).to.include({
      action: 'REPLACE',
      pathname: '/qux',
      index: 2,
      delta: 0,
    });
    await delay(20);

    expect(window.location.hash).to.equal('#/qux');
    expect(listener).not.to.have.been.called();

    if (window.navigator.userAgent.includes('Firefox')) {
      // Firefox triggers a full page reload on hash pops.
      return;
    }

    protocol.go(-1);
    await delay(20);

    expect(window.location.hash).to.equal('#/bar?search#hash');
    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      action: 'POP',
      pathname: '/bar',
      search: '?search',
      hash: '#hash',
      index: 1,
      delta: -1,
      state: { the: 'state' },
    });
    listener.resetHistory();

    window.history.back();
    await delay(20);

    expect(window.location.hash).to.be.empty();
    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      action: 'POP',
      pathname: '/',
      index: 0,
      delta: -1,
      state: undefined,
    });
    listener.resetHistory();
  });

  it('should support subscribing and unsubscribing', async () => {
    const protocol = new HashProtocol('/foo');
    protocol.navigate({
      action: 'PUSH',
      pathname: '/bar',
      search: '',
      hash: '',
    });
    protocol.navigate({
      action: 'PUSH',
      pathname: '/baz',
      search: '',
      hash: '',
    });

    const listener = sinon.spy();
    const unsubscribe = protocol.subscribe(listener);

    if (window.navigator.userAgent.includes('Firefox')) {
      // Firefox triggers a full page reload on hash pops.
      return;
    }

    protocol.go(-1);
    await delay(20);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      action: 'POP',
      pathname: '/bar',
    });
    listener.resetHistory();

    unsubscribe();

    protocol.go(-1);
    await delay(20);

    expect(listener).not.to.have.been.called();
  });

  it('should support createHref', () => {
    const protocol = new HashProtocol();

    expect(
      protocol.createHref({
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      }),
    ).to.equal('#/foo?bar=baz#qux');
  });
});
