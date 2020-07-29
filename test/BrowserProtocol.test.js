import delay from 'delay';

import BrowserProtocol from '../src/BrowserProtocol';

describe('BrowserProtocol', () => {
  beforeEach(() => {
    window.history.replaceState(null, null, '/');
  });

  it('should parse the initial location', () => {
    window.history.replaceState(null, null, '/foo?bar=baz#qux');
    const protocol = new BrowserProtocol();

    expect(protocol.init()).to.eql({
      action: 'POP',
      pathname: '/foo',
      search: '?bar=baz',
      hash: '#qux',
      key: undefined,
      index: 0,
      delta: 0,
      state: undefined,
    });
  });

  it('should support basic navigation', async () => {
    window.history.replaceState(null, null, '/foo');
    const protocol = new BrowserProtocol();

    const listener = sinon.spy();
    protocol.subscribe(listener);

    const barLocation = protocol.navigate({
      action: 'PUSH',
      pathname: '/bar',
      search: '?search',
      hash: '#hash',
      state: { the: 'state' },
    });

    expect(window.location).to.include({
      pathname: '/bar',
      search: '?search',
      hash: '#hash',
    });
    expect(barLocation).to.deep.include({
      action: 'PUSH',
      pathname: '/bar',
      search: '?search',
      hash: '#hash',
      index: 1,
      delta: 1,
      state: { the: 'state' },
    });
    expect(barLocation.key).not.to.be.empty();

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

    expect(window.location.pathname).to.equal('/baz');

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

    expect(window.location.pathname).to.equal('/qux');
    expect(listener).not.to.have.been.called();

    protocol.go(-1);
    await delay(20);

    expect(window.location).to.include({
      pathname: '/bar',
      search: '?search',
      hash: '#hash',
    });
    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      action: 'POP',
      pathname: '/bar',
      search: '?search',
      hash: '#hash',
      key: barLocation.key,
      index: 1,
      delta: -1,
      state: { the: 'state' },
    });
    listener.resetHistory();

    window.history.back();
    await delay(20);

    expect(window.location.pathname).to.equal('/foo');
    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      action: 'POP',
      pathname: '/foo',
      index: 0,
      delta: -1,
      state: undefined,
    });
    listener.resetHistory();
  });

  it('should support subscribing and unsubscribing', async () => {
    const protocol = new BrowserProtocol();
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
    const protocol = new BrowserProtocol();

    expect(
      protocol.createHref({
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      }),
    ).to.equal('/foo?bar=baz#qux');
  });
});
