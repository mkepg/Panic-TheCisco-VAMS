import './ortho-editor-panel.scss';
import {
  ScanLine,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useVamsStore } from '@/core/store';
import CollapsibleSection from '@/shared/ui/collapsible-section/CollapsibleSection';
import NumberInput from '@/shared/ui/number-input/NumberInput';
import type { ViewportLimits } from '@/core/types/scene';

const DEFAULT_LIMITS: ViewportLimits = { minX: -1, maxX: 1, minY: -1, maxY: 1 };

/** SVG viewBox covers a square big enough to comfortably fit (-2..2) ortho ranges. */
const PREVIEW_HALF = 2.5;

export default function OrthoEditorPanel() {
  const limits = useVamsStore((s) => s.viewportLimits);
  const setViewportLimits = useVamsStore((s) => s.setViewportLimits);
  const pushToHistory = useVamsStore((s) => s.pushToHistory);

  const isDefault =
    limits.minX === DEFAULT_LIMITS.minX &&
    limits.maxX === DEFAULT_LIMITS.maxX &&
    limits.minY === DEFAULT_LIMITS.minY &&
    limits.maxY === DEFAULT_LIMITS.maxY;

  const commit = (update: Partial<ViewportLimits>) => {
    const next: ViewportLimits = { ...limits, ...update };
    // Reject collapsed or inverted ranges — they break glOrtho's visible volume
    // and produce a dead canvas. Silent rejection is friendlier than a toast.
    if (next.minX >= next.maxX || next.minY >= next.maxY) return;
    pushToHistory();
    setViewportLimits(next);
  };

  const reset = () => {
    if (isDefault) return;
    pushToHistory();
    setViewportLimits(DEFAULT_LIMITS);
  };

  const width = limits.maxX - limits.minX;
  const height = limits.maxY - limits.minY;

  // SVG y-axis flips because SVG is screen-down but our world is math-up.
  const previewX = limits.minX;
  const previewY = -limits.maxY;
  const previewW = width;
  const previewH = height;

  return (
    <CollapsibleSection
      panelId="ortho-editor"
      title="Viewing Volume"
      icon={<ScanLine size={14} />}
      defaultOpen={true}
    >
      <div className="oep-panel">
        {/* ----- Live preview ----- */}
        <div className="oep-preview" aria-hidden>
          <svg
            viewBox={`${-PREVIEW_HALF} ${-PREVIEW_HALF} ${PREVIEW_HALF * 2} ${PREVIEW_HALF * 2}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Reference unit square — the OpenGL default ortho */}
            <rect x={-1} y={-1} width={2} height={2} className="oep-preview-ref" />

            {/* Origin axes */}
            <line x1={-PREVIEW_HALF} y1={0} x2={PREVIEW_HALF} y2={0} className="oep-preview-axis" />
            <line x1={0} y1={-PREVIEW_HALF} x2={0} y2={PREVIEW_HALF} className="oep-preview-axis" />

            {/* Active ortho rectangle */}
            <rect
              x={previewX}
              y={previewY}
              width={previewW}
              height={previewH}
              className="oep-preview-active"
            />

            {/* Origin marker */}
            <circle cx={0} cy={0} r={0.04} className="oep-preview-origin" />
          </svg>
          <div className="oep-preview-legend">
            <span className="oep-legend-row">
              <span className="oep-swatch ref" /> default
            </span>
            <span className="oep-legend-row">
              <span className="oep-swatch active" /> current
            </span>
          </div>
        </div>

        {/* ----- Numeric inputs (X-axis pair, then Y-axis pair) ----- */}
        <div className="oep-inputs">
          <div className="oep-row" data-axis="x">
            <NumberInput
              label="Left"
              value={limits.minX}
              onChange={(v) => commit({ minX: v })}
              icon={<ChevronLeft size={14} />}
              step={0.1}
              precision={2}
            />
          </div>
          <div className="oep-row" data-axis="x">
            <NumberInput
              label="Right"
              value={limits.maxX}
              onChange={(v) => commit({ maxX: v })}
              icon={<ChevronRight size={14} />}
              step={0.1}
              precision={2}
            />
          </div>
          <div className="oep-row" data-axis="y">
            <NumberInput
              label="Bottom"
              value={limits.minY}
              onChange={(v) => commit({ minY: v })}
              icon={<ChevronDown size={14} />}
              step={0.1}
              precision={2}
            />
          </div>
          <div className="oep-row" data-axis="y">
            <NumberInput
              label="Top"
              value={limits.maxY}
              onChange={(v) => commit({ maxY: v })}
              icon={<ChevronUp size={14} />}
              step={0.1}
              precision={2}
            />
          </div>
        </div>

        {/* ----- Footer: live size + reset ----- */}
        <div className="oep-footer">
          <span className="oep-stat">
            <span className="oep-stat-label">size</span>
            <code>
              {width.toFixed(2)} × {height.toFixed(2)}
            </code>
          </span>
          <button
            type="button"
            className="oep-reset"
            onClick={reset}
            disabled={isDefault}
            title="Reset to glOrtho(-1, 1, -1, 1)"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        </div>

        {/* ----- Inline note ----- */}
        <div className="oep-note" role="note">
          <Info size={12} className="oep-note-icon" aria-hidden />
          <p>
            These four numbers become the <code>glOrtho(...)</code> arguments at the top of
            <code> display()</code>. Smaller ranges zoom in; larger ranges zoom out.
          </p>
        </div>
      </div>
    </CollapsibleSection>
  );
}
