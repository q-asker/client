import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'i18nexus';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { usePrepareQuizSettingsStore } from '../prepare-quiz/model/usePrepareQuizSettingsStore';
import type { QuestionType } from '../prepare-quiz/model/constants';

/** 백엔드 GET /problem-set/{id}/regeneration-condition 응답 (contract.md §7.1) */
interface RegenerationCondition {
  quizType: 'MULTIPLE' | 'BLANK' | 'REAL_BLANK' | 'OX' | 'ESSAY';
  quizCount: number;
  pageNumbers: number[] | null;
  language: 'KO' | 'EN' | null;
  customInstruction: string | null;
  uploadedUrl: string | null;
  title: string;
  documentAvailable: boolean;
}

function extensionOf(url: string | null): string {
  if (!url) return '';
  const clean = url.split('?')[0];
  const dot = clean.lastIndexOf('.');
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : '';
}

/**
 * 결과·해설 화면의 "이 조건으로 문제 더 만들기"(동일 재현). 서버가 되돌려준 생성 조건이 온전하면
 * (documentAvailable && pageNumbers && language) 옵션 재조립 없이 즉시 같은 조건으로 재생성하고,
 * 하나라도 없으면(legacy 세트·문서 소실 등) 남은 조건을 옵션 화면에 미리 채워 이동하는 단일 폴백을 탄다.
 */
export function useRegenerateQuiz(problemSetId: string | undefined) {
  const { t, currentLanguage } = useTranslation<'make-quiz'>('make-quiz');
  const navigate = useNavigate();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const regenerate = useCallback(async () => {
    if (!problemSetId || isRegenerating) return; // 중복 클릭 방지(FR-006)
    setIsRegenerating(true);

    let condition: RegenerationCondition;
    try {
      const response = await axiosInstance.get<RegenerationCondition>(
        `/problem-set/${problemSetId}/regeneration-condition`,
        { skipErrorToast: true } as Record<string, unknown>,
      );
      condition = response.data;
    } catch {
      CustomToast.error(t('알 수 없는 오류가 발생했습니다.'));
      setIsRegenerating(false); // 조회 실패는 재시도 가능하게 버튼 복구
      return;
    }

    const generation = useQuizGenerationStore.getState();
    const reproducible =
      condition.documentAvailable && !!condition.pageNumbers?.length && !!condition.language;

    if (reproducible) {
      // 즉시 재생성(FR-008): 생성 스토어를 시드하면 make-quiz 페이지가 진행 UI를 그대로 재사용한다.
      generation.setUploadedUrl(condition.uploadedUrl);
      generation.setUploadedFileInfo({
        name: condition.title,
        size: 0,
        extension: extensionOf(condition.uploadedUrl),
      });
      await generation.generateQuestions({
        t,
        currentLanguage,
        uploadedUrl: condition.uploadedUrl,
        fileName: condition.title,
        questionType: condition.quizType,
        questionCount: condition.quizCount,
        selectedPages: condition.pageNumbers ?? [],
        language: condition.language ?? undefined,
        customInstruction: condition.customInstruction ?? undefined,
      });
      navigate('/');
      return;
    }

    // 폴백(FR-005): 남은 조건을 옵션 화면에 미리 채우고 이동. 소실 유형 무관 단일 폴백.
    const settings = usePrepareQuizSettingsStore.getState();
    if (condition.quizType === 'REAL_BLANK') {
      settings.setQuestionType('BLANK');
      settings.setBlankHideSelections(true);
    } else if (condition.quizType) {
      settings.setQuestionType(condition.quizType as QuestionType);
      settings.setBlankHideSelections(false);
    }
    if (condition.quizCount) settings.setQuestionCount(condition.quizCount);
    if (condition.language) settings.setLanguage(condition.language);
    if (condition.documentAvailable && condition.uploadedUrl) {
      generation.setUploadedUrl(condition.uploadedUrl);
      generation.setUploadedFileInfo({
        name: condition.title,
        size: 0,
        extension: extensionOf(condition.uploadedUrl),
      });
    }
    navigate('/');
  }, [problemSetId, isRegenerating, t, currentLanguage, navigate]);

  return { regenerate, isRegenerating };
}
