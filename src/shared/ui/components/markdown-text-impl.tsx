import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.min.css';
import { cn } from '@/shared/ui/lib/utils';
import MermaidDiagram from '@/shared/ui/components/mermaid-diagram';

interface MarkdownTextProps {
  children: string;
  className?: string;
}

/**
 * 마크다운 렌더링 실패 시 원본 텍스트로 폴백하는 Error Boundary.
 */
class MarkdownErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[MarkdownText] 렌더링 실패, 원본 텍스트로 폴백:', error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const remarkPlugins = [remarkGfm, remarkMath] as const;
const rehypePlugins = [rehypeKatex, [rehypeHighlight, { plainText: ['mermaid'] }]] as const;

/**
 * 렌더 간 동일 참조를 유지하여 불필요한 리렌더링을 방지한다.
 */
const markdownComponents: Components = {
  // 블록 요소를 인라인 맥락에서도 안전하게 렌더링
  p: ({ children }) => <span className="block">{children}</span>,
  // 코드 블록
  pre: ({ children }) => {
    // Mermaid 블록은 pre 래핑 없이 다이어그램만 렌더링
    const child = Array.isArray(children) ? children[0] : children;
    if (child?.props?.className === 'language-mermaid') {
      return <>{children}</>;
    }
    return <pre className="my-2 overflow-x-auto rounded-lg bg-muted p-3 text-sm">{children}</pre>;
  },
  code: ({ children, className: codeClassName }) => {
    // Mermaid 다이어그램 렌더링
    if (codeClassName === 'language-mermaid') {
      const code = String(children).replace(/\n$/, '');
      return <MermaidDiagram code={code} />;
    }
    // 인라인 코드 vs 코드 블록 구분
    const isBlock = codeClassName?.startsWith('language-');
    if (isBlock) {
      return <code className={codeClassName}>{children}</code>;
    }
    return <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">{children}</code>;
  },
  // 강조
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  // 리스트
  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="my-0.5">{children}</li>,
  // 테이블
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border bg-muted px-3 py-1.5 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border border-border px-3 py-1.5">{children}</td>,
  // 제목
  h1: ({ children }) => <h1 className="mb-2 mt-4 text-xl font-bold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-4 text-lg font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => (
    <h3 className="mb-1 mt-3 text-base font-semibold first:mt-0">{children}</h3>
  ),
  // 구분선
  hr: () => <hr className="my-3 border-border" />,
  // 인용
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-primary pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
};

/**
 * 퀴즈 텍스트(문제, 선택지, 해설)에 마크다운 렌더링을 적용하는 컴포넌트.
 * GFM(GitHub Flavored Markdown)을 지원하며, 기존 스타일과 조화되도록 최소한의 스타일링만 적용한다.
 */
const MarkdownText = ({ children, className }: MarkdownTextProps) => {
  return (
    <div className={cn('markdown-text', className)}>
      <MarkdownErrorBoundary fallback={<span>{children}</span>}>
        <Markdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={markdownComponents}
        >
          {children}
        </Markdown>
      </MarkdownErrorBoundary>
    </div>
  );
};

export default MarkdownText;
