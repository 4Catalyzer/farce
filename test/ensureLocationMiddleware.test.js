import ActionTypes from '../src/ActionTypes';
import ensureLocationMiddleware from '../src/ensureLocationMiddleware';

describe('ensureLocationMiddleware', () => {
  let next;
  let dispatch;
  beforeEach(() => {
    next = sinon.spy();
    dispatch = ensureLocationMiddleware()(next);
  });

  it('should ensure location of PUSH action', () => {
    dispatch({
      type: ActionTypes.PUSH,
      payload: '/foo?bar=baz#qux',
    });

    expect(next).to.be.calledWith({
      type: ActionTypes.NAVIGATE,
      payload: {
        action: 'PUSH',
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      },
    });
  });

  it('should ensure location of REPLACE action', () => {
    dispatch({
      type: ActionTypes.REPLACE,
      payload: '/foo?bar=baz#qux',
    });

    expect(next).to.be.calledWith({
      type: ActionTypes.NAVIGATE,
      payload: {
        action: 'REPLACE',
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      },
    });
  });

  it('should ensure location of CREATE_HREF action', () => {
    dispatch({
      type: ActionTypes.CREATE_HREF,
      payload: '/foo?bar=baz#qux',
    });

    expect(next).to.be.calledWith({
      type: ActionTypes.CREATE_HREF,
      payload: {
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      },
    });
  });

  it('should ensure location of CREATE_LOCATION action', () => {
    dispatch({
      type: ActionTypes.CREATE_LOCATION,
      payload: '/foo?bar=baz#qux',
    });

    expect(next).to.be.calledWith({
      type: ActionTypes.CREATE_LOCATION,
      payload: {
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      },
    });
  });

  it('should not affect other action', () => {
    const UNKNOWN = 'UNKNOWN';
    dispatch({
      type: UNKNOWN,
      payload: '/foo?bar=baz#qux',
    });

    expect(next).to.be.calledWith({
      type: UNKNOWN,
      payload: '/foo?bar=baz#qux',
    });
  });
});
