import { useEffect, useRef, useState } from 'react';

/** 5MB 청크 단위로 Range 분할 다운로드, 실패 시 청크별 재시도 */
const CHUNK_SIZE = 3 * 1024 * 1024;
const MAX_RETRIES = 3;

interface PdfDataState {
  /** react-pdf Document file prop에 전달 */
  data: { data: Uint8Array } | null;
  isLoading: boolean;
  error: string | null;
}

async function fetchChunkWithRetry(
  url: string,
  start: number,
  end: number,
  signal: AbortSignal,
): Promise<ArrayBuffer> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Range: `bytes=${start}-${end}` },
        signal,
      });
      if (res.ok || res.status === 206) {
        return await res.arrayBuffer();
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
    const chunk = await fetchChunkWithRetry(url, offset, end, signal);
    buffer.set(new Uint8Array(chunk), offset);
    offset = end + 1;
  }

  return buffer;
}

/** PDF를 직접 fetch하여 ArrayBuffer로 react-pdf에 전달하는 훅 */
export function usePdfData(uploadedUrl: string | null): PdfDataState {
  const [state, setState] = useState<PdfDataState>({
    data: null,
    isLoading: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!uploadedUrl) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    // URL 변환: files.q-asker.com → /files/ (same-origin)
    const url = uploadedUrl;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ data: null, isLoading: true, error: null });

    fetchPdfAsArrayBuffer(url, controller.signal)
      .then((buffer) => {
        if (!controller.signal.aborted) {
          setState({ data: { data: buffer }, isLoading: false, error: null });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setState({ data: null, isLoading: false, error: err.message });
        }
      });

    return () => controller.abort();
  }, [uploadedUrl]);

  return state;
}
