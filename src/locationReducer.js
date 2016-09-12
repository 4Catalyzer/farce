import ActionTypes from './ActionTypes';

export default function locationReducer(state = null, action) {
  if (action.type === ActionTypes.LOCATION_UPDATED) {
    return action.payload;
  }

  return state;
}
