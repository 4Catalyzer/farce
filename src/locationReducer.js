import ActionTypes from './ActionTypes';

export default function locationReducer(state = null, action) {
  if (action.type === ActionTypes.UPDATE_LOCATION) {
    return action.payload;
  }

  return state;
}
