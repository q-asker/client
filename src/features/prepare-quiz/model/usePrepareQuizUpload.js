import { useCallback, useEffect, useRef, useState } from 'react';
import CustomToast from '#shared/toast';
import { trackMakeQuizEvents as trackPrepareQuizEvents } from '#shared/lib/analytics';
import Timer from '#shared/lib/timer';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { uploadFileToServer } from '../file-uploader';
import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS } from './constants';

export const usePrepareQuizUpload = ({ t }) => {
  const setIsWaitingForFirstQuiz = (isWaitingForFirstQuiz) => {
    useQuizGenerationStore.setState({ isWaitingForFirstQuiz });
  };
  const storeUploadedUrl = useQuizGenerationStore((state) => state.uploadedUrl);
  const storeFileInfo = useQuizGenerationStore((state) => state.fileInfo);
  const setUploadedUrlInStore = useQuizGenerationStore((state) => state.setUploadedUrl);
  const setUploadedFileInfo = useQuizGenerationStore((state) => state.setUploadedFileInfo);
  const [file, setFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadElapsedTime, setUploadElapsedTime] = useState(0);
  const [fileExtension, setFileExtension] = useState(null);
  const uploadTimerRef = useRef(null);

  useEffect(() => {
    if (!uploadedUrl && storeUploadedUrl) {
      setUploadedUrl(storeUploadedUrl);
    }
    if (!file && storeFileInfo) {
      setFile({ name: storeFileInfo.name, size: storeFileInfo.size });
    }
    if (!fileExtension && storeFileInfo?.extension) {
      setFileExtension(storeFileInfo.extension);
    }
  }, [file, fileExtension, storeFileInfo, storeUploadedUrl, uploadedUrl]);

  const selectFile = useCallback(
    async (nextFile, method = 'click') => {
      const ext = nextFile.name.split('.').pop().toLowerCase();

      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        CustomToast.error(t('지원하지 않는 파일 형식입니다'));
        return;
      }

      if (nextFile.size > MAX_FILE_SIZE) {
        CustomToast.error(`파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과할 수 없습니다.`);
        return;
      }

      if (method === 'drag_drop') {
        trackPrepareQuizEvents.dragDropFileUpload(nextFile.name, nextFile.size, ext);
      } else {
        trackPrepareQuizEvents.startFileUpload(nextFile.name, nextFile.size, ext);
      }

      uploadTimerRef.current = new Timer((elapsed) => {
        setUploadElapsedTime(elapsed);
      });
      uploadTimerRef.current.start();

      setFileExtension(ext);
      setUploadedFileInfo({
        name: nextFile.name,
        size: nextFile.size,
        extension: ext,
      });
      setIsWaitingForFirstQuiz(true);
      try {
        const uploaded = await uploadFileToServer(nextFile);
        setUploadedUrl(uploaded);
        setFile(nextFile);
        setUploadedUrlInStore(uploaded);

        const uploadTime = uploadTimerRef.current.stop();
        trackPrepareQuizEvents.completeFileUpload(nextFile.name, uploadTime);
      } catch (error) {
        if (uploadTimerRef.current) {
          uploadTimerRef.current.stop();
        }

        const message =
          error?.message === t('변환 시간 초과')
            ? t('파일 변환이 지연되고 있어요. 잠시 후 다시 시도해주세요.')
            : error?.response?.data?.message ||
              error?.message ||
              t('파일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');

        CustomToast.error(message);
        console.error(t('파일 업로드 실패:'), error);
        setUploadedUrlInStore(null);
        setUploadedFileInfo(null);
        return;
      } finally {
        setFileExtension(null);
        setIsWaitingForFirstQuiz(false);
        setUploadElapsedTime(0);
      }
    },
    [setIsWaitingForFirstQuiz, setUploadedFileInfo, setUploadedUrlInStore, t],
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, [setUploadedFileInfo, setUploadedUrlInStore]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        selectFile(e.dataTransfer.files[0], 'drag_drop');
      }
    },
    [selectFile],
  );

  const handleFileInput = useCallback(
    (e) => {
      if (e.target.files.length > 0) {
        selectFile(e.target.files[0], 'click');
      }
    },
    [selectFile],
  );

  const resetUploadState = useCallback(() => {
    if (uploadTimerRef.current) {
      uploadTimerRef.current.reset();
      uploadTimerRef.current = null;
    }

    setFile(null);
    setUploadedUrl(null);
    setIsDragging(false);
    setUploadElapsedTime(0);
    setFileExtension(null);
    setUploadedUrlInStore(null);
    setUploadedFileInfo(null);
  }, []);

  return {
    state: {
      file,
      uploadedUrl,
      isDragging,
      uploadElapsedTime,
      fileExtension,
    },
    actions: {
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
      handleFileInput,
      resetUploadState,
    },
  };
};
