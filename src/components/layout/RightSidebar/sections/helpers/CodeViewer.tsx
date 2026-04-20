import { memo, useMemo, useState } from 'react';
import { TbCopy, TbCheck } from "react-icons/tb";

interface CodeViewerProps {
  code: string;
}

const CodeViewer = memo(function CodeViewer({ code }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  // Only recompute line count when code actually changes
  const lineCount = useMemo(() => code.split('\n').length, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="code-viewer-container">
      <div className="code-header">
        <span className="code-lang">C++ (OpenGL)</span>
        <button
          className={`copy-button ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          title="Copy code"
          type="button"
        >
          {copied ? <TbCheck size={16} /> : <TbCopy size={16} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="code-content">
        <div className="line-numbers" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <pre>{code}</pre>
      </div>
    </div>
  );
});

export default CodeViewer;
