import { useMemo } from 'react';
import { useVamsStore } from '@/core/store';
import type { SceneNode, Vertex } from '@/core/types/scene';

/* ---------------------------- Helpers ----------------------------- */

function hexToRGB255(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgb255ToFloat([r, g, b]: [number, number, number]): [number, number, number] {
  return [r / 255, g / 255, b / 255];
}

function isLine(t: SceneNode['type']): boolean {
  return t === 'LINES' || t === 'LINE_STRIP' || t === 'LINE_LOOP';
}

function isTriangle(t: SceneNode['type']): boolean {
  return t === 'TRIANGLES' || t === 'TRIANGLE_STRIP' || t === 'TRIANGLE_FAN';
}

/* --------------------------- Sub-sections -------------------------- */

function ColorConversion({ hex }: { hex: string }) {
  const [r, g, b] = hexToRGB255(hex);
  const [rf, gf, bf] = rgb255ToFloat([r, g, b]);
  return (
    <div className="primitives-color-conv">
      <div className="cc-swatch" style={{ background: hex }} aria-hidden />
      <div className="cc-row">
        <span className="cc-mode">glColor3f</span>
        <code className="cc-value">
          ({rf.toFixed(2)}f, {gf.toFixed(2)}f, {bf.toFixed(2)}f)
        </code>
      </div>
      <div className="cc-row">
        <span className="cc-mode">glColor3ub</span>
        <code className="cc-value">({r}, {g}, {b})</code>
      </div>
      <div className="cc-formula">
        <span className="cc-formula-label">conversion</span>
        <code>float = byte / 255.0</code>
      </div>
    </div>
  );
}

function StippleBits({ pattern, factor }: { pattern: number; factor: number }) {
  const bits = useMemo(() => {
    const out: boolean[] = [];
    for (let i = 15; i >= 0; i--) out.push(((pattern >> i) & 1) === 1);
    return out;
  }, [pattern]);

  const hex = `0x${pattern.toString(16).toUpperCase().padStart(4, '0')}`;
  const onCount = bits.filter(Boolean).length;

  return (
    <div className="primitives-stipple">
      <div className="ps-bits" aria-hidden>
        {bits.map((on, i) => (
          <span key={i} className={`ps-bit ${on ? 'on' : ''}`} />
        ))}
      </div>
      <div className="ps-meta">
        <code>{hex}</code>
        <span className="ps-sep">·</span>
        <span>×{factor}</span>
        <span className="ps-sep">·</span>
        <span>{onCount}/16 lit</span>
      </div>
    </div>
  );
}

function BarycentricMixer({ vertices }: { vertices: Vertex[] }) {
  // Show the three corners + the average ("centroid") — students get the gist
  // without needing an interactive triangle widget.
  if (vertices.length < 3) return null;
  const v0 = hexToRGB255(vertices[0].color);
  const v1 = hexToRGB255(vertices[1].color);
  const v2 = hexToRGB255(vertices[2].color);
  const avg: [number, number, number] = [
    Math.round((v0[0] + v1[0] + v2[0]) / 3),
    Math.round((v0[1] + v1[1] + v2[1]) / 3),
    Math.round((v0[2] + v1[2] + v2[2]) / 3),
  ];
  const avgHex = `#${avg.map((n) => n.toString(16).padStart(2, '0')).join('')}`;

  return (
    <div className="primitives-bary">
      <div className="pb-formula">
        <code>C = α·C₀ + β·C₁ + γ·C₂</code>
        <span className="pb-note">α + β + γ = 1</span>
      </div>
      <div className="pb-corners">
        {[vertices[0], vertices[1], vertices[2]].map((v, i) => (
          <div key={v.id} className="pb-corner">
            <span className="pb-corner-swatch" style={{ background: v.color }} />
            <span className="pb-corner-label">C{i}</span>
          </div>
        ))}
        <span className="pb-arrow" aria-hidden>→</span>
        <div className="pb-corner pb-result">
          <span className="pb-corner-swatch" style={{ background: avgHex }} />
          <span className="pb-corner-label">centroid</span>
        </div>
      </div>
    </div>
  );
}

function VertexTable({ vertices }: { vertices: Vertex[] }) {
  if (vertices.length === 0) return null;
  return (
    <div className="primitives-vertex-table">
      <div className="pvt-head">
        <span>#</span>
        <span>x</span>
        <span>y</span>
        <span>color</span>
      </div>
      <div className="pvt-body">
        {vertices.map((v, i) => (
          <div key={v.id} className="pvt-row">
            <span className="pvt-i">V{i}</span>
            <code>{v.x.toFixed(3)}</code>
            <code>{v.y.toFixed(3)}</code>
            <span className="pvt-c">
              <span className="pvt-swatch" style={{ background: v.color }} />
              <code>{v.color.toUpperCase()}</code>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Root ------------------------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="math-section">
      <h4 className="math-section-title">{title}</h4>
      <div className="math-section-body">{children}</div>
    </div>
  );
}

export default function PrimitivesMathContent() {
  const objects = useVamsStore((s) => s.objects);
  const selectedObjectId = useVamsStore((s) => s.selectedObjectId);
  const selected = objects.find((o) => o.id === selectedObjectId);

  if (!selected) {
    return (
      <div className="empty-state">
        Select a primitive to see color conversions, vertex data, and (for line primitives) stipple breakdown.
      </div>
    );
  }
  if (selected.type === 'GROUP') {
    return (
      <div className="empty-state">
        Groups don't emit drawing calls of their own — select a primitive inside the group.
      </div>
    );
  }

  const firstColor = selected.vertices[0]?.color || '#ffffff';

  return (
    <div className="primitives-math">
      <Section title="Color">
        <ColorConversion hex={firstColor} />
      </Section>

      {isTriangle(selected.type) && selected.vertices.length >= 3 && (
        <Section title="Barycentric Interpolation">
          <BarycentricMixer vertices={selected.vertices} />
        </Section>
      )}

      {isLine(selected.type) && selected.lineStipple && (
        <Section title="Stipple Pattern">
          <StippleBits
            pattern={selected.lineStipple.pattern}
            factor={selected.lineStipple.factor}
          />
        </Section>
      )}

      <Section title="Vertices">
        <VertexTable vertices={selected.vertices} />
      </Section>
    </div>
  );
}
