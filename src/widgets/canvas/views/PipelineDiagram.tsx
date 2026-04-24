import React from 'react';
import {
  ArrowDown,
  Pencil,
  Move3d,
  Triangle,
  Scissors,
  Grid3x3,
  Droplet,
  Layers,
} from 'lucide-react';
import { useVamsStore } from '@/core/store';
import StageVisual from './pipeline-stage-visuals';
import './pedagogical-views.scss';

interface PipelineStage {
  title: string;
  short: string;
  desc: string;
  detail: string;
  icon: React.ReactNode;
  kind: 'input' | 'process' | 'assembly' | 'clip' | 'raster' | 'fragment' | 'output';
  inputType: string;
  outputType: string;
  glApis: string[];
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    title: 'Vertex Specification',
    short: 'Input',
    desc: 'Application defines geometry (glBegin, glVertex, glColor) and sends it to OpenGL.',
    detail: 'Your C++ code feeds raw vertex data — positions, colors, normals — into the GL state machine.',
    icon: <Pencil size={16} strokeWidth={2.2} />,
    kind: 'input',
    inputType: 'C++ data',
    outputType: 'Vertex stream',
    glApis: ['glBegin', 'glVertex3f', 'glColor3f', 'glEnd'],
  },
  {
    title: 'Vertex Processing',
    short: 'Transform',
    desc: 'Per-vertex operations run, including transform matrices (ModelView/Projection).',
    detail: 'Each vertex is multiplied through ModelView × Projection to land in clip space.',
    icon: <Move3d size={16} strokeWidth={2.2} />,
    kind: 'process',
    inputType: 'Vertex stream',
    outputType: 'Clip-space verts',
    glApis: ['glMatrixMode', 'glLoadIdentity', 'glTranslatef', 'glRotatef'],
  },
  {
    title: 'Primitive Assembly',
    short: 'Assemble',
    desc: 'Vertices are grouped into primitives like lines, triangles, and polygons.',
    detail: 'Vertices are stitched into primitives according to the GL_* mode you chose in glBegin.',
    icon: <Triangle size={16} strokeWidth={2.2} />,
    kind: 'assembly',
    inputType: 'Clip-space verts',
    outputType: 'Primitives',
    glApis: ['GL_TRIANGLES', 'GL_LINES', 'GL_QUADS', 'GL_POLYGON'],
  },
  {
    title: 'Clipping & Culling',
    short: 'Clip',
    desc: 'Primitives outside the view volume are clipped. Back-facing primitives are discarded.',
    detail: 'Anything outside the view frustum is clipped; back-facing triangles are culled away.',
    icon: <Scissors size={16} strokeWidth={2.2} />,
    kind: 'clip',
    inputType: 'Primitives',
    outputType: 'Visible prims',
    glApis: ['glEnable(GL_CULL_FACE)', 'glCullFace', 'glFrontFace'],
  },
  {
    title: 'Rasterization',
    short: 'Raster',
    desc: 'Continuous vector geometry is converted into a discrete grid of potential pixels (fragments).',
    detail: 'Smooth vector shapes are sliced into a grid of fragments — potential pixels.',
    icon: <Grid3x3 size={16} strokeWidth={2.2} />,
    kind: 'raster',
    inputType: 'Visible prims',
    outputType: 'Fragments',
    glApis: ['glViewport', 'glPolygonMode', 'glLineWidth'],
  },
  {
    title: 'Fragment Processing',
    short: 'Shade',
    desc: 'Per-fragment operations run, including texturing, fog, and color calculations.',
    detail: 'Each fragment gets shaded: texture lookup, lighting, fog and final color are computed.',
    icon: <Droplet size={16} strokeWidth={2.2} />,
    kind: 'fragment',
    inputType: 'Fragments',
    outputType: 'Shaded frags',
    glApis: ['glTexImage2D', 'glLightfv', 'glFogf', 'glBlendFunc'],
  },
  {
    title: 'Per-Sample Operations',
    short: 'Output',
    desc: 'Final tests (Depth, Stencil, Alpha) run. Surviving fragments are written to the Framebuffer.',
    detail: 'Depth, stencil, and blend tests decide which fragments survive and reach the framebuffer.',
    icon: <Layers size={16} strokeWidth={2.2} />,
    kind: 'output',
    inputType: 'Shaded frags',
    outputType: 'Pixels',
    glApis: ['glDepthFunc', 'glStencilFunc', 'glClear', 'glFlush'],
  },
];

export default function PipelineDiagram() {
  const activePipelineStage = useVamsStore(s => s.activePipelineStage);
  const setActivePipelineStage = useVamsStore(s => s.setActivePipelineStage);
  const appMode = useVamsStore(s => s.appMode);

  const handleBackgroundClick = () => {
    if (appMode === 'Author') setActivePipelineStage(null);
  };

  const handleNodeClick = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (appMode === 'Author') {
      e.stopPropagation();
      setActivePipelineStage(activePipelineStage === index ? null : index);
    }
  };

  const activeStage =
    activePipelineStage !== null ? PIPELINE_STAGES[activePipelineStage] : null;

  return (
    <div
      className="pedagogical-overlay pipeline-diagram"
      onClick={handleBackgroundClick}
    >
      <div className="diagram-container flowchart">
        <header className="diagram-header">
          <span className="eyebrow">OpenGL Fixed-Function Pipeline</span>
          <h2>From Vertex to Pixel</h2>
          <p className="subheading">
            Seven stages transform raw geometry into the pixels on your screen. Click any
            stage to inspect its inputs, outputs, and relevant GL calls.
          </p>
        </header>

        {/* Mini progress rail */}
        <div className="stage-rail" role="tablist" aria-label="Pipeline stages">
          {PIPELINE_STAGES.map((stage, index) => {
            const isActive = activePipelineStage === index;
            return (
              <button
                key={`rail-${stage.title}`}
                type="button"
                className={`rail-pip ${isActive ? 'active' : ''}`}
                data-kind={stage.kind}
                title={stage.title}
                role="tab"
                aria-selected={isActive}
                onClick={(e) => {
                  e.stopPropagation();
                  if (appMode === 'Author') {
                    setActivePipelineStage(isActive ? null : index);
                  }
                }}
              >
                <span className="rail-index">{index + 1}</span>
                <span className="rail-label">{stage.short}</span>
              </button>
            );
          })}
        </div>

        <div className="stage-inspector" aria-live="polite">
          {activeStage ? (
            <div className="inspector-active" key={activePipelineStage}>
              <div className="inspector-visual">
                <StageVisual kind={activeStage.kind} />
              </div>
              <div className="inspector-body">
                <span className="inspector-step">
                  Stage {(activePipelineStage ?? 0) + 1} / {PIPELINE_STAGES.length}
                </span>
                <h3>{activeStage.title}</h3>
                <p>{activeStage.detail}</p>

                <div className="io-pills">
                  <span className="io-pill in">
                    <span className="io-label">IN</span>
                    <span className="io-value">{activeStage.inputType}</span>
                  </span>
                  <span className="io-arrow" aria-hidden>→</span>
                  <span className="io-pill out">
                    <span className="io-label">OUT</span>
                    <span className="io-value">{activeStage.outputType}</span>
                  </span>
                </div>

                <div className="gl-apis">
                  <span className="gl-apis-label">Key GL calls</span>
                  <div className="gl-apis-chips">
                    {activeStage.glApis.map((api) => (
                      <code key={api} className="gl-chip">{api}</code>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="inspector-empty">
              <span className="inspector-hint">
                Select a stage below to see what happens inside it.
              </span>
            </div>
          )}
        </div>

        <div className="flowchart-path">
          {PIPELINE_STAGES.map((stage, index) => {
            const isActive = activePipelineStage === index;
            const isDimmed =
              activePipelineStage !== null && !isActive;
            const nextStage = PIPELINE_STAGES[index + 1];

            return (
              <React.Fragment key={stage.title}>
                <div
                  className={`flow-node ${isActive ? 'active' : ''} ${
                    isDimmed ? 'dimmed' : ''
                  }`}
                  data-kind={stage.kind}
                  onClick={(e) => handleNodeClick(index, e)}
                  title={appMode === 'Author' ? 'Click to inspect' : ''}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (appMode === 'Author') {
                        setActivePipelineStage(isActive ? null : index);
                      }
                    }
                  }}
                >
                  <div className="node-index">
                    <span className="node-number">{index + 1}</span>
                    <span className="node-kind">{stage.short}</span>
                  </div>
                  <div className="node-icon">{stage.icon}</div>
                  <div className="node-content">
                    <h4>{stage.title}</h4>
                    <p>{stage.desc}</p>
                  </div>
                  <div className="node-chevron" aria-hidden="true">
                    →
                  </div>
                </div>

                {nextStage && (
                  <div className={`flow-arrow ${isDimmed ? 'dimmed' : ''}`}>
                    <span className="flow-data-type">{stage.outputType}</span>
                    <ArrowDown size={18} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <footer className="diagram-footer">
          <span className="legend-dot input" /> Application input
          <span className="legend-dot process" /> GPU compute
          <span className="legend-dot output" /> Framebuffer output
        </footer>
      </div>
    </div>
  );
}
