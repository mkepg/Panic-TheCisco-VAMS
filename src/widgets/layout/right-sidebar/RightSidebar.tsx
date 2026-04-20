import SceneCodePanel from '@/features/code-generation/ui/SceneCodePanel';
import './right-sidebar.scss';

export default function RightSidebar() {
  return (
    <aside className="right-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Program Output</span>
      </div>
      <div className="sidebar-content">
        <SceneCodePanel />
      </div>
    </aside>
  );
}
