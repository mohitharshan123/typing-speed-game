export const textReducer = (state, { type, payload }) => {
  let newState = [...state];
  switch (type) {
    case "SET_TEXT":
      newState = payload;
      return newState;
    case "INCORRECT":
      newState[payload].incorrect = true;
      newState[payload].correct = false;
      return newState;
    case "CORRECT":
      newState[payload].incorrect = false;
      newState[payload].correct = true;
      return newState;
    case "ATTEMPTED":
      newState[payload].attempted = true;
      return newState;
    default:
      throw new Error("Unhandled action type");
  }
};
