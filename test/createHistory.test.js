import createHistory from '../src/createHistory';
import MemoryProtocol from '../src/MemoryProtocol';

import { timeout } from './helpers';

describe('createHistory', () => {
  let history;
  let listener;
  let unlisten;

  beforeEach(() => {
    history = createHistory({ protocol: new MemoryProtocol('/foo') });

    listener = sinon.spy();
    unlisten = history.listen(listener);

    listener.resetHistory();
  });

  afterEach(() => {
    unlisten();
    history.dispose();
  });

  it('should support push and go', () => {
    history.push('/bar');

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      pathname: '/bar',
      index: 1,
    });
    listener.resetHistory();

    history.goBack();

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      pathname: '/foo',
      index: 0,
    });
    listener.resetHistory();

    history.goForward();

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      pathname: '/bar',
      index: 1,
    });
    listener.resetHistory();

    history.go(-1);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      pathname: '/foo',
      index: 0,
    });
    listener.resetHistory();
  });

  it('should support replace', () => {
    history.replace('/bar');

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      pathname: '/bar',
      index: 0,
    });
  });

  it('should support createHref', () => {
    expect(
      history.createHref({
        pathname: '/foo',
        search: '?bar',
        hash: '#baz',
      }),
    ).to.equal('/foo?bar#baz');
  });

  it('should support createLocation', () => {
    expect(
      history.createLocation({
        pathname: '/foo',
        search: '?bar',
        hash: '#baz',
      }),
    ).to.eql({
      pathname: '/foo',
      search: '?bar',
      hash: '#baz',
    });
  });

  it('should support transition hooks', () => {
    history.listenBefore(() => false);

    history.push('/bar');
    expect(listener).not.to.have.been.called();
  });

  it('should support callback transition hooks', () => {
    history.listenBefore((location, cb) => {
      cb(false);
    });

    history.push('/bar');
    expect(listener).not.to.have.been.called();
  });

  it('should support async transition hooks', async () => {
    let resolveHook;
    history.listenBefore(async (location, cb) => {
      const result = await new Promise(resolve => {
        resolveHook = resolve;
      });

      cb(result);
    });

    history.push('/bar');
    expect(listener).not.to.have.been.called();

    resolveHook(true);
    await timeout(10);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      pathname: '/bar',
      index: 1,
    });
  });
});
