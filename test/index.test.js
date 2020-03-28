import * as farce from '../src';

describe('index', () => {
  it('should export top level correctly', () => {
    expect(farce.Actions).to.exist();
    expect(farce.ActionTypes).to.exist();
    expect(farce.BrowserProtocol).to.exist();
    expect(farce.createBasenameMiddleware).to.exist();
    expect(farce.createHistoryEnhancer).to.exist();
    expect(farce.createHistoryMiddleware).to.exist();
    expect(farce.createLocationMiddleware).to.exist();
    expect(farce.createNavigationListenerMiddleware).to.exist();
    expect(farce.createPath).to.exist();
    expect(farce.createQueryMiddleware).to.exist();
    expect(farce.ensureLocation).to.exist();
    expect(farce.ensureLocationMiddleware).to.exist();
    expect(farce.locationReducer).to.exist();
    expect(farce.queryMiddleware).to.exist();
    expect(farce.ServerProtocol).to.exist();
    expect(farce.StateStorage).to.exist();
  });
});
