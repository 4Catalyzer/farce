import ActionTypes from './ActionTypes';

// This is a private action creator not intended to be called by users.
function locationUpdated(location) {
  return {
    type: ActionTypes.LOCATION_UPDATED,
    payload: location,
  };
}

export default function createHistoryMiddleware(protocol) {
  return function historyMiddleware({ dispatch }) {
    const dispose = protocol.subscribe((location) => {
      // Send this through the full dispatch so other middlewares can enhance
      // the location object.
      dispatch(locationUpdated(location));
    });

    return next => (action) => {
      const { type, payload } = action;

      switch (type) {
        case ActionTypes.INIT:
          return dispatch(locationUpdated(protocol.init()));
        case ActionTypes.TRANSITION:
          return next(locationUpdated(protocol.transition(payload)));
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
}
