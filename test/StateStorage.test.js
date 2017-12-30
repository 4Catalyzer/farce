import StateStorage from '../src/StateStorage';

describe('StateStorage', () => {
  let stateStorage;

  const location = {
    key: 'location:0',
  };

  beforeEach(() => {
    window.sessionStorage.clear();

    stateStorage = new StateStorage(
      { createHref: () => '/path?search' },
      'test',
    );
  });

  it('should read saved value for default key', () => {
    stateStorage.save(location, null, 1);

    expect(stateStorage.read(location, null)).to.equal(1);
    expect(stateStorage.read(location, 'foo')).to.be.undefined();
  });

  it('should read saved value for explicit key', () => {
    stateStorage.save(location, 'foo', [2, 3]);

    expect(stateStorage.read(location, 'foo')).to.eql([2, 3]);
    expect(stateStorage.read(location, null)).to.be.undefined();
  });

  it('should read undefined when value is missing', () => {
    expect(stateStorage.read(location, null)).to.be.undefined();
    expect(stateStorage.read(location, 'foo')).to.be.undefined();
  });

  it('should work with arbitrary types', () => {
    stateStorage.save(location, 'number', 1);
    stateStorage.save(location, 'boolean', true);
    stateStorage.save(location, 'string', 'state');
    stateStorage.save(location, 'array', [2, 3]);
    stateStorage.save(location, 'object', { a: 1 });
    stateStorage.save(location, 'null', null);

    expect(stateStorage.read(location, 'number')).to.equal(1);
    expect(stateStorage.read(location, 'boolean')).to.equal(true);
    expect(stateStorage.read(location, 'string')).to.equal('state');
    expect(stateStorage.read(location, 'array')).to.eql([2, 3]);
    expect(stateStorage.read(location, 'object')).to.eql({ a: 1 });
    expect(stateStorage.read(location, 'null')).to.be.null();
  });

  it('should support deleting values', () => {
    stateStorage.save(location, null, 1);
    expect(stateStorage.read(location, null)).to.equal(1);

    stateStorage.save(location, null, undefined);
    expect(stateStorage.read(location, null)).to.be.undefined();
  });

  it('should read undefined for invalid JSON', () => {
    window.sessionStorage.setItem('test|location:0', '[}');

    expect(stateStorage.read(location, null)).to.be.undefined();
  });

  it('should support fallback key', () => {
    stateStorage.save({}, null, 1);

    expect(stateStorage.read({}, null)).to.equal(1);
  });
});
