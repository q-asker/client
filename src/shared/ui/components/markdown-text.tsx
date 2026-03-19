import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/shared/ui/lib/utils';

interface MarkdownTextProps {
  children: string;
  className?: string;
}

/**
 * 퀴즈 텍스트(문제, 선택지, 해설)에 마크다운 렌더링을 적용하는 컴포넌트.
 * GFM(GitHub Flavored Markdown)을 지원하며, 기존 스타일과 조화되도록 최소한의 스타일링만 적용한다.
 */
const MarkdownText = ({ children, className }: MarkdownTextProps) => {
  return (
    <div className={cn('markdown-text', className)}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // 블록 요소를 인라인 맥락에서도 안전하게 렌더링
          p: ({ children }) => <span className="block">{children}</span>,
          // 코드 블록
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-lg bg-muted p-3 text-sm">{children}</pre>
          ),
          code: ({ children, className: codeClassName }) => {
            // 인라인 코드 vs 코드 블록 구분
            const isBlock = codeClassName?.startsWith('language-');
            if (isBlock) {
              return <code className={codeClassName}>{children}</code>;
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">{children}</code>
            );
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
          h1: ({ children }) => (
            <h1 className="mb-2 mt-4 text-xl font-bold first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-lg font-bold first:mt-0">{children}</h2>
          ),
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
        }}
      >
        {children}
      </Markdown>
    </div>
  );
};

export default MarkdownText;
