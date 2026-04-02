import { lazy, Suspense } from 'react';

interface MarkdownTextProps {
  children: string;
  className?: string;
}

const MarkdownTextImpl = lazy(() => import('./markdown-text-impl'));

/**
 * MarkdownText lazy wrapper — katex(581KB), highlight.js(376KB)를 초기 번들에서 제외.
 * 실제 렌더링 시점에 동적 로드한다.
 */
const MarkdownText = ({ children, className }: MarkdownTextProps) => {
  return (
    <Suspense fallback={<span className={className}>{children}</span>}>
      <MarkdownTextImpl className={className}>{children}</MarkdownTextImpl>
    </Suspense>
  );
};

export default MarkdownText;
