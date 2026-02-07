const pathMap = {
  '/login': '로그인',
  '/login/redirect': '로그인 리다이렉트',
  '/quiz': '퀴즈 풀기',
  '/result': '퀴즈 결과',
  '/explanation': '퀴즈 해설',
  '/history': '퀴즈 기록',
  '/privacy-policy': '개인정보 처리방침',
  '/': '퀴즈 생성',
};

export const getPageTitle = (pathname) => {
  if (pathMap[pathname]) {
    return pathMap[pathname];
  }

  const sortedEntries = Object.entries(pathMap).sort((a, b) => b[0].length - a[0].length);
  for (const [key, title] of sortedEntries) {
    if (pathname.startsWith(key)) {
      return title;
    }
  }

  return '알 수 없는 페이지';
};
