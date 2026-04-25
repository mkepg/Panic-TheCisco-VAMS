import './code-viewer.scss';
import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { TbCopy, TbCheck } from 'react-icons/tb';
import { Search, X, Info } from 'lucide-react';
import type { CodeAnnotation } from '@/features/code-generation/model/glut-annotations';

interface CodeViewerProps {
  code: string;
  highlightTarget?: string | null;
  isLessonMode?: boolean;
  annotations?: CodeAnnotation[];
}

const KEYWORDS = new Set([
  'void', 'int', 'float', 'double', 'char', 'bool', 'const', 'static',
  'struct', 'class', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'true', 'false', 'nullptr',
  'unsigned', 'signed', 'short', 'long', 'auto', 'using', 'namespace',
  'reinterpret_cast', 'sizeof', 'new', 'delete',
]);
const GL_PREFIXES = ['GL_', 'GLUT_'];

function tokenizeLine(line: string): Array<{ t: string; k: string }> {
  const out: Array<{ t: string; k: string }> = [];
  let i = 0;
  const n = line.length;
  while (i < n) {
    const ch = line[i];
    if (i === 0 && /^\s*#/.test(line)) { out.push({ t: line, k: 'pp' }); return out; }
    if (ch === '/' && line[i + 1] === '/') { out.push({ t: line.slice(i), k: 'comment' }); return out; }
    if (ch === '"') {
      let j = i + 1;
      while (j < n && line[j] !== '"') { if (line[j] === '\\') j++; j++; }
      out.push({ t: line.slice(i, j + 1), k: 'string' }); i = j + 1; continue;
    }
    if (ch === "'") {
      let j = i + 1;
      while (j < n && line[j] !== "'") { if (line[j] === '\\') j++; j++; }
      out.push({ t: line.slice(i, j + 1), k: 'string' }); i = j + 1; continue;
    }
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(line[i + 1] || ''))) {
      const m = line.slice(i).match(/^[0-9]*\.?[0-9]+(e[+-]?[0-9]+)?[fFlLuU]*/);
      if (m) { out.push({ t: m[0], k: 'num' }); i += m[0].length; continue; }
    }
    if (/[A-Za-z_]/.test(ch)) {
      const m = line.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (m) {
        const tok = m[0];
        let kind = 'ident';
        if (KEYWORDS.has(tok)) kind = 'kw';
        else if (GL_PREFIXES.some((p) => tok.startsWith(p))) kind = 'const';
        else if (tok.startsWith('gl') && tok.length > 2 && /[A-Z]/.test(tok[2])) kind = 'glfn';
        else if (tok.startsWith('glut') && tok.length > 4) kind = 'glfn';
        else if (line[i + tok.length] === '(') kind = 'fn';
        else if (tok === tok.toUpperCase() && tok.length > 1) kind = 'const';
        out.push({ t: tok, k: kind });
        i += tok.length; continue;
      }
    }
    if (/[{}()\[\];,.:]/.test(ch)) { out.push({ t: ch, k: 'punct' }); i++; continue; }
    if (/[+\-*/%=<>!&|^~?]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[+\-*/%=<>!&|^~?]/.test(line[j])) j++;
      out.push({ t: line.slice(i, j), k: 'op' }); i = j; continue;
    }
    out.push({ t: ch, k: 'ws' }); i++;
  }
  return out;
}

const TokenizedLine = memo(function TokenizedLine({ line }: { line: string }) {
  const tokens = useMemo(() => tokenizeLine(line), [line]);
  return (
    <>
      {tokens.map((tok, i) => (
        <span key={i} className={`tk tk-${tok.k}`}>{tok.t}</span>
      ))}
    </>
  );
});

const CodeViewer = memo(function CodeViewer({
  code, highlightTarget, isLessonMode, annotations,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const lines = useMemo(() => code.split('\n'), [code]);
  const lineCount = lines.length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { console.error('Failed to copy text: ', err); }
  };

  useEffect(() => {
    if (searchOpen) requestAnimationFrame(() => searchRef.current?.focus());
  }, [searchOpen]);

  const highlightedLines = useMemo(() => {
    const highlighted = new Set<number>();
    if (!highlightTarget) return highlighted;
    let inTargetBlock = false;
    lines.forEach((line, index) => {
      if (line.includes(`draw_${highlightTarget}()`)) highlighted.add(index);
      if (line.includes(`state_${highlightTarget} `)) highlighted.add(index);
      if (line.trim() === `void draw_${highlightTarget}()`) inTargetBlock = true;
      if (inTargetBlock) {
        highlighted.add(index);
        if (line.trim() === '}' && line.startsWith('}')) inTargetBlock = false;
      }
    });
    return highlighted;
  }, [lines, highlightTarget]);

  const searchMatches = useMemo(() => {
    if (!search.trim()) return new Set<number>();
    const q = search.toLowerCase();
    const m = new Set<number>();
    lines.forEach((line, i) => { if (line.toLowerCase().includes(q)) m.add(i); });
    return m;
  }, [lines, search]);

  // Map line indices → annotation
  const annotationByLine = useMemo(() => {
    const map = new Map<number, CodeAnnotation>();
    if (!annotations || annotations.length === 0) return map;
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      for (const a of annotations) {
        if (a.pattern.test(trimmed)) {
          if (!map.has(idx)) map.set(idx, a);
          break;
        }
      }
    });
    return map;
  }, [lines, annotations]);

  const stats = useMemo(() => {
    const bytes = new Blob([code]).size;
    return { lines: lineCount, bytes };
  }, [code, lineCount]);

  return (
    <div className={`code-viewer-container ${isLessonMode ? 'lesson-mode' : ''}`}>
      <div className="code-header">
        <div className="code-header-left">
          <span className="code-lang">C++ · OpenGL 1.5</span>
          <span className="code-sep">•</span>
          <span className="code-stat">{stats.lines} lines</span>
          {annotationByLine.size > 0 && !highlightTarget && (
            <span className="code-annot-hint" title="Hover an underlined line for an explanation">
              <Info size={11} />
              <span>hover lines for notes</span>
            </span>
          )}
          {highlightTarget && (
            <span className="code-focus" title={`Highlighting: ${highlightTarget}`}>
              focus: <code>{highlightTarget}</code>
            </span>
          )}
        </div>
        <div className="code-header-right">
          {!isLessonMode && (
            <>
              {searchOpen ? (
                <div className="code-search">
                  <Search size={12} />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    placeholder="Find in code…"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { setSearch(''); setSearchOpen(false); }
                    }}
                  />
                  {search && <span className="search-count">{searchMatches.size}</span>}
                  <button
                    type="button"
                    className="search-close"
                    onClick={() => { setSearch(''); setSearchOpen(false); }}
                    title="Close search"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button className="header-btn" onClick={() => setSearchOpen(true)} title="Find" type="button">
                  <Search size={13} />
                </button>
              )}
              <button
                className={`copy-button ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy code"
                type="button"
              >
                {copied ? <TbCheck size={14} /> : <TbCopy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </>
          )}
        </div>
      </div>
      <div className="code-content">
        <div className="line-numbers" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className={`line-num ${highlightedLines.has(i) ? 'highlight' : ''} ${searchMatches.has(i) ? 'match' : ''}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <pre>
          {lines.map((line, i) => {
            const annotation = annotationByLine.get(i);
            return (
              <div
                key={i}
                className={`code-line ${highlightedLines.has(i) ? 'highlight' : ''} ${searchMatches.has(i) ? 'match' : ''} ${annotation ? 'has-annot' : ''}`}
              >
                {line ? <TokenizedLine line={line} /> : ' '}
                {annotation && (
                  <span className="code-annot" role="tooltip">
                    <span className="annot-title">{annotation.title}</span>
                    <span className="annot-desc">{annotation.description}</span>
                  </span>
                )}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
});

export default CodeViewer;
