import { useMemo, useState } from 'react';
import { TbCopy, TbCheck } from "react-icons/tb";

interface CodeViewerProps {
  code: string;
}

export default function CodeViewer({ code }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => code.split('\n'), [code]);

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
      {/* New dedicated header for the code block */}
      <div className="code-header">
        <span className="code-lang">C++ (OPENGL)</span>
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
        <div className="line-numbers">
          {lines.map((_, i) => (
            <div key={`line-${i}`}>{i + 1}</div>
          ))}
        </div>
        <pre>{code}</pre>
      </div>
    </div>
  );
}