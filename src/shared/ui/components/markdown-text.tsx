import { lazy, Suspense } from 'react';

interface MarkdownTextProps {
  children: string;
  className?: string;
}

const markdownImport = () => import('./markdown-text-impl');
const MarkdownTextImpl = lazy(markdownImport);

/** 페이지 idle 시 마크다운 청크 백그라운드 프리로드 (Safari는 requestIdleCallback 미지원) */
if (typeof window !== 'undefined') {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => markdownImport());
  } else {
    requestAnimationFrame(() => setTimeout(() => markdownImport(), 0));
  }
}

/** 마크다운 로딩 중 스켈레톤 — raw 텍스트 FOUC 방지 */
const MarkdownSkeleton = ({ className }: { className?: string }) => (
  <span className={className}>
    <span className="inline-block h-4 w-3/4 animate-pulse rounded bg-muted" />
  </span>
);

/**
 * MarkdownText lazy wrapper — katex(581KB), highlight.js(376KB)를 초기 번들에서 제외.
 * 실제 렌더링 시점에 동적 로드한다.
 */
const MarkdownText = ({ children, className }: MarkdownTextProps) => {
  return (
    <Suspense fallback={<MarkdownSkeleton className={className} />}>
      <MarkdownTextImpl className={className}>{children}</MarkdownTextImpl>
    </Suspense>
  );
};

export default MarkdownText;
