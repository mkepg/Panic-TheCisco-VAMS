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
    desc: 'Your code lists the corner points (vertices) that describe each shape.',
    detail:
      'This is where every shape begins. Your program hands OpenGL a list of vertices — each with a position and color — that the rest of the pipeline turns into pixels.',
    icon: <Pencil size={16} strokeWidth={2.2} />,
    kind: 'input',
    inputType: 'C++ vertex list',
    outputType: 'Vertex stream',
    glApis: ['glBegin', 'glVertex3f', 'glColor3f', 'glEnd'],
  },
  {
    title: 'Vertex Processing',
    short: 'Transform',
    desc: 'Each vertex is moved, rotated, or scaled into its final position.',
    detail:
      'Each vertex is multiplied by transformation matrices to land where it should — translated, rotated, scaled, and projected into the visible viewing area.',
    icon: <Move3d size={16} strokeWidth={2.2} />,
    kind: 'process',
    inputType: 'Vertex stream',
    outputType: 'Positioned verts',
    glApis: ['glMatrixMode', 'glLoadIdentity', 'glTranslatef', 'glRotatef'],
  },
  {
    title: 'Primitive Assembly',
    short: 'Assemble',
    desc: 'Vertices are connected into shapes — points, lines, or triangles.',
    detail:
      'Loose vertices are stitched into actual primitives. Three vertices may become a triangle, two may form a line — depending on the GL_* mode you chose.',
    icon: <Triangle size={16} strokeWidth={2.2} />,
    kind: 'assembly',
    inputType: 'Positioned verts',
    outputType: 'Primitives',
    glApis: ['GL_TRIANGLES', 'GL_LINES', 'GL_QUADS', 'GL_POLYGON'],
  },
  {
    title: 'Clipping',
    short: 'Clip',
    desc: 'Anything outside the viewable area gets cut away.',
    detail:
      'Shapes that sit partly outside the visible window have their offscreen parts sliced off. Triangles facing away from the camera may be discarded too, to save work.',
    icon: <Scissors size={16} strokeWidth={2.2} />,
    kind: 'clip',
    inputType: 'Primitives',
    outputType: 'Visible prims',
    glApis: ['glEnable(GL_CULL_FACE)', 'glCullFace', 'glFrontFace'],
  },
  {
    title: 'Rasterization',
    short: 'Raster',
    desc: 'Smooth shapes are sliced into a grid of square fragments.',
    detail:
      'This is where vector becomes raster. Every visible primitive is broken down into a grid of fragments — small candidate units that may eventually become pixels.',
    icon: <Grid3x3 size={16} strokeWidth={2.2} />,
    kind: 'raster',
    inputType: 'Visible prims',
    outputType: 'Fragments',
    glApis: ['glViewport', 'glPolygonMode', 'glLineWidth'],
  },
  {
    title: 'Fragment Processing',
    short: 'Shade',
    desc: 'Each fragment receives its final color.',
    detail:
      'Each fragment is colored individually. Textures and effects are applied here to decide what the fragment will actually look like on screen.',
    icon: <Droplet size={16} strokeWidth={2.2} />,
    kind: 'fragment',
    inputType: 'Fragments',
    outputType: 'Colored frags',
    glApis: ['glTexImage2D', 'glFogf', 'glBlendFunc'],
  },
  {
    title: 'Per-Sample Operations',
    short: 'Output',
    desc: 'Final checks decide which fragments become real pixels on screen.',
    detail:
      'The last gate before the screen. Fragments that pass depth and stencil tests are written to the framebuffer — and that is what you see.',
    icon: <Layers size={16} strokeWidth={2.2} />,
    kind: 'output',
    inputType: 'Colored frags',
    outputType: 'Screen pixels',
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
          <span className="eyebrow">The OpenGL Rendering Pipeline</span>
          <h2>From Vertex to Pixel</h2>
          <p className="subheading">
            Seven steps turn the points you describe in code into the pixels you see
            on screen. Click any step to see what happens inside it.
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
