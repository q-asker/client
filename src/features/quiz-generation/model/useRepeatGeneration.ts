import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import { authService } from '#entities/auth';
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

/** idle: 대기 / loading: 조건 조회 중 / generating: 새 세트 생성 SSE 진행 중 */
export type RepeatPhase = 'idle' | 'loading' | 'generating';

/** QuizGenerationCard와 동일 키 — 폴백 시 지시문을 "최근 프롬프트"로 복원 가능하게 둔다 */
const RECENT_PROMPT_KEY = 'recentMakeQuizPrompt';

/**
 * US2 폴백: 남은 조건을 옵션 화면(make-quiz) store에 프리필한다.
 * make-quiz는 store hydration으로 이 값을 자동 반영하므로 페이지를 건드리지 않는다.
 * REAL_BLANK는 옵션 UI 축(BLANK + 선택지 숨김)으로 역매핑한다.
 */
const prefillOptionScreen = (cond: RegenerationCondition): void => {
  const gen = useQuizGenerationStore.getState();
  gen.setUploadedUrl(cond.uploadedUrl);
  gen.setUploadedFileInfo({ name: cond.title, size: 0, extension: 'pdf' });

  const settings = usePrepareQuizSettingsStore.getState();
  if (cond.quizType === 'REAL_BLANK') {
    settings.setQuestionType('BLANK');
    settings.setBlankHideSelections(true);
  } else {
    settings.setQuestionType(cond.quizType);
    settings.setBlankHideSelections(false);
  }
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
 * 정상(조건·자료 온전)이면 기존 생성 파이프라인(POST /generation + SSE)을 재사용해 즉시 생성하고,
 * 조건이 소실(legacy null)됐거나 생성이 실패하면 막다른 실패 없이 옵션 화면 폴백으로 안내한다.
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

      // 정상: 확인 단계 없이 즉시 재생성 (기존 생성 파이프라인 재사용)
      setPhase('generating');
      try {
        await authService.refresh();
      } catch {
        // 리프레시 실패 무시 (게스트 포함)
      }

      useQuizGenerationStore.getState().startGeneration({
        requestData: {
          uploadedUrl: cond.uploadedUrl,
          title: cond.title,
          quizCount: cond.quizCount,
          quizType: cond.quizType,
          pageNumbers: cond.pageNumbers as number[],
          language: cond.language as string,
          ...(cond.customInstruction?.trim()
            ? { customInstruction: cond.customInstruction.trim() }
            : {}),
        },
        onSuccess: () => {
          const newId = useQuizGenerationStore.getState().problemSetId;
          if (newId) {
            // 반복성(FR-003)을 라우터 언마운트 타이밍에 의존시키지 않도록 phase를 명시 복귀시킨다.
            setPhase('idle');
            navigate(`/quiz/${newId}`);
          } else {
            setPhase('idle');
            CustomToast.error(t('문제 생성에 실패했어요. 다시 시도해주세요.'));
          }
        },
        onError: () => {
          // 자료 만료 등 생성 실패 → 막다른 실패 없이 옵션 화면 폴백 (FR-007)
          setPhase('idle');
          prefillOptionScreen(cond);
          CustomToast.error(
            t('생성에 실패했어요. 자료가 만료되었을 수 있어요. 옵션 화면에서 다시 시도해주세요.'),
          );
          navigate('/');
        },
      });
    },
    [navigate, phase],
  );

  return { startRepeat, phase };
};
