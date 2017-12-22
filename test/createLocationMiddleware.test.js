import ActionTypes from '../src/ActionTypes';
import createLocationMiddleware from '../src/createLocationMiddleware';

describe('createLocationMiddleware', () => {
  let next;
  let makeLocationDescriptor;
  let makeLocation;
  let dispatch;
  beforeEach(() => {
    next = sinon.spy();
    makeLocationDescriptor = sinon.stub();
    makeLocation = sinon.stub();
    dispatch = createLocationMiddleware({
      makeLocationDescriptor,
      makeLocation,
    })()(next);
  });

  it('should transform payload of TRANSITION action with makeLocationDescriptor', () => {
    const descriptor = {
      pathname: '/path',
      search: '?bar=baz',
      hash: '#qux',
    };

    makeLocationDescriptor.returns(descriptor);

    dispatch({
      type: ActionTypes.TRANSITION,
      payload: {},
    });

    expect(next).to.be.calledWith({
      type: ActionTypes.TRANSITION,
      payload: descriptor,
    });
  });

  // eslint-disable-next-line max-len
  it('should transform payload of CREATE_HREF action with makeLocationDescriptor', () => {
    const descriptor = {
      pathname: '/path',
      search: '?bar=baz',
      hash: '#qux',
    };

    makeLocationDescriptor.returns(descriptor);

    dispatch({
      type: ActionTypes.CREATE_HREF,
      payload: {},
    });

    expect(next).to.be.calledWith({
      type: ActionTypes.CREATE_HREF,
      payload: descriptor,
    });
  });

  xit('should test CREATE_LOCATION action', () => {});

  it('should transform payload of UPDATE_LOCATION action with makeLocation', () => {
    // eslint-disable-line max-len
    const location = {
      action: 'PUSH',
      delta: 1,
      hash: '',
      index: 5,
      key: 'h0j8qq:4',
      pathname: '/new/path',
      query: {},
      search: '',
    };

    makeLocation.returns(location);

    dispatch({
      type: ActionTypes.UPDATE_LOCATION,
      payload: {},
    });

    expect(next).to.be.calledWith({
      type: ActionTypes.UPDATE_LOCATION,
      payload: location,
    });
  });

  it('should not affect other action', () => {
    const UNKNOWN = 'UNKNOWN';
    dispatch({
      type: UNKNOWN,
      payload: {
        pathname: '/foo?bar=baz#qux',
      },
    });

    expect(next).to.be.calledWith({
      type: UNKNOWN,
      payload: {
        pathname: '/foo?bar=baz#qux',
      },
    });
  });
});
