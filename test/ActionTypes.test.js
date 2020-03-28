import ActionTypes from '../src/ActionTypes';

describe('ActionTypes', () => {
  it('should have the correct exports', () => {
    expect(ActionTypes.INIT).to.exist();
    expect(ActionTypes.PUSH).to.exist();
    expect(ActionTypes.REPLACE).to.exist();
    expect(ActionTypes.NAVIGATE).to.exist();
    expect(ActionTypes.GO).to.exist();
    expect(ActionTypes.CREATE_HREF).to.exist();
    expect(ActionTypes.CREATE_LOCATION).to.exist();
    expect(ActionTypes.UPDATE_LOCATION).to.exist();
    expect(ActionTypes.DISPOSE).to.exist();
  });
});
