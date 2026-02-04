import { useCallback, useEffect, useMemo, useState } from 'react';
import { pdfjs } from 'react-pdf';
import { trackMakeQuizEvents } from '#shared/lib/analytics';
import { useMakeQuizGeneration } from './useMakeQuizGeneration';
import { useMakeQuizOptions } from './useMakeQuizOptions';
import { useMakeQuizPages } from './useMakeQuizPages';
import { useMakeQuizUi } from './useMakeQuizUi';
import { useMakeQuizUpload } from './useMakeQuizUpload';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export const useMakeQuiz = ({ t, navigate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const ui = useMakeQuizUi();
  const upload = useMakeQuizUpload({ t, setIsProcessing });
  const options = useMakeQuizOptions();
  const pages = useMakeQuizPages({
    t,
    uploadedUrl: upload.state.uploadedUrl,
  });
  const generation = useMakeQuizGeneration({
    t,
    navigate,
    isProcessing,
    setIsProcessing,
    uploadedUrl: upload.state.uploadedUrl,
    questionType: options.state.questionType,
    questionCount: options.state.questionCount,
    quizLevel: options.state.quizLevel,
    selectedPages: pages.state.selectedPages,
  });

  const pdfOptions = useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    }),
    [],
  );

  useEffect(() => {
    trackMakeQuizEvents.viewMakeQuiz();
  }, []);
  const resetAllStates = useCallback(() => {
    upload.actions.resetUploadState();
    options.actions.resetOptions();
    pages.actions.resetPagesState();
    generation.actions.resetGenerationState();
    setIsProcessing(false);
  }, [generation.actions, options.actions, pages.actions, upload.actions]);

  const handleRemoveFile = useCallback(() => {
    if (upload.state.file) {
      trackMakeQuizEvents.deleteFile(upload.state.file.name);
    }
    resetAllStates();
  }, [resetAllStates, upload.state.file]);

  const handleReCreate = useCallback(() => {
    generation.actions.resetGenerationForRecreate();
    pages.actions.resetPagesForRecreate();
    setIsProcessing(false);
  }, [generation.actions, pages.actions]);

  return {
    state: {
      upload: upload.state,
      options: options.state,
      pages: pages.state,
      generation: generation.state,
      ui: ui.state,
      isProcessing,
      pdfOptions,
    },
    actions: {
      upload: upload.actions,
      options: options.actions,
      pages: pages.actions,
      generation: generation.actions,
      ui: ui.actions,
      common: {
        handleRemoveFile,
        handleReCreate,
      },
    },
  };
};
