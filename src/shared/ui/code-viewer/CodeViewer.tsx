import './code-viewer.scss';
import { memo, useMemo, useState } from 'react';
import { TbCopy, TbCheck } from "react-icons/tb";

interface CodeViewerProps {
  code: string;
  highlightTarget?: string | null;
  isLessonMode?: boolean;
}

const CodeViewer = memo(function CodeViewer({ code, highlightTarget, isLessonMode }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  
  const lines = useMemo(() => code.split('\n'), [code]);
  const lineCount = lines.length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const highlightedLines = useMemo(() => {
    const highlighted = new Set<number>();
    if (!highlightTarget) return highlighted;

    let inTargetBlock = false;
    lines.forEach((line, index) => {
      if (line.includes(`draw_${highlightTarget}()`)) {
         highlighted.add(index);
      }
      if (line.includes(`state_${highlightTarget} `)) {
         highlighted.add(index);
      }
      if (line.startsWith(`void draw_${highlightTarget}()`)) {
         inTargetBlock = true;
      }
      if (inTargetBlock) {
         highlighted.add(index);
         if (line === '}') {
             inTargetBlock = false;
         }
      }
    });
    return highlighted;
  }, [lines, highlightTarget]);

  return (
    <div className={`code-viewer-container ${isLessonMode ? 'lesson-mode' : ''}`}>
      <div className="code-header">
        <span className="code-lang">C++ (OpenGL 1.5)</span>
        {/* Hide copy button completely if in lesson mode */}
        {!isLessonMode && (
          <button
            className={`copy-button ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Copy code"
            type="button"
          >
            {copied ? <TbCheck size={16} /> : <TbCopy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        )}
      </div>
      <div className="code-content">
        <div className="line-numbers" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className={`line-num ${highlightedLines.has(i) ? 'highlight' : ''}`}>
              {i + 1}
            </div>
          ))}
        </div>
        <pre>
          {lines.map((line, i) => (
            <div key={i} className={`code-line ${highlightedLines.has(i) ? 'highlight' : ''}`}>
              {line || ' '}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
});

export default CodeViewer;