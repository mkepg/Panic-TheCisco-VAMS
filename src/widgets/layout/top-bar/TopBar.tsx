import { Toaster } from 'sonner';
import { useVamsStore } from '@/core/store';
import HistoryControls from '@/features/history-controls/ui/HistoryControls';
import ProjectActions from '@/features/project-io/ui/ProjectActions';
import NewWorkspaceButton from '@/features/workspace-reset/ui/NewWorkspaceButton';
import ThemeToggleButton from '@/features/theme-toggle/ui/ThemeToggleButton';
import EditorPreferencesMenu from '@/features/editor-preferences/ui/EditorPreferencesMenu';
import { Play } from 'lucide-react'; // <-- Add Play icon
import './top-bar.scss';

export default function TopBar() {
  const theme = useVamsStore((state) => state.theme);
  
  // --- ADD THESE ---
  const setActiveLesson = useVamsStore((state) => state.setActiveLesson);
  const setAppMode = useVamsStore((state) => state.setAppMode);

  const startTestDemo = () => {
    setActiveLesson('poc-demo-1');
    setAppMode('Lesson');
  };

  return (
    <header className="top-bar">
      <Toaster position="bottom-right" theme={theme === 'dark' ? 'dark' : 'light'} />
      <div className="brand">
        <div className="logo-container">
          <h1>VAMS</h1>
        </div>
        {/* --- TEMPORARY TEST BUTTON --- */}
        <button 
          onClick={startTestDemo} 
          style={{ 
            marginLeft: '20px', padding: '4px 12px', background: 'rgba(37, 99, 235, 0.2)', 
            border: '1px solid #2563eb', color: '#60a5fa', borderRadius: '4px', 
            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' 
          }}
        >
          <Play size={14} /> Start POC Demo
        </button>
      </div>
      <div className="actions">
        <HistoryControls />
        <div className="separator" />
        <NewWorkspaceButton />
        <ProjectActions />
        <ThemeToggleButton />
        <EditorPreferencesMenu />
      </div>
    </header>
  );
}