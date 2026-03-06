export const isUnanswered = (answer, selections) => {
  if (answer === undefined || answer === null || answer === '') {
    return true;
  }

  if (!Array.isArray(selections) || selections.length === 0) {
    return false;
  }

  return !selections.some((selection) => String(selection.id) === String(answer));
};
