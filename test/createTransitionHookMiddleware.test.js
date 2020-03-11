import { createStore } from 'redux';

import Actions from '../src/Actions';
import MemoryProtocol from '../src/MemoryProtocol';
import createHistoryEnhancer from '../src/createHistoryEnhancer';
import locationReducer from '../src/locationReducer';
import { shouldWarn, timeout } from './helpers';

describe('createTransitionHookMiddleware', () => {
  const sandbox = sinon.createSandbox();

  let protocol;
  let store;

  beforeEach(() => {
    protocol = new MemoryProtocol('/foo');

    store = createStore(locationReducer, createHistoryEnhancer({ protocol }));
    store.dispatch(Actions.init());
  });

  afterEach(() => {
    store.dispatch(Actions.dispose());

    sandbox.restore();
  });

  describe('PUSH transitions', () => {
    it('should allow transition on true', () => {
      const hook = sinon.stub().returns(true);
      store.farce.addTransitionHook(hook);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');

      expect(hook.firstCall.args[0]).to.include({
        action: 'PUSH',
        pathname: '/bar',
      });
    });

    it('should allow transition on null', () => {
      store.farce.addTransitionHook(() => null);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should block transition on false', () => {
      store.farce.addTransitionHook(() => false);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');
    });

    it('should fall through on null', () => {
      const hook1 = sinon.stub().returns(null);
      const hook2 = sinon.stub().returns(false);

      store.farce.addTransitionHook(hook1);
      store.farce.addTransitionHook(hook2);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      expect(hook1).to.have.been.calledOnce();
      expect(hook2).to.have.been.calledOnce();
    });

    it('should not fall through on non-null', () => {
      const hook1 = sinon.stub().returns(true);
      const hook2 = sinon.stub().returns(false);

      store.farce.addTransitionHook(hook1);
      store.farce.addTransitionHook(hook2);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');

      expect(hook1).to.have.been.calledOnce();
      expect(hook2).not.to.have.been.called();
    });

    it('should warn on and ignore hooks that throw', () => {
      shouldWarn(
        'Ignoring transition hook `syncHook` that failed with `Error: foo`.',
      );

      const syncHook = () => {
        throw new Error('foo');
      };

      store.farce.addTransitionHook(syncHook);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should confirm and allow transition on string', () => {
      sandbox.stub(window, 'confirm').returns(true);

      store.farce.addTransitionHook(({ pathname }) => pathname);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');

      expect(window.confirm)
        .to.have.been.calledOnce()
        .and.to.have.been.called.with('/bar');
    });

    it('should confirm and block transition on string', () => {
      sandbox.stub(window, 'confirm').returns(false);

      store.farce.addTransitionHook(({ pathname }) => pathname);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      expect(window.confirm)
        .to.have.been.calledOnce()
        .and.to.have.been.called.with('/bar');
    });

    it('should allow transition on async true', async () => {
      let resolveHook;
      store.farce.addTransitionHook(
        () =>
          new Promise(resolve => {
            resolveHook = resolve;
          }),
      );

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      resolveHook(true);
      await timeout(10);

      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should block transition on async false', async () => {
      let resolveHook;
      store.farce.addTransitionHook(
        () =>
          new Promise(resolve => {
            resolveHook = resolve;
          }),
      );

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      resolveHook(false);
      await timeout(10);

      expect(store.getState().pathname).to.equal('/foo');
    });

    it('should allow chaining async hooks', async () => {
      let resolveHook1;
      let resolveHook2;

      store.farce.addTransitionHook(
        () =>
          new Promise(resolve => {
            resolveHook1 = resolve;
          }),
      );
      store.farce.addTransitionHook(
        () =>
          new Promise(resolve => {
            resolveHook2 = resolve;
          }),
      );

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      resolveHook1(null);
      await timeout(10);

      expect(store.getState().pathname).to.equal('/foo');

      resolveHook2(true);
      await timeout(10);

      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should warn on and ignore async hooks that throw', async () => {
      shouldWarn(
        'Ignoring transition hook `asyncHook` that failed with `Error: foo`.',
      );

      // eslint-disable-next-line require-await
      const asyncHook = async () => {
        throw new Error('foo');
      };

      store.farce.addTransitionHook(asyncHook);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      await timeout(10);

      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should allow removing hooks', () => {
      const removeHook = store.farce.addTransitionHook(() => false);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      removeHook();

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');
    });
  });

  describe('POP transitions', () => {
    beforeEach(() => {
      store.dispatch(Actions.push('/bar'));
    });

    it('should allow transition on true', () => {
      const hook = sinon.stub().returns(true);
      store.farce.addTransitionHook(hook);

      store.dispatch(Actions.go(-1));
      expect(store.getState().pathname).to.equal('/foo');

      expect(hook.firstCall.args[0]).to.include({
        action: 'POP',
        pathname: '/foo',
        delta: -1,
      });
    });

    it('should block transition on false', () => {
      store.farce.addTransitionHook(() => false);

      store.dispatch(Actions.go(-1));
      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should allow transition on async true', async () => {
      let resolveHook;
      store.farce.addTransitionHook(
        () =>
          new Promise(resolve => {
            resolveHook = resolve;
          }),
      );

      store.dispatch(Actions.go(-1));
      expect(store.getState().pathname).to.equal('/bar');

      resolveHook(true);
      await timeout(10);

      expect(store.getState().pathname).to.equal('/foo');
    });

    it('should block transition on async false', async () => {
      let resolveHook;
      store.farce.addTransitionHook(
        () =>
          new Promise(resolve => {
            resolveHook = resolve;
          }),
      );

      store.dispatch(Actions.go(-1));
      expect(store.getState().pathname).to.equal('/bar');

      resolveHook(false);
      await timeout(10);

      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should confirm and allow transition on string', () => {
      sandbox.stub(window, 'confirm').returns(true);

      store.farce.addTransitionHook(({ pathname }) => pathname);

      store.dispatch(Actions.go(-1));
      expect(store.getState().pathname).to.equal('/foo');

      expect(window.confirm)
        .to.have.been.calledOnce()
        .and.to.have.been.called.with('/bar');
    });

    it('should ignore the initial load', () => {
      // Get rid of the old store. We'll replace it with a new one.
      store.dispatch(Actions.dispose());

      store = createStore(
        locationReducer,
        createHistoryEnhancer({ protocol: new MemoryProtocol('/foo') }),
      );
      store.farce.addTransitionHook(() => false);

      expect(store.getState()).to.be.null();
      store.dispatch(Actions.init());
      expect(store.getState().pathname).to.equal('/foo');
    });

    it('should support async rewinding', async () => {
      // eslint-disable-next-line no-underscore-dangle
      const listener = protocol._listener;

      let resolveListener;

      // eslint-disable-next-line no-underscore-dangle
      protocol._listener = async location => {
        await new Promise(resolve => {
          resolveListener = resolve;
        });

        listener(location);
      };

      let resolveHook;
      store.farce.addTransitionHook(
        () =>
          new Promise(resolve => {
            resolveHook = resolve;
          }),
      );

      store.dispatch(Actions.go(-1));

      // Protocol popped, update to store blocked.
      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/bar');

      resolveListener();
      await timeout(10);

      // Protocol rewinded.
      expect(protocol.init().pathname).to.equal('/bar');
      expect(store.getState().pathname).to.equal('/bar');

      resolveHook(true);
      await timeout(10);

      resolveListener();
      await timeout(10);

      // Protocol re-popped, update to store delayed.
      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/bar');

      resolveListener();
      await timeout(10);

      // Store updated.
      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/foo');
    });

    it('should allow transition with null delta on true', async () => {
      let resolveHook;
      store.farce.addTransitionHook(
        () =>
          new Promise(resolve => {
            resolveHook = resolve;
          }),
      );

      /* eslint-disable no-underscore-dangle */
      protocol._index = 0;
      protocol._listener(protocol.init(null));
      /* eslint-enable no-underscore-dangle */

      // Without delta, we can't rewind on the protocol.
      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/bar');

      resolveHook(true);
      await timeout(10);

      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/foo');
    });

    it('should block store update with null delta on false', async () => {
      let resolveHook;
      store.farce.addTransitionHook(
        () =>
          new Promise(resolve => {
            resolveHook = resolve;
          }),
      );

      /* eslint-disable no-underscore-dangle */
      protocol._index = 0;
      protocol._listener(protocol.init(null));
      /* eslint-enable no-underscore-dangle */

      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/bar');

      resolveHook(false);
      await timeout(10);

      // These are out-of-sync now, but it's the best we can do.
      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/bar');
    });
  });

  it('should manage event listeners with useBeforeUnload', () => {
    // Get rid of the old store. We'll replace it with a new one.
    store.dispatch(Actions.dispose());

    sandbox.stub(window, 'addEventListener');
    sandbox.stub(window, 'removeEventListener');

    store = createStore(
      () => null,
      createHistoryEnhancer({ protocol, useBeforeUnload: true }),
    );

    expect(window.addEventListener).not.to.have.been.called();
    store.dispatch(Actions.init());
    expect(window.addEventListener)
      .to.have.been.calledOnce()
      .and.to.have.been.called.with('beforeunload');

    expect(window.removeEventListener).not.to.have.been.called();
    store.dispatch(Actions.dispose());
    expect(window.removeEventListener)
      .to.have.been.calledOnce()
      .and.to.have.been.called.with('beforeunload');
  });
});
