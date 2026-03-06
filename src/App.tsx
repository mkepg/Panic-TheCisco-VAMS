// src/App.tsx
import './App.scss';
import TopBar from './components/layout/TopBar';
import LeftSidebar from './components/layout/LeftSidebar';
import RightSidebar from './components/layout/RightSidebar';
import CanvasWorkspace from './components/canvas/CanvasWorkspace';
import { useVamsStore } from './stores';

export default function App() {
  const { theme } = useVamsStore();

  return (
    <div className="app-container" data-theme={theme}>
      <TopBar />
      <div className="main-workspace">
        <LeftSidebar />
        <main className="canvas-area">
          <CanvasWorkspace />
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}