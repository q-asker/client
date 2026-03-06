import { useCallback, useEffect, useMemo } from 'react';
import { pdfjs } from 'react-pdf';
import { trackMakeQuizEvents as trackPrepareQuizEvents } from '#shared/lib/analytics';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { usePrepareQuizOptions } from './usePrepareQuizOptions';
import { usePrepareQuizPages } from './usePrepareQuizPages';
import { usePrepareQuizUi } from './usePrepareQuizUi';
import { usePrepareQuizUpload } from './usePrepareQuizUpload';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PDF_OPTIONS = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

export const usePrepareQuiz = ({ t, navigate }) => {
  const ui = usePrepareQuizUi();
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

  const generateQuestions = useCallback(() => {
    generationActions.generateQuestions({
      t,
      uploadedUrl: upload.state.uploadedUrl,
      questionType: options.state.questionType,
      questionCount: options.state.questionCount,
      quizLevel: options.state.quizLevel,
      selectedPages: pages.state.selectedPages,
    });
  }, [
    generationActions,
    options.state.questionCount,
    options.state.questionType,
    options.state.quizLevel,
    pages.state.selectedPages,
    t,
    upload.state.uploadedUrl,
  ]);

  const handleNavigateToQuiz = useCallback(() => {
    generationActions.handleNavigateToQuiz({
      navigate,
      uploadedUrl: upload.state.uploadedUrl,
    });
  }, [generationActions, navigate, upload.state.uploadedUrl]);

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
      ui: ui.state,
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
      ui: ui.actions,
      common: {
        handleRemoveFile,
        handleReCreate,
      },
    },
  };
};
