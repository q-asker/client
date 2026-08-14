import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** 5MB 청크 단위로 Range 분할 다운로드, 실패 시 청크별 재시도 */
const CHUNK_SIZE = 3 * 1024 * 1024;
const MAX_RETRIES = 3;

interface PdfDataState {
  /** react-pdf Document file prop에 전달 */
  data: { data: Uint8Array } | null;
  isLoading: boolean;
  error: string | null;
  /** 로딩 실패 시 재시도 (서버에서 다시 fetch) */
  retry: () => void;
  /** 같은 PDF 데이터의 새 복사본 생성 (detach된 buffer 대체용) */
  refreshCopy: () => void;
}

interface ChunkResponse {
  buffer: ArrayBuffer;
  /** 206이면 요청한 범위, 200이면 서버가 Range를 무시하고 보낸 전체 본문 */
  isPartial: boolean;
}

async function fetchChunkWithRetry(
  url: string,
  start: number,
  end: number,
  signal: AbortSignal,
): Promise<ChunkResponse> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Range: `bytes=${start}-${end}` },
        signal,
      });
      if (res.status === 206) {
        return { buffer: await res.arrayBuffer(), isPartial: true };
      }
      if (res.ok) {
        return { buffer: await res.arrayBuffer(), isPartial: false };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (signal.aborted) throw err;
      if (attempt === MAX_RETRIES - 1) throw err;
      // 재시도 전 대기 (exponential backoff)
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error('fetch failed');
}

async function fetchPdfAsArrayBuffer(url: string, signal: AbortSignal): Promise<Uint8Array> {
  // HEAD 요청으로 파일 크기 확인
  const headRes = await fetch(url, { method: 'HEAD', signal });
  const contentLength = Number(headRes.headers.get('content-length'));

  if (!contentLength || contentLength <= CHUNK_SIZE) {
    // 작은 파일은 한 번에 다운로드
    const res = await fetch(url, { signal });
    return new Uint8Array(await res.arrayBuffer());
  }

  // 청크 분할 다운로드 (순차 — 동시 요청 최소화)
  const buffer = new Uint8Array(contentLength);
  let offset = 0;

  while (offset < contentLength) {
    const end = Math.min(offset + CHUNK_SIZE - 1, contentLength - 1);
    const { buffer: chunk, isPartial } = await fetchChunkWithRetry(url, offset, end, signal);
    // CDN 캐시 히트 등으로 Range가 무시되면 전체 본문이 오므로 조립을 멈추고 그대로 쓴다
    if (!isPartial) return new Uint8Array(chunk);
    buffer.set(new Uint8Array(chunk), offset);
    offset = end + 1;
  }

  return buffer;
}

/**
 * PDF를 react-pdf에 전달하는 훅.
 * localFile이 있으면 로컬에서 직접 읽고, 없으면 서버에서 fetch한다.
 */
export function usePdfData(uploadedUrl: string | null, localFile?: File | null): PdfDataState {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // pdfjs worker가 ArrayBuffer를 transfer(detach)하므로 원본을 ref에 보관
  const sourceRef = useRef<Uint8Array | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  // copyVersion이 바뀔 때마다 sourceRef에서 새 .slice() 복사본 생성
  const [copyVersion, setCopyVersion] = useState(0);

  useEffect(() => {
    // 로컬 파일이 있으면 서버 다운로드 없이 직접 읽기
    if (localFile) {
      setIsLoading(true);
      setError(null);
      localFile
        .arrayBuffer()
        .then((buf) => {
          sourceRef.current = new Uint8Array(buf);
          setCopyVersion((v) => v + 1);
          setIsLoading(false);
        })
        .catch((err) => {
          setError((err as Error).message);
          setIsLoading(false);
        });
      return;
    }

    if (!uploadedUrl) {
      sourceRef.current = null;
      setCopyVersion((v) => v + 1);
      setIsLoading(false);
      setError(null);
      return;
    }

    const url = uploadedUrl;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    fetchPdfAsArrayBuffer(url, controller.signal)
      .then((buffer) => {
        if (!controller.signal.aborted) {
          sourceRef.current = buffer;
          setCopyVersion((v) => v + 1);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message);
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [uploadedUrl, localFile, retryCount]);

  // copyVersion이 바뀔 때만 새 복사본 생성 — 불필요한 <Document> 재파싱 방지
  const data = useMemo(() => {
    if (!sourceRef.current) return null;
    return { data: sourceRef.current.slice() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copyVersion]);

  const retry = useCallback(() => setRetryCount((c) => c + 1), []);
  const refreshCopy = useCallback(() => setCopyVersion((v) => v + 1), []);

  return { data, isLoading, error, retry, refreshCopy };
}
