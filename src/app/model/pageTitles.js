const pathMap = {
  "/": "퀴즈 생성",
  "/login": "로그인",
  "/login/redirect": "로그인 리다이렉트",
  "/quiz": "퀴즈 풀기",
  "/result": "퀴즈 결과",
  "/explanation": "퀴즈 해설",
  "/history": "퀴즈 기록",
};

export const getPageTitle = (pathname) => {
  for (const [key, title] of Object.entries(pathMap)) {
    if (pathname.startsWith(key)) {
      return title;
    }
  }

  return "알 수 없는 페이지";
};
