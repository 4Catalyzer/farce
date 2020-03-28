import ActionTypes from '../src/ActionTypes';
import createLocationMiddleware from '../src/createLocationMiddleware';

describe('createLocationMiddleware', () => {
  const middleware = createLocationMiddleware({
    makeLocationDescriptor: (descriptor) => ({ descriptor }),
    makeLocation: (location) => ({ location }),
  });

  const dispatch = middleware()((action) => action.payload);

  it('should handle location descriptors for NAVIGATE', () => {
    expect(
      dispatch({
        type: ActionTypes.NAVIGATE,
        payload: {},
      }),
    ).to.eql({
      descriptor: {},
    });
  });

  it('should handle location descriptors for CREATE_HREF', () => {
    expect(
      dispatch({
        type: ActionTypes.CREATE_HREF,
        payload: {},
      }),
    ).to.eql({
      descriptor: {},
    });
  });

  it('should create locations for CREATE_LOCATION', () => {
    expect(
      dispatch({
        type: ActionTypes.CREATE_LOCATION,
        payload: {},
      }),
    ).to.eql({
      location: {
        descriptor: {},
      },
    });
  });

  it('should handle locations for UPDATE_LOCATION', () => {
    expect(
      dispatch({
        type: ActionTypes.UPDATE_LOCATION,
        payload: {},
      }),
    ).to.eql({
      location: {},
    });
  });

  it('should ignore other actions', () => {
    expect(
      dispatch({
        type: 'UNKNOWN',
        payload: { unknown: {} },
      }),
    ).to.eql({
      unknown: {},
    });
  });
});
