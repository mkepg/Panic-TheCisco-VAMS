import { useMemo } from 'react';
import { useVamsStore } from '@/core/store';
import type { SceneNode, TransformState, ViewportLimits } from '@/core/types/scene';

function buildMatrix4(t: TransformState): number[][] {
  const rad = (t.rotate * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return [
    [t.scaleX * cos, -t.scaleY * sin, 0, t.translateX],
    [t.scaleX * sin,  t.scaleY * cos, 0, t.translateY],
    [0,               0,              1, 0],
    [0,               0,              0, 1],
  ];
}

function getAncestorChain(objectId: string, objects: SceneNode[]): SceneNode[] {
  const chain: SceneNode[] = [];
  const byId = new Map(objects.map((o) => [o.id, o]));

  let current: SceneNode | undefined = byId.get(objectId);
  while (current) {
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return chain;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="math-section">
      <h4 className="math-section-title">{title}</h4>
      <div className="math-section-body">{children}</div>
    </div>
  );
}

function Matrix4({ m }: { m: number[][] }) {
  return (
    <div className="tm-matrix-container">
      <div className="tm-matrix" role="img" aria-label="4 by 4 transform matrix">
        <span className="tm-bracket left" aria-hidden />
        <div className="tm-matrix-inner">
          {m.map((row, ri) => (
            <div key={ri} className="tm-matrix-row">
              {row.map((val, ci) => {
                const isZero = val === 0;
                const isOne = val === 1;
                const isDiag = ri === ci;
                return (
                  <span
                    key={ci}
                    className={`tm-cell ${isDiag ? 'diag' : ''} ${isZero ? 'zero' : ''} ${isOne && isDiag ? 'identity' : ''}`}
                  >
                    {isZero ? '0' : isOne ? '1' : val.toFixed(2)}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <span className="tm-bracket right" aria-hidden />
      </div>
    </div>
  );
}

function TRSCompositionTrace({ t }: { t: TransformState }) {
  return (
    <div className="tm-composition" aria-label="Transform composition order">
      <div className="tm-comp-step">
        <span className="tm-comp-label">T</span>
        <code className="tm-comp-args">
          {t.translateX.toFixed(2)}, {t.translateY.toFixed(2)}
        </code>
      </div>
      <span className="tm-comp-op" aria-hidden>·</span>
      <div className="tm-comp-step">
        <span className="tm-comp-label">R</span>
        <code className="tm-comp-args">{t.rotate.toFixed(1)}°</code>
      </div>
      <span className="tm-comp-op" aria-hidden>·</span>
      <div className="tm-comp-step">
        <span className="tm-comp-label">S</span>
        <code className="tm-comp-args">
          {t.scaleX.toFixed(2)}, {t.scaleY.toFixed(2)}
        </code>
      </div>
      <span className="tm-comp-op" aria-hidden>=</span>
      <div className="tm-comp-step result">
        <span className="tm-comp-label">M</span>
      </div>
    </div>
  );
}

function MatrixStack({ chain }: { chain: SceneNode[] }) {
  return (
    <div className="tm-stack" aria-label="Matrix stack from bottom to top">
      {/* Base Identity Frame */}
      <div className="tm-stack-frame base">
        <span className="tm-stack-glyph" aria-hidden>I</span>
        <div className="tm-stack-body">
          <span className="tm-stack-name">Identity</span>
          <span className="tm-stack-note">glLoadIdentity()</span>
        </div>
      </div>

      {chain.map((node, i) => {
        const isLast = i === chain.length - 1;
        return (
          <div
            key={node.id}
            className={`tm-stack-frame ${isLast ? 'current' : 'ancestor'}`}
          >
            <span className="tm-stack-glyph" aria-hidden>{i + 1}</span>
            <div className="tm-stack-body">
              <span className="tm-stack-name" title={node.name}>{node.name}</span>
              <span className="tm-stack-note">
                {isLast ? 'current draw frame' : 'glPushMatrix · ancestor'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrthoMapping({ limits }: { limits: ViewportLimits }) {
  const w = limits.maxX - limits.minX;
  const h = limits.maxY - limits.minY;

  return (
    <div className="tm-ortho">
      <div className="tm-ortho-eq-group">
        <div className="tm-ortho-eq">
          <span className="tm-ortho-tag">X</span>
          <code>
            x<sub>ndc</sub> = 2 · (x − <strong>{limits.minX.toFixed(2)}</strong>) / <strong>{w.toFixed(2)}</strong> − 1
          </code>
        </div>
        <div className="tm-ortho-eq">
          <span className="tm-ortho-tag">Y</span>
          <code>
            y<sub>ndc</sub> = 2 · (y − <strong>{limits.minY.toFixed(2)}</strong>) / <strong>{h.toFixed(2)}</strong> − 1
          </code>
        </div>
      </div>
      <div className="tm-ortho-bounds">
        <div className="tm-bd-item">
          <span className="tm-bd-tag">left</span>
          <code>{limits.minX.toFixed(2)}</code>
        </div>
        <div className="tm-bd-item">
          <span className="tm-bd-tag">right</span>
          <code>{limits.maxX.toFixed(2)}</code>
        </div>
        <div className="tm-bd-item">
          <span className="tm-bd-tag">bottom</span>
          <code>{limits.minY.toFixed(2)}</code>
        </div>
        <div className="tm-bd-item">
          <span className="tm-bd-tag">top</span>
          <code>{limits.maxY.toFixed(2)}</code>
        </div>
      </div>
    </div>
  );
}

export default function TransformsMathContent() {
  const objects = useVamsStore((s) => s.objects);
  const selectedObjectId = useVamsStore((s) => s.selectedObjectId);
  const viewportLimits = useVamsStore((s) => s.viewportLimits);

  const selected = objects.find((o) => o.id === selectedObjectId);

  const chain = useMemo(
    () => (selected ? getAncestorChain(selected.id, objects) : []),
    [selected, objects],
  );

  const matrix = useMemo(
    () => (selected ? buildMatrix4(selected.transform) : null),
    [selected],
  );

  return (
    <div className="transforms-math">
      {/* GL_ORTHO / PROJECTION */}
      <Section title="glOrtho — Viewing Volume">
        <p className="explanation">
          <code>glOrtho</code> defines the rectangle of world space that maps to the visible
          window. Anything outside is clipped.
        </p>
        <OrthoMapping limits={viewportLimits} />
      </Section>

      {selected && matrix ? (
        <>
          <Section title="Selected Matrix (4×4)">
            <p className="explanation">
              Composed in conventional <strong>T · R · S</strong> order, then multiplied with
              every vertex during rendering.
            </p>
            <TRSCompositionTrace t={selected.transform} />
            <Matrix4 m={matrix} />
          </Section>

          {chain.length > 1 && (
            <Section title="Matrix Stack">
              <p className="explanation">
                Walking from the root down to <code>{selected.name}</code>. Each
                <code> glPushMatrix</code> stacks a new local frame on top of its parent.
              </p>
              <MatrixStack chain={chain} />
            </Section>
          )}
        </>
      ) : (
        <div className="empty-state">
          Select an object to inspect its 4×4 matrix and the matrix stack at draw time.
        </div>
      )}
    </div>
  );
}