import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CustomToast from '#shared/toast';
import { trackMakeQuizEvents as trackPrepareQuizEvents } from '#shared/lib/analytics';
import Timer from '#shared/lib/timer';
import { useQuizGenerationStore } from '#features/quiz-generation';
import type { FileInfo } from '#features/quiz-generation';
import { uploadFileToServer } from '../file-uploader';
import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS } from './constants';

/** 업로드할 파일의 최소 정보 */
interface UploadedFileInfo {
  name: string;
  size: number;
}

export interface PrepareQuizUploadState {
  file: UploadedFileInfo | null;
  uploadedUrl: string | null;
  isDragging: boolean;
  uploadElapsedTime: number;
  fileExtension: string | null;
}

export interface PrepareQuizUploadActions {
  handleDragOver: (e: React.DragEvent<HTMLElement>) => void;
  handleDragEnter: (e: React.DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLElement>) => void;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetUploadState: () => void;
}

export interface PrepareQuizUploadReturn {
  state: PrepareQuizUploadState;
  actions: PrepareQuizUploadActions;
}

interface UsePrepareQuizUploadParams {
  t: (key: string) => string;
}

export const usePrepareQuizUpload = ({
  t,
}: UsePrepareQuizUploadParams): PrepareQuizUploadReturn => {
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';

  const setIsWaitingForFirstQuiz = useCallback((isWaitingForFirstQuiz: boolean) => {
    useQuizGenerationStore.setState({ isWaitingForFirstQuiz });
  }, []);
  const storeUploadedUrl = useQuizGenerationStore((state) => state.uploadedUrl);
  const storeFileInfo = useQuizGenerationStore((state) => state.fileInfo);
  const setUploadedUrlInStore = useQuizGenerationStore((state) => state.setUploadedUrl);
  const setUploadedFileInfo = useQuizGenerationStore((state) => state.setUploadedFileInfo);

  // 스토어 값을 동기적으로 읽어 초기값으로 사용 (새로고침 시 플래시 방지)
  const initialStoreState = useQuizGenerationStore.getState();
  const [file, setFile] = useState<UploadedFileInfo | null>(
    isMock
      ? { name: 'sample-document.pdf', size: 2.5 * 1024 * 1024 }
      : initialStoreState.fileInfo
        ? { name: initialStoreState.fileInfo.name, size: initialStoreState.fileInfo.size }
        : null,
  );
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(
    isMock ? 'mock://sample.pdf' : (initialStoreState.uploadedUrl ?? null),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploadElapsedTime, setUploadElapsedTime] = useState(0);
  const [fileExtension, setFileExtension] = useState<string | null>(
    initialStoreState.fileInfo?.extension ?? null,
  );
  const uploadTimerRef = useRef<Timer | null>(null);

  // 스토어가 뒤늦게 hydration되는 경우 대비
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
    async (nextFile: File, method: 'click' | 'drag_drop' = 'click') => {
      const ext = nextFile.name.split('.').pop()?.toLowerCase() ?? '';

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

      if (uploadTimerRef.current) {
        uploadTimerRef.current.stop();
        uploadTimerRef.current.reset();
        uploadTimerRef.current = null;
      }

      uploadTimerRef.current = new Timer((elapsed: number) => {
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

        const uploadTime = uploadTimerRef.current!.stop();
        trackPrepareQuizEvents.completeFileUpload(nextFile.name, uploadTime);
      } catch (error: unknown) {
        if (uploadTimerRef.current) {
          uploadTimerRef.current.stop();
        }

        console.error('파일 업로드 실패:', error);
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

  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        selectFile(e.dataTransfer.files[0], 'drag_drop');
      }
    },
    [selectFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
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
  }, [setUploadedFileInfo, setUploadedUrlInStore]);

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
