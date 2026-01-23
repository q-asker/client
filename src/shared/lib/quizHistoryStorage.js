const STORAGE_KEY = "quizHistory";

export const readQuizHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (error) {
    return [];
  }
};

export const writeQuizHistory = (history) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
};

export const getLatestQuizRecord = () => readQuizHistory()[0] || null;

export const upsertQuizHistoryRecord = (record, { max = 20 } = {}) => {
  const history = readQuizHistory();
  const existingIndex = history.findIndex(
    (item) => item.problemSetId === record.problemSetId
  );
  if (existingIndex === -1) {
    history.unshift(record);
  }

  if (history.length > max) {
    history.splice(max);
  }

  return writeQuizHistory(history);
};

export const updateQuizHistoryRecord = (problemSetId, updates) => {
  const history = readQuizHistory();
  const index = history.findIndex((item) => item.problemSetId === problemSetId);
  if (index === -1) {
    return history;
  }

  history[index] = {
    ...history[index],
    ...updates,
  };

  return writeQuizHistory(history);
};

export const removeQuizHistoryRecord = (problemSetId) => {
  const history = readQuizHistory();
  const nextHistory = history.filter(
    (item) => item.problemSetId !== problemSetId
  );
  return writeQuizHistory(nextHistory);
};

export const clearQuizHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
  return [];
};
