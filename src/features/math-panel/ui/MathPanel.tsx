import './math-panel.scss';
import { useVamsStore } from '@/core/store';
import PipelineMathContent from './PipelineMathContent';

export default function MathPanel() {
  const activeSection = useVamsStore((s) => s.activeSection);

  return (
    <div className="math-panel-container">
      <div className="math-header">
        <span className="math-title">Math &amp; Data</span>
        <span className="math-section-tag">{activeSection}</span>
      </div>
      <div className="math-content">
        {activeSection === 'Pipeline' ? <PipelineMathContent /> : <DefaultEmpty />}
      </div>
    </div>
  );
}

function DefaultEmpty() {
  return (
    <div className="empty-state">
      Select an object or run a lesson to see contextual math here.
    </div>
  );
}
