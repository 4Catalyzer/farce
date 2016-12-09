import StateStorage from '../src/StateStorage';

describe('StateStorage', () => {
  const farce = {
    createHref: () => 'path?q=1#foo',
  };

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

  it('should retrieve saved value when key is not provided', () => {
    const stateStorage = new StateStorage(farce, 'my-transient-state');

    stateStorage.save(location, null, 1);

    expect(stateStorage.read(location)).to.equal(1);
  });

  it('should retrieve saved value when key is provided', () => {
    const stateStorage = new StateStorage(farce, 'my-transient-state');

    stateStorage.save(location, 'foo', [2, 3]);

    expect(stateStorage.read(location, 'foo')).to.eql([2, 3]);
  });

  it('should retrieve undefined when value is missing', () => {
    const stateStorage = new StateStorage(farce, 'my-transient-state');

    expect(stateStorage.read(location, 'bar')).to.be.undefined();
  });

  it('should work with types', () => {
    const stateStorage = new StateStorage(farce, 'my-transient-state');

    stateStorage.save(location, 'number', 1);
    stateStorage.save(location, 'boolean', true);
    stateStorage.save(location, 'string', 'state');
    stateStorage.save(location, 'array', [2, 3]);
    stateStorage.save(location, 'object', { a: 1 });
    stateStorage.save(location, 'null', null);

    expect(stateStorage.read(location, 'number')).to.eql(1);
    expect(stateStorage.read(location, 'boolean')).to.eql(true);
    expect(stateStorage.read(location, 'string')).to.eql('state');
    expect(stateStorage.read(location, 'array')).to.eql([2, 3]);
    expect(stateStorage.read(location, 'object')).to.eql({ a: 1 });
    expect(stateStorage.read(location, 'null')).to.eql(null);
  });
});
