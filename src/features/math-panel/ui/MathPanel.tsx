import './math-panel.scss';

export default function MathPanel() {
  return (
    <div className="math-panel-container">
      <div className="math-header">
        <span className="math-title">Math & Data</span>
      </div>
      <div className="math-content">
        <div className="empty-state">
          Select an object or view a lesson to see mathematical breakdowns here.
        </div>
      </div>
    </div>
  );
}