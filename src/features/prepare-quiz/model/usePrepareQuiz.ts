import { useCallback, useEffect, useMemo } from 'react';
import { pdfjs } from 'react-pdf';
import { trackMakeQuizEvents as trackPrepareQuizEvents } from '#shared/lib/analytics';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { usePrepareQuizOptions } from './usePrepareQuizOptions';
import { usePrepareQuizPages } from './usePrepareQuizPages';
import { usePrepareQuizUpload } from './usePrepareQuizUpload';
import type { PrepareQuizOptionsState, PrepareQuizOptionsActions } from './usePrepareQuizOptions';
import type { PrepareQuizPagesState, PrepareQuizPagesActions } from './usePrepareQuizPages';
import type { PrepareQuizUploadState, PrepareQuizUploadActions } from './usePrepareQuizUpload';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PDF_OPTIONS = {
  cMapUrl: '/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/standard_fonts/',
};

/** 퀴즈 생성 상태 */
interface GenerationState {
  problemSetId: string | null;
  showWaitMessage: boolean;
  generationElapsedTime: number;
  isWaitingForFirstQuiz: boolean;
}

/** 퀴즈 생성 액션 */
interface GenerationActions {
  generateQuestions: (customInstruction?: string) => void;
  handleNavigateToQuiz: () => void;
  resetGenerationState: () => void;
  resetGenerationForRecreate: () => void;
}

/** usePrepareQuiz 반환 타입 */
export interface PrepareQuizReturn {
  state: {
    upload: PrepareQuizUploadState;
    options: PrepareQuizOptionsState;
    pages: PrepareQuizPagesState;
    generation: GenerationState;
    isWaitingForFirstQuiz: boolean;
    pdfOptions: typeof PDF_OPTIONS;
  };
  actions: {
    upload: PrepareQuizUploadActions;
    options: PrepareQuizOptionsActions;
    pages: PrepareQuizPagesActions;
    generation: GenerationActions;
    common: {
      handleRemoveFile: () => void;
      handleReCreate: () => void;
    };
  };
}

interface UsePrepareQuizParams {
  t: (key: string) => string;
  currentLanguage: string;
  navigate: (to: string, options?: { state?: Record<string, unknown> }) => void;
}

export const usePrepareQuiz = ({
  t,
  currentLanguage,
  navigate,
}: UsePrepareQuizParams): PrepareQuizReturn => {
  const upload = usePrepareQuizUpload({ t });
  const options = usePrepareQuizOptions();
  const pages = usePrepareQuizPages({
    t,
    uploadedUrl: upload.state.uploadedUrl,
  });
  const problemSetId = useQuizGenerationStore((state) => state.problemSetId);
  const showWaitMessage = useQuizGenerationStore((state) => state.showWaitMessage);
  const generationElapsedTime = useQuizGenerationStore((state) => state.generationElapsedTime);
  const isWaitingForFirstQuiz = useQuizGenerationStore((state) => state.isWaitingForFirstQuiz);
  const generateQuestionsAction = useQuizGenerationStore((state) => state.generateQuestions);
  const handleNavigateToQuizAction = useQuizGenerationStore((state) => state.handleNavigateToQuiz);
  const resetGenerationStateAction = useQuizGenerationStore((state) => state.resetGenerationState);
  const resetGenerationForRecreateAction = useQuizGenerationStore(
    (state) => state.resetGenerationForRecreate,
  );
  const generationState = useMemo(
    () => ({
      problemSetId,
      showWaitMessage,
      generationElapsedTime,
      isWaitingForFirstQuiz,
    }),
    [problemSetId, showWaitMessage, generationElapsedTime, isWaitingForFirstQuiz],
  );
  const generationActions = useMemo(
    () => ({
      generateQuestions: generateQuestionsAction,
      handleNavigateToQuiz: handleNavigateToQuizAction,
      resetGenerationState: resetGenerationStateAction,
      resetGenerationForRecreate: resetGenerationForRecreateAction,
    }),
    [
      generateQuestionsAction,
      handleNavigateToQuizAction,
      resetGenerationStateAction,
      resetGenerationForRecreateAction,
    ],
  );

  const generateQuestions = useCallback(
    (customInstruction?: string) => {
      generationActions.generateQuestions({
        t,
        currentLanguage,
        uploadedUrl: upload.state.uploadedUrl,
        fileName: upload.state.file?.name ?? '',
        questionType: options.state.questionType,
        questionCount: options.state.questionCount,
        quizLevel: options.state.quizLevel,
        selectedPages: pages.state.selectedPages,
        customInstruction,
      });
    },
    [
      generationActions,
      currentLanguage,
      options.state.questionCount,
      options.state.questionType,
      options.state.quizLevel,
      pages.state.selectedPages,
      t,
      upload.state.uploadedUrl,
      upload.state.file?.name,
    ],
  );

  const handleNavigateToQuiz = useCallback(() => {
    generationActions.handleNavigateToQuiz({ navigate });
  }, [generationActions, navigate]);

  const pdfOptions = PDF_OPTIONS;

  useEffect(() => {
    trackPrepareQuizEvents.viewMakeQuiz();
  }, []);
  const resetAllStates = useCallback(() => {
    upload.actions.resetUploadState();
    options.actions.resetOptions();
    pages.actions.resetPagesState();
    generationActions.resetGenerationState();
  }, [generationActions, options.actions, pages.actions, upload.actions]);

  const handleRemoveFile = useCallback(() => {
    if (upload.state.file) {
      trackPrepareQuizEvents.deleteFile(upload.state.file.name);
    }
    resetAllStates();
  }, [resetAllStates, upload.state.file]);

  const handleReCreate = useCallback(() => {
    generationActions.resetGenerationForRecreate();
    pages.actions.resetPagesForRecreate();
  }, [generationActions, pages.actions]);

  return {
    state: {
      upload: upload.state,
      options: options.state,
      pages: pages.state,
      generation: generationState,
      isWaitingForFirstQuiz: generationState.isWaitingForFirstQuiz,
      pdfOptions,
    },
    actions: {
      upload: upload.actions,
      options: options.actions,
      pages: pages.actions,
      generation: {
        generateQuestions,
        handleNavigateToQuiz,
        resetGenerationState: generationActions.resetGenerationState,
        resetGenerationForRecreate: generationActions.resetGenerationForRecreate,
      },
      common: {
        handleRemoveFile,
        handleReCreate,
      },
    },
  };
};
