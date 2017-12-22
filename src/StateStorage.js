export default class StateStorage {
  constructor(farce, namespace) {
    this._getFallbackLocationKey = farce.createHref;
    this._stateKeyPrefix = `${namespace}|`;
  }

  read(location, key) {
    const stateKey = this._getStateKey(location, key);

    try {
      const value = window.sessionStorage.getItem(stateKey);
      // === null is probably sufficient.
      if (value == null) {
        return undefined;
      }

      // We want to catch JSON parse errors in case someone separately threw
      // junk into sessionStorage under our namespace.
      return JSON.parse(value);
    } catch (e) {
      // Pretend that the entry doesn't exist.
      return undefined;
    }
  }

  save(location, key, value) {
    const stateKey = this._getStateKey(location, key);

    if (value === undefined) {
      try {
        window.sessionStorage.removeItem(stateKey);
      } catch (e) {
        // No need to handle errors here.
      }

      return;
    }

    // Unlike with read, we want to fail on invalid values here, since the
    // value here is provided by the caller of this method.
    const valueString = JSON.stringify(value);

    try {
      window.sessionStorage.setItem(stateKey, valueString);
    } catch (e) {
      // No need to handle errors here either. If it didn't work, it didn't
      // work. We make no guarantees about actually saving the value.
    }
  }

  _getStateKey(location, key) {
    const locationKey = location.key || this._getFallbackLocationKey(location);
    const stateKeyBase = `${this._stateKeyPrefix}${locationKey}`;
    return key == null ? stateKeyBase : `${stateKeyBase}|${key}`;
  }
}
