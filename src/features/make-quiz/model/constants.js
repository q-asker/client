export const levelDescriptions = {
  RECALL: {
    title: "순수 암기나 단순 이해를 묻는 문제",
    question: "예) 대한민국의 수도는 _______이다.",
    options: ["서울", "부산", "대구", "광주"],
  },
  SKILLS: {
    title: "옳고 그름을 판별하는 문제",
    question: "예) 지구는 태양 주위를 돈다.",
    options: ["O", "X"],
  },
  STRATEGIC: {
    title: "추론, 문제 해결, 자료 해석을 요구하는 문제",
    question:
      "예) [전제] 물가가 오르면 화폐 가치는 떨어진다. 현재 물가가 급등했다.\n[질문] 이 경우 화폐 가치의 변화로 가장 적절한 것은?",
    options: ["하락한다", "상승한다", "변함없다", "알 수 없다"],
  },
};

export const MAX_FILE_SIZE = 30 * 1024 * 1024;
export const MAX_SELECT_PAGES = 150;
export const SUPPORTED_EXTENSIONS = ["pdf","ppt", "pptx", "doc", "docx"];

export const levelMapping = {
  BLANK: "RECALL",
  OX: "SKILLS",
  MULTIPLE: "STRATEGIC",
};

export const defaultType = "MULTIPLE";

export const pageCountToLoad = 50;
export const loadInterval = 2500;
