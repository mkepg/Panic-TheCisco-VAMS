import './styles/app-shell.scss';
import TopBar from '@/widgets/layout/top-bar';
import LeftSidebar from '@/widgets/layout/left-sidebar';
import RightSidebar from '@/widgets/layout/right-sidebar';
import VamsCanvas from '@/widgets/canvas';
import { useVamsStore } from '@/core/store';

export default function App() {
  const { theme } = useVamsStore();
  return (
    <div className="app-container" data-theme={theme}>
      <TopBar />
      <div className="main-workspace">
        <LeftSidebar />
        <main className="canvas-area">
          <VamsCanvas />
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}