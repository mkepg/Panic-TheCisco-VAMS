import { useVamsStore } from '@/core/store';
import VamsCanvas from './VamsCanvas';
import PipelineDiagram from './views/PipelineDiagram';
import RasterVectorView from './views/RasterVectorView';
export default function ViewportRouter() {
  const activeSection = useVamsStore((state) => state.activeSection);
  const pipelineMode = useVamsStore((state) => state.pipelineMode);
  const isOverlayActive = activeSection === 'Pipeline' && (
    pipelineMode === 'Diagram' || pipelineMode === 'RasterVector'
  );
  return (
    <>
      {
}
      <VamsCanvas isHidden={isOverlayActive} />
      {}
      {activeSection === 'Pipeline' && (
        <>
          {pipelineMode === 'Diagram' && <PipelineDiagram />}
          {pipelineMode === 'RasterVector' && <RasterVectorView />}
        </>
      )}
    </>
  );
}