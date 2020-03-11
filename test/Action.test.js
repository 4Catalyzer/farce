import ActionTypes from '../src/ActionTypes';
import Actions from '../src/Actions';

describe('Actions', () => {
  it('#init should create an INIT action', () => {
    expect(Actions.init()).to.eql({
      type: ActionTypes.INIT,
    });
  });

  it('#push should create a PUSH action with location', () => {
    expect(Actions.push('/foo?bar=baz#qux')).to.eql({
      type: ActionTypes.PUSH,
      payload: '/foo?bar=baz#qux',
    });

    expect(
      Actions.push({
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      }),
    ).to.eql({
      type: ActionTypes.PUSH,
      payload: {
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      },
    });
  });

  it('#replace should create a REPLACE action with location', () => {
    expect(Actions.replace('/foo?bar=baz#qux')).to.eql({
      type: ActionTypes.REPLACE,
      payload: '/foo?bar=baz#qux',
    });

    expect(
      Actions.replace({
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      }),
    ).to.eql({
      type: ActionTypes.REPLACE,
      payload: {
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      },
    });
  });

  it('#go should create a GO action with delta', () => {
    expect(Actions.go(1)).to.eql({
      type: ActionTypes.GO,
      payload: 1,
    });

    expect(Actions.go(-1)).to.eql({
      type: ActionTypes.GO,
      payload: -1,
    });
  });

  it('#dispose should create a DISPOSE action', () => {
    expect(Actions.dispose()).to.eql({
      type: ActionTypes.DISPOSE,
    });
  });
});
