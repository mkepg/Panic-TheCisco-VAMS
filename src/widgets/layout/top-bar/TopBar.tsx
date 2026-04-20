import { Toaster } from 'sonner';
import { useVamsStore } from '@/core/store';
import RuntimeControls from '@/features/runtime-controls/ui/RuntimeControls';
import HistoryControls from '@/features/history-controls/ui/HistoryControls';
import ProjectActions from '@/features/project-io/ui/ProjectActions';
import NewWorkspaceButton from '@/features/workspace-reset/ui/NewWorkspaceButton';
import ThemeToggleButton from '@/features/theme-toggle/ui/ThemeToggleButton';
import EditorPreferencesMenu from '@/features/editor-preferences/ui/EditorPreferencesMenu';
import './top-bar.scss';

export default function TopBar() {
  const simulationState = useVamsStore((state) => state.simulationState);
  const theme = useVamsStore((state) => state.theme);

  const isInputDisabled =
    simulationState === 'PLAYING' || simulationState === 'PAUSED';

  return (
    <header className="top-bar">
      <Toaster position="bottom-right" theme={theme === 'dark' ? 'dark' : 'light'} />

      <div
        className="brand"
        style={{
          pointerEvents: isInputDisabled ? 'none' : 'auto',
          opacity: isInputDisabled ? 0.5 : 1,
          transition: 'opacity 0.2s ease-in-out',
        }}
      >
        <div className="logo-container">
          <h1>VAMS</h1>
        </div>
      </div>

      <RuntimeControls />

      <div
        className="actions"
        style={{
          pointerEvents: isInputDisabled ? 'none' : 'auto',
          opacity: isInputDisabled ? 0.5 : 1,
          transition: 'opacity 0.2s ease-in-out',
        }}
      >
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