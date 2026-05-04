import './math-panel.scss';
import { useVamsStore } from '@/core/store';
import PipelineMathContent from './PipelineMathContent';
import PrimitivesMathContent from './PrimitivesMathContent';
import BuffersMathContent from './BuffersMathContent';
import TransformsMathContent from './TransformsMathContent';
import TexturesMathContent from './TexturesMathContent';

export default function MathPanel() {
  const activeSection = useVamsStore((s) => s.activeSection);
  return (
    <div className="math-panel-container">
      <div className="math-header">
        <span className="math-title">Math &amp; Data</span>
        <span className="math-section-tag">{activeSection}</span>
      </div>
      <div className="math-content">
        {activeSection === 'Pipeline'   && <PipelineMathContent />}
        {activeSection === 'Primitives' && <PrimitivesMathContent />}
        {activeSection === 'Buffers'    && <BuffersMathContent />}
        {activeSection === 'Transforms' && <TransformsMathContent />}
        {activeSection === 'Textures'   && <TexturesMathContent />}
        {activeSection !== 'Pipeline' &&
         activeSection !== 'Primitives' &&
         activeSection !== 'Buffers' &&
         activeSection !== 'Transforms' &&
         activeSection !== 'Textures' && <DefaultEmpty />}
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