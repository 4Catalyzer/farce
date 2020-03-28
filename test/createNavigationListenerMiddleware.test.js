import delay from 'delay';
import pDefer from 'p-defer';
import { createStore } from 'redux';

import Actions from '../src/Actions';
import MemoryProtocol from '../src/MemoryProtocol';
import createHistoryEnhancer from '../src/createHistoryEnhancer';
import locationReducer from '../src/locationReducer';
import { shouldWarn } from './helpers';

describe('createNavigationListenerMiddleware', () => {
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

  describe('PUSH navigations', () => {
    it('should allow navigation on true', () => {
      const listener = sinon.stub().returns(true);
      store.farce.addNavigationListener(listener);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');

      expect(listener.firstCall.args[0]).to.include({
        action: 'PUSH',
        pathname: '/bar',
      });
    });

    it('should allow navigation on null', () => {
      store.farce.addNavigationListener(() => null);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should block navigation on false', () => {
      store.farce.addNavigationListener(() => false);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');
    });

    it('should fall through on null', () => {
      const listener1 = sinon.stub().returns(null);
      const listener2 = sinon.stub().returns(false);

      store.farce.addNavigationListener(listener1);
      store.farce.addNavigationListener(listener2);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      expect(listener1).to.have.been.calledOnce();
      expect(listener2).to.have.been.calledOnce();
    });

    it('should not fall through on non-null', () => {
      const listener1 = sinon.stub().returns(true);
      const listener2 = sinon.stub().returns(false);

      store.farce.addNavigationListener(listener1);
      store.farce.addNavigationListener(listener2);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');

      expect(listener1).to.have.been.calledOnce();
      expect(listener2).not.to.have.been.called();
    });

    it('should warn on and ignore listeners that throw', () => {
      shouldWarn(
        'Ignoring navigation listener `syncListener` that failed with `Error: foo`.',
      );

      const syncListener = () => {
        throw new Error('foo');
      };

      store.farce.addNavigationListener(syncListener);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should confirm and allow navigation on string', () => {
      sandbox.stub(window, 'confirm').returns(true);

      store.farce.addNavigationListener(({ pathname }) => pathname);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');

      expect(window.confirm)
        .to.have.been.calledOnce()
        .and.to.have.been.called.with('/bar');
    });

    it('should confirm and block navigation on string', () => {
      sandbox.stub(window, 'confirm').returns(false);

      store.farce.addNavigationListener(({ pathname }) => pathname);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      expect(window.confirm)
        .to.have.been.calledOnce()
        .and.to.have.been.called.with('/bar');
    });

    it('should allow navigation on async true', async () => {
      const deferred = pDefer();
      store.farce.addNavigationListener(() => deferred.promise);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      deferred.resolve(true);
      await delay(10);

      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should block navigation on async false', async () => {
      const deferred = pDefer();
      store.farce.addNavigationListener(() => deferred.promise);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      deferred.resolve(false);
      await delay(10);

      expect(store.getState().pathname).to.equal('/foo');
    });

    it('should allow chaining async listeners', async () => {
      const deferred1 = pDefer();
      const deferred2 = pDefer();

      store.farce.addNavigationListener(() => deferred1.promise);
      store.farce.addNavigationListener(() => deferred2.promise);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      deferred1.resolve(null);
      await delay(10);

      expect(store.getState().pathname).to.equal('/foo');

      deferred2.resolve(true);
      await delay(10);

      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should warn on and ignore async listeners that throw', async () => {
      shouldWarn(
        'Ignoring navigation listener `asyncListener` that failed with `Error: foo`.',
      );

      // eslint-disable-next-line require-await
      const asyncListener = async () => {
        throw new Error('foo');
      };

      store.farce.addNavigationListener(asyncListener);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      await delay(10);

      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should allow removing listeners', () => {
      const removeNavigationListener = store.farce.addNavigationListener(
        () => false,
      );

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/foo');

      removeNavigationListener();

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');
    });
  });

  describe('POP navigations', () => {
    beforeEach(() => {
      store.dispatch(Actions.push('/bar'));
    });

    it('should allow navigation on true', () => {
      const listener = sinon.stub().returns(true);
      store.farce.addNavigationListener(listener);

      store.dispatch(Actions.go(-1));
      expect(store.getState().pathname).to.equal('/foo');

      expect(listener.firstCall.args[0]).to.include({
        action: 'POP',
        pathname: '/foo',
        delta: -1,
      });
    });

    it('should block navigation on false', () => {
      store.farce.addNavigationListener(() => false);

      store.dispatch(Actions.go(-1));
      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should allow navigation on async true', async () => {
      const deferred = pDefer();
      store.farce.addNavigationListener(() => deferred.promise);

      store.dispatch(Actions.go(-1));
      expect(store.getState().pathname).to.equal('/bar');

      deferred.resolve(true);
      await delay(10);

      expect(store.getState().pathname).to.equal('/foo');
    });

    it('should block navigation on async false', async () => {
      const deferred = pDefer();
      store.farce.addNavigationListener(() => deferred.promise);

      store.dispatch(Actions.go(-1));
      expect(store.getState().pathname).to.equal('/bar');

      deferred.resolve(false);
      await delay(10);

      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should confirm and allow navigation on string', () => {
      sandbox.stub(window, 'confirm').returns(true);

      store.farce.addNavigationListener(({ pathname }) => pathname);

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
      store.farce.addNavigationListener(() => false);

      expect(store.getState()).to.be.null();
      store.dispatch(Actions.init());
      expect(store.getState().pathname).to.equal('/foo');
    });

    it('should support async rewinding', async () => {
      // eslint-disable-next-line no-underscore-dangle
      const listener = protocol._listener;

      let protocolDeferred;

      // eslint-disable-next-line no-underscore-dangle
      protocol._listener = async (location) => {
        protocolDeferred = pDefer();
        await protocolDeferred.promise;

        listener(location);
      };

      const deferred = pDefer();
      store.farce.addNavigationListener(() => deferred.promise);

      store.dispatch(Actions.go(-1));

      // Protocol popped, update to store blocked.
      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/bar');

      protocolDeferred.resolve();
      await delay(10);

      // Protocol rewinded.
      expect(protocol.init().pathname).to.equal('/bar');
      expect(store.getState().pathname).to.equal('/bar');

      deferred.resolve(true);
      await delay(10);

      protocolDeferred.resolve();
      await delay(10);

      // Protocol re-popped, update to store delayed.
      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/bar');

      protocolDeferred.resolve();
      await delay(10);

      // Store updated.
      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/foo');
    });

    it('should allow navigation with null delta on true', async () => {
      const deferred = pDefer();
      store.farce.addNavigationListener(() => deferred.promise);

      /* eslint-disable no-underscore-dangle */
      protocol._index = 0;
      protocol._listener(protocol.init(null));
      /* eslint-enable no-underscore-dangle */

      // Without delta, we can't rewind on the protocol.
      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/bar');

      deferred.resolve(true);
      await delay(10);

      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/foo');
    });

    it('should block store update with null delta on false', async () => {
      const deferred = pDefer();
      store.farce.addNavigationListener(() => deferred.promise);

      /* eslint-disable no-underscore-dangle */
      protocol._index = 0;
      protocol._listener(protocol.init(null));
      /* eslint-enable no-underscore-dangle */

      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/bar');

      deferred.resolve(false);
      await delay(10);

      // These are out-of-sync now, but it's the best we can do.
      expect(protocol.init().pathname).to.equal('/foo');
      expect(store.getState().pathname).to.equal('/bar');
    });
  });

  describe('beforeUnload', () => {
    beforeEach(() => {
      // Get rid of the old store. We'll replace it with a new one.
      store.dispatch(Actions.dispose());

      sandbox.stub(window, 'addEventListener');
      sandbox.stub(window, 'removeEventListener');

      store = createStore(() => null, createHistoryEnhancer({ protocol }));

      store.dispatch(Actions.init());
    });

    it('should manage event listener', () => {
      expect(window.addEventListener).not.to.have.been.called();

      const removeNavigationListener1 = store.farce.addNavigationListener(
        () => null,
        { beforeUnload: true },
      );
      expect(window.addEventListener)
        .to.have.been.calledOnce()
        .and.to.have.been.called.with('beforeunload');

      const removeNavigationListener2 = store.farce.addNavigationListener(
        () => null,
        { beforeUnload: true },
      );
      expect(window.addEventListener)
        .to.have.been.calledOnce()
        .and.to.have.been.called.with('beforeunload');

      removeNavigationListener1();
      expect(window.removeEventListener).not.to.have.been.called();

      removeNavigationListener2();
      expect(window.removeEventListener)
        .to.have.been.calledOnce()
        .and.to.have.been.called.with('beforeunload');
    });

    it('should remove event listener on dispose', () => {
      store.farce.addNavigationListener(() => null, { beforeUnload: true });
      expect(window.removeEventListener).not.to.have.been.called();

      store.dispatch(Actions.dispose());
      expect(window.removeEventListener)
        .to.have.been.calledOnce()
        .and.to.have.been.called.with('beforeunload');
    });

    it('should not add event listener without beforeUnload', () => {
      const removeNavigationListener = store.farce.addNavigationListener(
        () => null,
      );
      expect(window.addEventListener).not.to.have.been.called();

      removeNavigationListener();
      expect(window.removeEventListener).not.to.have.been.called();
    });
  });
});
