import './pipeline-mode-controls.scss';
import { LayoutTemplate, MonitorPlay, Component } from 'lucide-react';
import { useVamsStore } from '@/core/store';
import CollapsibleSection from '@/shared/ui/collapsible-section/CollapsibleSection';

export default function PipelineModeControls() {
  const pipelineMode = useVamsStore(s => s.pipelineMode);
  const setPipelineMode = useVamsStore(s => s.setPipelineMode);

  return (
    <CollapsibleSection title="Viewport Mode" icon={<MonitorPlay size={14} />} defaultOpen={true}>
      <div className="mode-controls-grid">
        <button
          className={`mode-btn ${pipelineMode === 'Playground' ? 'active' : ''}`}
          onClick={() => setPipelineMode('Playground')}
        >
          <Component size={16} />
          <span>Coordinate Playground</span>
        </button>
        <button
          className={`mode-btn ${pipelineMode === 'Diagram' ? 'active' : ''}`}
          onClick={() => setPipelineMode('Diagram')}
        >
          <LayoutTemplate size={16} />
          <span>Pipeline Diagram</span>
        </button>
        <button
          className={`mode-btn ${pipelineMode === 'RasterVector' ? 'active' : ''}`}
          onClick={() => setPipelineMode('RasterVector')}
        >
          <MonitorPlay size={16} />
          <span>Raster vs. Vector</span>
        </button>
      </div>
    </CollapsibleSection>
  );
}