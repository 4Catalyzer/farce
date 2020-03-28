import ActionTypes from './ActionTypes';
import ensureLocation from './ensureLocation';

export default function ensureLocationMiddleware() {
  return (next) => (action) => {
    const { type, payload } = action;

    switch (type) {
      case ActionTypes.PUSH:
        return next({
          type: ActionTypes.NAVIGATE,
          payload: { ...ensureLocation(payload), action: 'PUSH' },
        });
      case ActionTypes.REPLACE:
        return next({
          type: ActionTypes.NAVIGATE,
          payload: { ...ensureLocation(payload), action: 'REPLACE' },
        });
      case ActionTypes.CREATE_HREF:
      case ActionTypes.CREATE_LOCATION:
        return next({
          type,
          payload: ensureLocation(payload),
        });
      default:
        return next(action);
    }
  };
}
