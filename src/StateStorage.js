export default class StateStorage {
  constructor(farce, namespace) {
    this.getFallbackLocationKey = farce.createHref;
    this.stateKeyPrefix = `${namespace}|`;
  }

  read(location, key) {
    const stateKey = this.getStateKey(location, key);

    try {
      const value = window.sessionStorage.getItem(stateKey);
      if (value == null) { // === null is probably sufficient.
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
    const stateKey = this.getStateKey(location, key);

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

  getStateKey(location, key) {
    const locationKey = location.key || this.getFallbackLocationKey(location);
    const stateKeyBase = `${this.stateKeyPrefix}${locationKey}`;
    return key == null ? stateKeyBase : `${stateKeyBase}|${key}`;
  }
}
