/** 난이도별 설명에 사용되는 레벨 설명 구조 */
export interface LevelDescription {
  title: string;
  question: string;
  options: string[];
}

/** 퀴즈 유형 키 */
export type QuestionType = 'BLANK' | 'OX' | 'MULTIPLE';

/** 퀴즈 난이도 키 */
export type QuizLevel = 'RECALL' | 'SKILLS' | 'STRATEGIC';

/** 번역 함수 타입 */
type TranslationFn = (value: string) => string;

export const getLevelDescriptions = (
  t: TranslationFn = (value) => value,
): Record<QuizLevel, LevelDescription> => ({
  RECALL: {
    title: t('순수 암기나 단순 이해를 묻는 문제'),
    question: t('예) 대한민국의 수도는 _______이다.'),
    options: [t('서울'), t('부산'), t('대구'), t('광주')],
  },
  SKILLS: {
    title: t('옳고 그름을 판별하는 문제'),
    question: t('예) 지구는 태양 주위를 돈다.'),
    options: ['O', 'X'],
  },
  STRATEGIC: {
    title: t('추론, 문제 해결, 자료 해석을 요구하는 문제'),
    question: t(
      '예) 다음 표를 보고 물음에 답하시오.\n\n| 연도 | 수출액 | 수입액 |\n|------|--------|--------|\n| 2023 | 120억 | 80억 |\n| 2024 | 90억 | 110억 |\n\n무역수지가 적자로 전환된 연도는?',
    ),
    options: [t('2023년'), t('2024년'), t('알 수 없다'), t('해당 없음')],
  },
});

export const MAX_FILE_SIZE: number = 30 * 1024 * 1024;
export const MAX_SELECT_PAGES: number = 150;
export const SUPPORTED_EXTENSIONS: string[] = ['pdf', 'ppt', 'pptx', 'doc', 'docx'];

/** iOS Safari는 accept에 MIME 타입이 없으면 change 이벤트를 발화하지 않는 버그가 있다 */
export const SUPPORTED_MIME_TYPES: string[] = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/** <input accept="...">에 사용할 값 (확장자 + MIME 타입, 공백 없이) */
export const ACCEPT_FILE_TYPES: string = [
  ...SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`),
  ...SUPPORTED_MIME_TYPES,
].join(',');

/** 퀴즈 유형 → 난이도 매핑 */
export const levelMapping: Record<QuestionType, QuizLevel> = {
  BLANK: 'RECALL',
  OX: 'SKILLS',
  MULTIPLE: 'STRATEGIC',
};

export const defaultType: QuestionType = 'MULTIPLE';

export const pageCountToLoad: number = 50;
export const loadInterval: number = 2500;
