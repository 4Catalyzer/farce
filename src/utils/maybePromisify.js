export default function maybePromisify(hook, syncLength) {
  if (hook.length <= syncLength) {
    return hook;
  }

  return (...args) => {
    let hasSyncResult = false;
    let syncResult;

    let resolvePromise;

    hook(...args, (result) => {
      if (resolvePromise) {
        resolvePromise(result);
        return;
      }

      hasSyncResult = true;
      syncResult = result;
    });

    if (!hasSyncResult) {
      return new Promise((resolve) => {
        resolvePromise = resolve;
      });
    }

    return syncResult;
  };
}
