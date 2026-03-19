export interface ThemePreset {
  id: string;
  name: string;
  // 프리뷰용 대표 색상 (OKLch 문자열)
  colors: {
    primary: string;
    background: string;
    accent: string;
  };
  // :root CSS 변수 맵
  lightVars: Record<string, string>;
  // .dark CSS 변수 맵
  darkVars: Record<string, string>;
}
