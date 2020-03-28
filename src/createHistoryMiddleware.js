import ActionTypes from './ActionTypes';

function updateLocation(location) {
  return {
    type: ActionTypes.UPDATE_LOCATION,
    payload: location,
  };
}

export default function createHistoryMiddleware(protocol) {
  return function historyMiddleware() {
    return (next) => {
      const dispose = protocol.subscribe((location) => {
        next(updateLocation(location));
      });

      return (action) => {
        const { type, payload } = action;

        switch (type) {
          case ActionTypes.INIT:
            return next(updateLocation(protocol.init()));
          case ActionTypes.NAVIGATE:
            return next(updateLocation(protocol.navigate(payload)));
          case ActionTypes.GO:
            protocol.go(payload);
            return null;
          case ActionTypes.CREATE_HREF:
            return protocol.createHref(payload);
          case ActionTypes.CREATE_LOCATION:
            return payload;
          case ActionTypes.DISPOSE:
            dispose();
            return null;
          default:
            return next(action);
        }
      };
    };
  };
}
