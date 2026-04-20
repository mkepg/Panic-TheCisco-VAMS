import './TopBar.scss';
import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import {
  Play, Square, Pause, Download, Settings, Sun, Moon,
  Save, FolderOpen, Code, FileJson, Package, Eye, EyeOff,
  FilePlus, Undo, Redo
} from 'lucide-react';
import { useVamsStore } from "@/stores";
import {
  buildProjectFile,
  createDefaultProjectFilename,
  downloadJSON,
  parseProjectFromFile,
  toStorePatchFromProject,
} from '@/project/projectIO';

export default function TopBar() {
  const {
    simulationState,
    play,
    pause,
    stop,
    axisVisibility,
    setAxisVisibility,
    showCoordinateTracker,
    setShowCoordinateTracker,
    theme,
    toggleTheme,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    setCanvasBackgroundColor
  } = useVamsStore();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isInputDisabled = simulationState === 'PLAYING' || simulationState === 'PAUSED';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (simulationState === 'PLAYING' || simulationState === 'PAUSED') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo()) {
          undo();
          toast.info('Undo');
        }
      }
      if (
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') ||
        (event.ctrlKey && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo()) {
          redo();
          toast.info('Redo');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, simulationState]);

  const hasWorkInProgress = () => {
    const state = useVamsStore.getState();
    const hasObjects = state.objects && state.objects.length > 0;
    const hasCustomBg = state.canvasBackgroundColor !== '#000000';
    const isBuildingShape = state.pendingShapeType !== null;
    return hasObjects || hasCustomBg || isBuildingShape;
  };

  const saveProjectToDownload = (filename?: string) => {
    try {
      const state = useVamsStore.getState();
      const projectFile = buildProjectFile(state);
      downloadJSON(filename ?? createDefaultProjectFilename(), projectFile);
      toast.success('Project saved (downloaded)');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save project');
    }
  };

  const handleExport = (type: 'html' | 'cpp' | 'json' | 'scaffold') => {
    if (type === 'json') {
      saveProjectToDownload();
      setShowExportMenu(false);
      return;
    }
    toast.info(`${type.toUpperCase()} export coming soon`);
    setShowExportMenu(false);
  };

  const handleSave = () => {
    saveProjectToDownload();
  };

  const handleLoad = () => {
    if (simulationState !== 'STOPPED') {
      toast.error('Stop the simulation before loading a project.');
      return;
    }
    if (hasWorkInProgress()) {
      const ok = window.confirm('Load a project? Unsaved changes will be lost.');
      if (!ok) return;
    }
    fileInputRef.current?.click();
  };

  const handleProjectFileSelected = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const projectData = await parseProjectFromFile(file);
      const patch = toStorePatchFromProject(projectData);
      useVamsStore.setState(
        {
          ...patch,
          simulationState: 'STOPPED',
          isGameOver: false,
          initialObjectStates: new Map(),
        },
        false
      );
      clearHistory();
      toast.success(`Project loaded: ${file.name}`);
    } catch (err) {
      console.error(err);
      toast.error('Invalid project file (could not load)');
    }
  };

  const handleNewCanvas = () => {
    const state = useVamsStore.getState();
    const hasObjects = state.objects && state.objects.length > 0;
    const hasCustomBg = state.canvasBackgroundColor !== '#000000';
    const isBuildingShape = state.pendingShapeType !== null;
    if (!hasObjects && !hasCustomBg && !isBuildingShape) {
      return;
    }
    if (window.confirm("Start a new canvas? Unsaved changes will be lost.")) {
      useVamsStore.setState({
        objects: [],
        selectedObjectId: null,
        pendingShapeType: null,
        pendingVertices: [],
        interactionMode: 'SELECT',
        creationMode: null,
        selectedVertexId: null,
        isVertexEditMode: false
      });
      setCanvasBackgroundColor('#000000');
      clearHistory();
      toast.success('New canvas created');
    }
  };

  const handleUndo = () => {
    if (canUndo()) {
      undo();
      toast.info('Undo');
    }
  };

  const handleRedo = () => {
    if (canRedo()) {
      redo();
      toast.info('Redo');
    }
  };

  return (
    <header className="top-bar">
      {/* Toaster */}
      <Toaster position="bottom-right" theme={theme === 'dark' ? 'dark' : 'light'} />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.vams,.vams.json,application/json"
        onChange={handleProjectFileSelected}
        style={{ display: 'none' }}
      />

      {/* Brand */}
      <div
        className="brand"
        style={{
          pointerEvents: isInputDisabled ? 'none' : 'auto',
          opacity: isInputDisabled ? 0.5 : 1,
          transition: 'opacity 0.2s ease-in-out'
        }}
      >
        <div className="logo-container">
          <h1>VAMS</h1>
        </div>
      </div>

      {/* Playback controls */}
      <div className="controls">
        <button
          onClick={simulationState === 'PLAYING' ? pause : play}
          className={`btn-play ${simulationState === 'PLAYING' ? 'running' : simulationState === 'PAUSED' ? 'paused' : 'stopped'}`}
          title={simulationState === 'PLAYING' ? 'Pause' : 'Play'}>
          {simulationState === 'PLAYING' ? (
            <Pause size={12} fill="currentColor"/>
          ) : (
            <Play size={12} fill="currentColor"/>
          )}
          {simulationState === 'PLAYING' ? 'PAUSE' : simulationState === 'PAUSED' ? 'RESUME' : 'RUN'}
        </button>
        <button
          onClick={stop}
          className="btn-stop"
          disabled={simulationState === 'STOPPED'}
          title="Stop & Reset">
          <Square size={12} fill="currentColor"/>
          STOP
        </button>
      </div>

      {/* Actions */}
      <div
        className="actions"
        style={{
          pointerEvents: isInputDisabled ? 'none' : 'auto',
          opacity: isInputDisabled ? 0.5 : 1,
          transition: 'opacity 0.2s ease-in-out'
        }}
      >
        {/* Undo / Redo */}
        <button
          className="icon-btn"
          onClick={handleUndo}
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
          style={{ opacity: canUndo() ? 1 : 0.5 }}>
          <Undo size={16} />
        </button>
        <button
          className="icon-btn"
          onClick={handleRedo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Shift+Z)"
          style={{ opacity: canRedo() ? 1 : 0.5 }}>
          <Redo size={16} />
        </button>
        <div className="separator"></div>

        {/* New canvas */}
        <button
          className="icon-btn"
          onClick={handleNewCanvas}
          title="New Canvas">
          <FilePlus size={16} />
        </button>

        {/* Save / Load */}
        <button
          className="icon-btn"
          onClick={handleSave}
          title="Save Project">
          <Save size={16} />
        </button>
        <button
          className="icon-btn"
          onClick={handleLoad}
          title="Load Project">
          <FolderOpen size={16} />
        </button>

        {/* Export */}
        <div className="dropdown-container" ref={exportMenuRef}>
          <button
            className="icon-btn"
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export Project">
            <Download size={16} />
          </button>
          {showExportMenu && (
            <div className="dropdown-menu">
              <div className="menu-header">Export As</div>
              <button
                className="menu-item"
                onClick={() => handleExport('html')}>
                <Code size={14} />
                Standalone HTML
              </button>
              <button
                className="menu-item"
                onClick={() => handleExport('cpp')}>
                <Code size={14} />
                C++ Code
              </button>
              <button
                className="menu-item"
                onClick={() => handleExport('json')}>
                <FileJson size={14} />
                JSON Scene Data
              </button>
              <button
                className="menu-item"
                onClick={() => handleExport('scaffold')}>
                <Package size={14} />
                C++ Project Scaffold
              </button>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title="Toggle Theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Settings (includes View Options) */}
        <div className="dropdown-container" ref={settingsMenuRef}>
          <button
            className="icon-btn"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            title="Settings">
            <Settings size={16} />
          </button>
          {showSettingsMenu && (
            <div className="dropdown-menu">
              <div className="menu-header">View</div>
              <button
                className="menu-item"
                onClick={() => {
                  setAxisVisibility({ ...axisVisibility, showOriginMarker: !axisVisibility.showOriginMarker });
                }}>
                {axisVisibility.showOriginMarker ? <Eye size={14} /> : <EyeOff size={14} />}
                Coordinate Axes
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  setAxisVisibility({ ...axisVisibility, showGridlines: !axisVisibility.showGridlines });
                }}>
                {axisVisibility.showGridlines ? <Eye size={14} /> : <EyeOff size={14} />}
                Gridlines
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  setShowCoordinateTracker(!showCoordinateTracker);
                }}>
                {showCoordinateTracker ? <Eye size={14} /> : <EyeOff size={14} />}
                Coordinate Tracker
              </button>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}