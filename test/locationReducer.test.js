import ActionTypes from '../src/ActionTypes';
import locationReducer from '../src/locationReducer';

describe('locationReducer', () => {
  const prevState = {
    action: 'PUSH',
    delta: 1,
    hash: '',
    index: 5,
    key: 'h0j8qq:4',
    pathname: '/new/path',
    query: {},
    search: '',
  };

  it('should handle UPDATE_LOCATION', () => {
    const newLocation = {
      action: 'PUSH',
      delta: 1,
      hash: '#qux',
      index: 6,
      key: 'h0j8qq:5',
      pathname: '/foo',
      query: {
        bar: 'baz',
      },
      search: '?bar=baz',
    };
    const action = {
      type: ActionTypes.UPDATE_LOCATION,
      payload: newLocation,
    };
    expect(locationReducer(prevState, action)).to.eql(newLocation);
  });

  it('should not handle unknown action', () => {
    const unknownAction = {
      type: 'UNKNOWN',
    };
    expect(locationReducer(prevState, unknownAction)).to.equal(prevState);
  });
});
