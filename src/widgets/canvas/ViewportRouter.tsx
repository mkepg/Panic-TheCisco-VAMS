import React from 'react';
import { useVamsStore } from '@/core/store';
import VamsCanvas from './VamsCanvas';
import PipelineDiagram from './views/PipelineDiagram';
import RasterVectorView from './views/RasterVectorView';

export default function ViewportRouter() {
  const activeSection = useVamsStore((state) => state.activeSection);
  const pipelineMode = useVamsStore((state) => state.pipelineMode);

  // Determine if a pedagogical overlay is currently covering the canvas
  const isOverlayActive = activeSection === 'Pipeline' && (
    pipelineMode === 'Diagram' || pipelineMode === 'RasterVector'
  );

  return (
    <>
      {/* Keep the simulation canvas mounted to prevent WebGL context loss.
          We hide it visually and disable pointer events when an overlay is active.
      */}
      <VamsCanvas isHidden={isOverlayActive} />

      {/* Render pedagogical views as overlays on top of the canvas */}
      {activeSection === 'Pipeline' && (
        <>
          {pipelineMode === 'Diagram' && <PipelineDiagram />}
          {pipelineMode === 'RasterVector' && <RasterVectorView />}
        </>
      )}
    </>
  );
}