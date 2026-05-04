import './textures-panels.scss';
import { useRef, useState } from 'react';
import { Grid3x3, RotateCcw } from 'lucide-react';
import { useVamsStore } from '@/core/store';
import CollapsibleSection from '@/shared/ui/collapsible-section/CollapsibleSection';

const VIEW_MIN = -0.5;
const VIEW_MAX = 1.5;
const VIEW_SPAN = VIEW_MAX - VIEW_MIN;

export default function UVEditorPanel() {
  const objects = useVamsStore((s) => s.objects);
  const selectedObjectId = useVamsStore((s) => s.selectedObjectId);
  const getTextureById = useVamsStore((s) => s.getTextureById);
  const updateUV = useVamsStore((s) => s.updateUV);
  const resetUVsToDefault = useVamsStore((s) => s.resetUVsToDefault);
  const startBatch = useVamsStore((s) => s.startBatch);
  const endBatch = useVamsStore((s) => s.endBatch);
  const pushToHistory = useVamsStore((s) => s.pushToHistory);

  const stageRef = useRef<HTMLDivElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const selected = objects.find((o) => o.id === selectedObjectId);

  if (!selected || !selected.texture || !selected.uvs || selected.uvs.length === 0) {
    return (
      <CollapsibleSection
        panelId="uv-editor"
        title="UV Editor"
        icon={<Grid3x3 size={14} />}
        defaultOpen={true}
      >
        <div className="uve-empty">
          Apply a texture to a primitive to edit its UV coordinates.
        </div>
      </CollapsibleSection>
    );
  }

  const tex = getTextureById(selected.texture.textureId);
  const uvs = selected.uvs;
  const wrap = selected.texture.wrap;
  const isRepeat = wrap === 'REPEAT';

  const uvToSvg = (u: number, v: number) => {
    const x = (u - VIEW_MIN) / VIEW_SPAN;
    const y = 1 - (v - VIEW_MIN) / VIEW_SPAN;
    return { x, y };
  };

  const svgToUv = (sx: number, sy: number) => {
    const u = VIEW_MIN + sx * VIEW_SPAN;
    const v = VIEW_MIN + (1 - sy) * VIEW_SPAN;
    return { u, v };
  };

  const edges: Array<[number, number]> = [];
  const t = selected.type;
  const n = uvs.length;

  if (t === 'TRIANGLES') {
    for (let i = 0; i + 2 < n; i += 3) {
      edges.push([i, i + 1], [i + 1, i + 2], [i + 2, i]);
    }
  } else if (t === 'TRIANGLE_STRIP') {
    for (let i = 0; i + 2 < n; i++) {
      edges.push([i, i + 1], [i + 1, i + 2]);
    }
  } else if (t === 'TRIANGLE_FAN') {
    for (let i = 1; i + 1 < n; i++) {
      edges.push([0, i], [i, i + 1], [0, i + 1]);
    }
  } else if (t === 'QUADS') {
    for (let i = 0; i + 3 < n; i += 4) {
      edges.push([i, i + 1], [i + 1, i + 2], [i + 2, i + 3], [i + 3, i]);
    }
  } else if (t === 'QUAD_STRIP') {
    for (let i = 0; i + 3 < n; i += 2) {
      edges.push([i, i + 1], [i + 1, i + 3], [i + 3, i + 2], [i + 2, i]);
    }
  } else if (t === 'POLYGON') {
    for (let i = 0; i < n; i++) edges.push([i, (i + 1) % n]);
  }

  const onPointerDown = (idx: number) => (e: React.PointerEvent<SVGCircleElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as SVGCircleElement).setPointerCapture(e.pointerId);
    pushToHistory();
    startBatch();
    setDraggingIdx(idx);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingIdx === null) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const sx = (e.clientX - rect.left) / rect.width;
    const sy = (e.clientY - rect.top) / rect.height;
    const { u, v } = svgToUv(sx, sy);
    updateUV(selected.id, draggingIdx, { u, v });
  };

  const onPointerUp = () => {
    if (draggingIdx !== null) {
      endBatch();
      setDraggingIdx(null);
    }
  };

  const tileSizePct = `${(1 / VIEW_SPAN) * 100}%`;

  const bgStyle: React.CSSProperties = tex
    ? isRepeat
      ? {
          backgroundImage: `url(${tex.dataUrl})`,
          backgroundRepeat: 'repeat',
          backgroundSize: `${tileSizePct} ${tileSizePct}`,
          backgroundPosition: 'center',
        }
      : {
          backgroundImage: `url(${tex.dataUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${tileSizePct} ${tileSizePct}`,
          backgroundPosition: 'center',
        }
    : {};

  const unitTopPct = `${(0.5 / VIEW_SPAN) * 100}%`;
  const unitLeftPct = unitTopPct;
  const unitSizePct = `${(1 / VIEW_SPAN) * 100}%`;

  return (
    <CollapsibleSection
      panelId="uv-editor"
      title="UV Editor"
      icon={<Grid3x3 size={14} />}
      defaultOpen={true}
    >
      <div className="uve-panel">
        <div
          className="uve-stage"
          ref={stageRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div className="uve-stage-img" style={bgStyle} />
          <div
            className="uve-uv-rect"
            style={{ top: unitTopPct, left: unitLeftPct, width: unitSizePct, height: unitSizePct }}
          />

          <svg
            className="uve-stage-svg"
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
          >
            <g className="uve-edges">
              {edges.map(([a, b], i) => {
                const pa = uvToSvg(uvs[a].u, uvs[a].v);
                const pb = uvToSvg(uvs[b].u, uvs[b].v);
                return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} />;
              })}
            </g>

            {uvs.map((uv, i) => {
              const p = uvToSvg(uv.u, uv.v);
              return (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={0.035}
                    className={`uve-handle ${draggingIdx === i ? 'dragging' : ''}`}
                    onPointerDown={onPointerDown(i)}
                  />
                  <text
                    x={p.x}
                    y={p.y + 0.012}
                    className="uve-handle-label"
                  >
                    {i}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="uve-foot">
          <span className="uve-foot-hint">
            Drag any handle. Drop it past the dashed unit square to see {isRepeat ? 'tiling' : 'clamping'} kick in.
          </span>
          <button
            type="button"
            className="uve-reset"
            onClick={() => resetUVsToDefault(selected.id)}
            title="Reset UVs to default unit-square mapping"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </CollapsibleSection>
  );
}