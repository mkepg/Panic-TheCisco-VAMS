import React from 'react';
import { ArrowDown } from 'lucide-react';
import { useVamsStore } from '@/core/store';
import './pedagogical-views.scss';

const PIPELINE_STAGES = [
  { 
    title: 'Vertex Specification', 
    desc: 'Application defines geometry (glBegin, glVertex, glColor) and sends it to OpenGL.'
  },
  { 
    title: 'Vertex Processing', 
    desc: 'Per-vertex operations run, including transform matrices (ModelView/Projection).'
  },
  { 
    title: 'Primitive Assembly', 
    desc: 'Vertices are grouped into primitives like lines, triangles, and polygons.'
  },
  { 
    title: 'Clipping & Culling', 
    desc: 'Primitives outside the view volume are clipped. Back-facing primitives are discarded.'
  },
  { 
    title: 'Rasterization', 
    desc: 'Continuous vector geometry is converted into a discrete grid of potential pixels (fragments).'
  },
  { 
    title: 'Fragment Processing', 
    desc: 'Per-fragment operations run, including texturing, fog, and color calculations.'
  },
  { 
    title: 'Per-Sample Operations', 
    desc: 'Final tests (Depth, Stencil, Alpha) run. Surviving fragments are written to the Framebuffer.'
  }
];

export default function PipelineDiagram() {
  const activePipelineStage = useVamsStore(s => s.activePipelineStage);
  const setActivePipelineStage = useVamsStore(s => s.setActivePipelineStage);
  const appMode = useVamsStore(s => s.appMode);

  /**
   * Clears the selection when clicking on any empty area.
   * By removing stopPropagation from the diagram container, this now captures clicks 
   * on blank spaces within the center column as well.
   */
  const handleBackgroundClick = () => {
    if (appMode === 'Author') {
      setActivePipelineStage(null);
    }
  };

  /**
   * Handles stage selection and prevents the event from bubbling up to the background.
   * The stopPropagation here is critical: it ensures that clicking a node only selects that node
   * and does not trigger the background's "clear" logic.
   */
  const handleNodeClick = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (appMode === 'Author') {
      e.stopPropagation(); 
      setActivePipelineStage(activePipelineStage === index ? null : index);
    }
  };

  return (
    <div 
      className="pedagogical-overlay pipeline-diagram" 
      onClick={handleBackgroundClick}
    >
      {/* Removed stopPropagation from this container to allow background clicks */}
      <div className="diagram-container flowchart">
        <h2>The OpenGL Rendering Pipeline</h2>
        
        <div className="flowchart-path">
          {PIPELINE_STAGES.map((stage, index) => {
            const isActive = activePipelineStage === index;
            const isDimmed = activePipelineStage !== null && !isActive;

            return (
              <React.Fragment key={stage.title}>
                <div 
                  className={`flow-node ${isActive ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}`}
                  onClick={(e) => handleNodeClick(index, e)}
                  title={appMode === 'Author' ? "Click to highlight" : ""}
                >
                  <div className="node-number">{index + 1}</div>
                  <div className="node-content">
                    <h4>{stage.title}</h4>
                    <p>{stage.desc}</p>
                  </div>
                </div>

                {index < PIPELINE_STAGES.length - 1 && (
                  <div className={`flow-arrow ${isDimmed ? 'dimmed' : ''}`}>
                    <ArrowDown size={24} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}