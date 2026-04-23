import SceneCodePanel from '@/features/code-generation/ui/SceneCodePanel';
import MathPanel from '@/features/math-panel/ui/MathPanel';
import './right-sidebar.scss';

export default function RightSidebar() {
  return (
    <aside className="right-sidebar">
      {/* CHANGED: Use a unique class name to escape the left-sidebar.scss leak */}
      <div className="right-sidebar-content">
        <div className="panel-top">
          <SceneCodePanel />
        </div>
        <div className="panel-bottom">
          <MathPanel />
        </div>
      </div>
    </aside>
  );
}