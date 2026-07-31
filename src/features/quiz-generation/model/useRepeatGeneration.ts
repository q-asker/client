import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import { usePrepareQuizSettingsStore } from '#features/prepare-quiz';
import { trackResultEvents } from '#shared/lib/analytics';
import { useQuizGenerationStore } from './useQuizGenerationStore';
import type { QuizType } from './useQuizGenerationStore';

/** 이어풀기 시점에 서버에서 되짚는 생성 조건 (GET /problem-set/{id}/regeneration-condition) */
export interface RegenerationCondition {
  quizType: QuizType;
  quizCount: number;
  /** legacy 세트는 null → 폴백 트리거 */
  pageNumbers: number[] | null;
  /** legacy 세트는 null → 폴백 트리거 */
  language: 'KO' | 'EN' | null;
  customInstruction: string | null;
  uploadedUrl: string;
  title: string;
  /** 현 스코프 항상 true (자료 능동 만료검사 미도입) */
  documentAvailable: boolean;
}

/** idle: 대기 / loading: 조건 조회 중 (생성 진행 표시는 make-quiz "생성 중" 화면이 담당) */
export type RepeatPhase = 'idle' | 'loading';

/** QuizGenerationCard와 동일 키 — 폴백 시 지시문을 "최근 프롬프트"로 복원 가능하게 둔다 */
const RECENT_PROMPT_KEY = 'recentMakeQuizPrompt';

/**
 * US2 폴백: 남은 조건을 옵션 화면(make-quiz) store에 프리필한다.
 * make-quiz는 store hydration으로 이 값을 자동 반영하므로 페이지를 건드리지 않는다.
 * REAL_BLANK는 독립 유형이므로 그대로 설정한다.
 */
const prefillOptionScreen = (cond: RegenerationCondition): void => {
  const gen = useQuizGenerationStore.getState();
  gen.setUploadedUrl(cond.uploadedUrl);
  gen.setUploadedFileInfo({ name: cond.title, size: 0, extension: 'pdf' });

  const settings = usePrepareQuizSettingsStore.getState();
  settings.setQuestionType(cond.quizType);
  settings.setQuestionCount(cond.quizCount);
  if (cond.language) settings.setLanguage(cond.language);
  if (cond.customInstruction) {
    try {
      localStorage.setItem(RECENT_PROMPT_KEY, cond.customInstruction);
    } catch {
      // localStorage 접근 불가 무시
    }
  }
};

/**
 * "이 조건으로 더 풀기" — 방금 푼 세트의 생성 조건을 되짚어 같은 조건으로 새 세트를 이어 만든다.
 * 정상(조건·자료 온전)이면 **최초 생성과 동일한 진입점(generateQuestions)** 으로 태워 make-quiz의
 * 기존 "문제 생성 중" 화면이 그대로 뜨게 하고, 완료되면 새 세트 풀이로 자동 진입한다.
 * 조건이 소실(legacy null)됐거나 생성이 실패하면 막다른 실패 없이 옵션 화면(프리필된 make-quiz)으로 남는다.
 */
export const useRepeatGeneration = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<RepeatPhase>('idle');

  const startRepeat = useCallback(
    async (problemSetId: string, t: (key: string) => string) => {
      if (phase !== 'idle') return;
      setPhase('loading');

      let cond: RegenerationCondition;
      try {
        const res = await axiosInstance.get<RegenerationCondition>(
          `/problem-set/${problemSetId}/regeneration-condition`,
        );
        cond = res.data;
      } catch {
        setPhase('idle');
        CustomToast.error(t('생성 조건을 불러오지 못했어요. 옵션 화면에서 새로 만들어주세요.'));
        navigate('/');
        return;
      }

      trackResultEvents.clickRepeat(problemSetId);

      const canInstant = cond.documentAvailable && !!cond.pageNumbers?.length && !!cond.language;

      // US2 폴백: 조건 불충분 → 남은 값 프리필 후 옵션 화면으로 (막다른 실패 없음)
      if (!canInstant) {
        prefillOptionScreen(cond);
        setPhase('idle');
        CustomToast.info(t('이어서 풀려면 남은 설정을 확인하고 문제를 생성해주세요.'));
        navigate('/');
        return;
      }

      // 정상: 최초 생성 경로(generateQuestions)로 태운다.
      // - make-quiz 상태를 프리필해 파일·옵션이 채워진 채로 뜨게 하고(생성 실패 시 곧바로 재시도 가능한
      //   폴백을 겸함), generateQuestions가 세팅하는 isWaitingForFirstQuiz로 make-quiz "생성 중" 화면이
      //   자연히 노출된다. 완료 시 onSuccess가 새 세트 풀이로 자동 진입한다(옵션 재입력 없는 즉시 생성).
      prefillOptionScreen(cond);
      useQuizGenerationStore.getState().generateQuestions({
        t,
        currentLanguage: cond.language === 'EN' ? 'en' : 'ko',
        uploadedUrl: cond.uploadedUrl,
        fileName: cond.title,
        questionType: cond.quizType,
        questionCount: cond.quizCount,
        selectedPages: cond.pageNumbers as number[],
        language: cond.language as 'KO' | 'EN',
        ...(cond.customInstruction?.trim()
          ? { customInstruction: cond.customInstruction.trim() }
          : {}),
        onSuccess: () => {
          const newId = useQuizGenerationStore.getState().problemSetId;
          if (newId) navigate(`/quiz/${newId}`);
        },
      });
      setPhase('idle');
      navigate('/');
    },
    [navigate, phase],
  );

  return { startRepeat, phase };
};
