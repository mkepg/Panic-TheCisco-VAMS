import './RightSidebar.scss';
import SceneLogic from './sections/SceneLogic';

export default function RightSidebar() {
  return (
    <aside className="right-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Program Output</span>
      </div>
      <div className="sidebar-content">
        <SceneLogic />
      </div>
    </aside>
  );
}
