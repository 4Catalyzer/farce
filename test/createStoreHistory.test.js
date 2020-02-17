import { combineReducers, createStore } from 'redux';

import Actions from '../src/Actions';
import MemoryProtocol from '../src/MemoryProtocol';
import createHistoryEnhancer from '../src/createHistoryEnhancer';
import createStoreHistory from '../src/createStoreHistory';
import locationReducer from '../src/locationReducer';

describe('createStoreHistory', () => {
  let store;
  let history;
  let listener;
  let unlisten;

  beforeEach(() => {
    store = createStore(
      combineReducers({
        location: locationReducer,
      }),
      createHistoryEnhancer({
        protocol: new MemoryProtocol('/foo'),
      }),
    );

    store.dispatch(Actions.init());

    history = createStoreHistory(store);

    listener = sinon.spy();
    unlisten = history.listen(listener);

    listener.resetHistory();
  });

  afterEach(() => {
    unlisten();
    history.dispose();
  });

  it('should only call listener on location updates', () => {
    history.push('/bar');

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      pathname: '/bar',
      index: 1,
    });
    listener.resetHistory();

    store.dispatch({
      type: 'UNKNOWN',
      payload: null,
    });

    expect(listener).not.to.have.been.called();
  });
});
