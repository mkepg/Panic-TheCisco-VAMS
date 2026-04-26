import './line-style-panel.scss';
import { Minus } from 'lucide-react';
import { useVamsStore } from '@/core/store';
import CollapsibleSection from '@/shared/ui/collapsible-section/CollapsibleSection';
import type { LineStipple, SceneNode } from '@/core/types/scene';

interface StipplePreset {
  label: string;
  factor: number;
  pattern: number;
}

/**
 * Common stipple patterns. Names mirror what students will recognise from
 * graphics references — these are concrete `glLineStipple` arguments.
 */
const STIPPLE_PRESETS: StipplePreset[] = [
  { label: 'Solid',       factor: 1, pattern: 0xFFFF },
  { label: 'Dashed',      factor: 1, pattern: 0x00FF },
  { label: 'Dotted',      factor: 1, pattern: 0x5555 },
  { label: 'Dot-dash',    factor: 1, pattern: 0x6F6F },
  { label: 'Long-dash',   factor: 2, pattern: 0x0FFF },
  { label: 'Sparse',      factor: 4, pattern: 0xAAAA },
];

const LINE_TYPES: ReadonlySet<SceneNode['type']> = new Set([
  'LINES', 'LINE_STRIP', 'LINE_LOOP',
]);

function patternToBits(pattern: number): boolean[] {
  const bits: boolean[] = [];
  for (let i = 15; i >= 0; i--) {
    bits.push(((pattern >> i) & 1) === 1);
  }
  return bits;
}

export default function LineStylePanel() {
  const objects = useVamsStore((s) => s.objects);
  const selectedObjectId = useVamsStore((s) => s.selectedObjectId);
  const updateLineWidth = useVamsStore((s) => s.updateLineWidth);
  const updateLineStipple = useVamsStore((s) => s.updateLineStipple);

  const selected = objects.find((o) => o.id === selectedObjectId);

  // The panel only appears for line primitives — no lighting-style "deferred"
  // language; if it's not a line, just don't render the section at all.
  if (!selected || !LINE_TYPES.has(selected.type)) return null;

  const lineWidth = selected.lineWidth ?? 1;
  const stipple: LineStipple | null = selected.lineStipple ?? null;
  const bits = stipple ? patternToBits(stipple.pattern) : null;

  const setStippleEnabled = (enabled: boolean) => {
    if (!enabled) {
      updateLineStipple(selected.id, null);
    } else {
      // Default to a clearly-stippled "Dashed" pattern so the change is visible.
      updateLineStipple(selected.id, { factor: 1, pattern: 0x00FF });
    }
  };

  const setPreset = (preset: StipplePreset) => {
    updateLineStipple(selected.id, { factor: preset.factor, pattern: preset.pattern });
  };

  const setFactor = (raw: string) => {
    if (!stipple) return;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    updateLineStipple(selected.id, { ...stipple, factor: Math.max(1, Math.min(256, n)) });
  };

  const setPatternHex = (raw: string) => {
    if (!stipple) return;
    const cleaned = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 4);
    if (cleaned.length === 0) return;
    const n = parseInt(cleaned, 16);
    if (Number.isNaN(n)) return;
    updateLineStipple(selected.id, { ...stipple, pattern: n & 0xFFFF });
  };

  const toggleBit = (visualIndex: number) => {
    if (!stipple) return;
    const bitIndex = 15 - visualIndex;
    const next = stipple.pattern ^ (1 << bitIndex);
    updateLineStipple(selected.id, { ...stipple, pattern: next & 0xFFFF });
  };

  const patternHexLabel = stipple
    ? `0x${stipple.pattern.toString(16).toUpperCase().padStart(4, '0')}`
    : '0xFFFF';

  return (
    <CollapsibleSection title="Line Style" icon={<Minus size={14} />} defaultOpen={true}>
      <div className="line-style-panel">

        {/* ----------------------------- Width ----------------------------- */}
        <div className="lsp-row">
          <div className="lsp-row-head">
            <span className="lsp-label">glLineWidth</span>
            <span className="lsp-value">{lineWidth.toFixed(1)} px</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={12}
            step={0.5}
            value={lineWidth}
            onChange={(e) => updateLineWidth(selected.id, parseFloat(e.currentTarget.value))}
            className="lsp-range"
            aria-label="Line width"
          />
        </div>

        {/* ----------------------- Stipple master toggle ------------------- */}
        <div className="lsp-stipple-toggle">
          <button
            type="button"
            className={`lsp-master ${stipple ? 'on' : ''}`}
            onClick={() => setStippleEnabled(!stipple)}
            aria-pressed={!!stipple}
          >
            <span className="dot" />
            <span className="lsp-master-label">glLineStipple</span>
            <span className="lsp-master-state">{stipple ? 'enabled' : 'disabled'}</span>
          </button>
        </div>

        {stipple && (
          <>
            {/* ----------------------- Pattern bit grid ------------------- */}
            <div className="lsp-pattern-block">
              <div className="lsp-row-head">
                <span className="lsp-label">Pattern</span>
                <input
                  type="text"
                  value={patternHexLabel}
                  onChange={(e) => setPatternHex(e.currentTarget.value.replace(/^0x/i, ''))}
                  className="lsp-hex"
                  spellcheck={false}
                  aria-label="Pattern hexadecimal"
                />
              </div>
              <div
                className="lsp-bits"
                role="group"
                aria-label="Stipple pattern bits — click to toggle"
              >
                {bits!.map((on, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`lsp-bit ${on ? 'on' : ''}`}
                    onClick={() => toggleBit(i)}
                    title={`Bit ${15 - i} = ${on ? '1' : '0'}`}
                  >
                    <span className="lsp-bit-glyph" aria-hidden />
                  </button>
                ))}
              </div>
              <div className="lsp-bit-rule">
                <span>MSB</span>
                <span>15 → 0</span>
                <span>LSB</span>
              </div>
            </div>

            {/* ---------------------------- Factor ------------------------ */}
            <div className="lsp-row">
              <div className="lsp-row-head">
                <span className="lsp-label">Factor</span>
                <span className="lsp-value">×{stipple.factor}</span>
              </div>
              <input
                type="range"
                min={1}
                max={16}
                step={1}
                value={stipple.factor}
                onChange={(e) => setFactor(e.currentTarget.value)}
                className="lsp-range"
                aria-label="Stipple factor"
              />
            </div>

            {/* --------------------------- Presets ------------------------ */}
            <div className="lsp-presets">
              {STIPPLE_PRESETS.map((p) => {
                const active = stipple.factor === p.factor && stipple.pattern === p.pattern;
                return (
                  <button
                    key={p.label}
                    type="button"
                    className={`lsp-preset ${active ? 'active' : ''}`}
                    onClick={() => setPreset(p)}
                  >
                    <span className="lsp-preset-name">{p.label}</span>
                    <span className="lsp-preset-mini" aria-hidden>
                      {patternToBits(p.pattern).map((on, i) => (
                        <span
                          key={i}
                          className={`lsp-mini-bit ${on ? 'on' : ''}`}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </CollapsibleSection>
  );
}