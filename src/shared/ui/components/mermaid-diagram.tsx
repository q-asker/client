import { useEffect, useId, useState } from 'react';

/**
 * Mermaid 다이어그램을 렌더링하는 컴포넌트.
 * mermaid 라이브러리를 dynamic import로 지연 로드하여 번들 크기 영향을 최소화한다.
 */
const MermaidDiagram = ({ code }: { code: string }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const uniqueId = useId().replace(/:/g, '-');

  useEffect(() => {
    let cancelled = false;
    const renderId = `mermaid-${uniqueId}`;

    const renderDiagram = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'strict',
        });

        const { svg: renderedSvg } = await mermaid.render(renderId, code.trim());
        if (!cancelled) {
          setSvg(renderedSvg);
          setError('');
        }
      } catch (err) {
        // mermaid가 에러 시 DOM에 삽입하는 임시 엘리먼트들 제거
        document.getElementById(`d${renderId}`)?.remove();
        document.querySelector(`[id="${renderId}"]`)?.remove();
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Mermaid 렌더링 실패');
          setSvg('');
        }
      }
    };

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [code, uniqueId]);

  if (error) {
    // 구문 에러 시 일반 코드 블록으로 폴백
    return (
      <pre className="my-2 overflow-x-auto rounded-lg bg-muted p-3 text-sm">
        <code>{code}</code>
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="my-2 flex items-center justify-center rounded-lg bg-muted p-4">
        <span className="text-sm text-muted-foreground">다이어그램 로딩 중...</span>
      </div>
    );
  }

  return (
    <div
      className="my-2 flex justify-center overflow-x-auto rounded-lg bg-background p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidDiagram;
