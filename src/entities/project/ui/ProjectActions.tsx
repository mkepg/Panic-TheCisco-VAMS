import { useEffect, useRef, useState } from 'react';
import { Download, Save, FolderOpen, Code, FileJson, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useVamsStore } from '@/core/store';
import {
  buildProjectFile,
  createDefaultProjectFilename,
  downloadJSON,
  parseProjectFromFile,
  toStorePatchFromProject,
} from '@/entities/project/model/project-io';

export default function ProjectActions() {
  const clearHistory = useVamsStore((state) => state.clearHistory);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const hasWorkInProgress = () => {
    const state = useVamsStore.getState();
    const hasObjects = state.objects.length > 0;
    const hasCustomBackground = state.canvasBackgroundColor !== '#000000';
    const isBuildingShape = state.pendingShapeType !== null;
    return hasObjects || hasCustomBackground || isBuildingShape;
  };
  const saveProjectToDownload = (filename?: string) => {
    try {
      const state = useVamsStore.getState();
      const projectFile = buildProjectFile(state);
      downloadJSON(filename ?? createDefaultProjectFilename(), projectFile);
      toast.success('Project saved');
    } catch (error) {
      console.error(error);
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
  const handleLoad = () => {
    if (hasWorkInProgress()) {
      const shouldContinue = window.confirm(
        'Load a project? Unsaved changes will be lost.'
      );
      if (!shouldContinue) return;
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
        },
        false
      );

      const stateAfter = useVamsStore.getState();
      const knownIds = new Set(stateAfter.getAllTextures().map((t) => t.id));
      let detached = 0;
      const cleaned = stateAfter.objects.map((o) => {
        if (o.texture && !knownIds.has(o.texture.textureId)) {
          detached++;
          return { ...o, texture: null };
        }
        return o;
      });
      if (detached > 0) {
        useVamsStore.setState({ objects: cleaned });
        toast.message('Some textures could not be loaded and were detached.');
      }

      clearHistory();
      toast.success(`Project loaded: ${file.name}`);
    } catch (error) {
      console.error(error);
      toast.error('Invalid project file');
    }
  };
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.vams,.vams.json,application/json"
        onChange={handleProjectFileSelected}
        style={{ display: 'none' }}
      />
      <button className="icon-btn" onClick={() => saveProjectToDownload()} title="Save Project">
        <Save size={16} />
      </button>
      <button className="icon-btn" onClick={handleLoad} title="Load Project">
        <FolderOpen size={16} />
      </button>
      <div className="dropdown-container" ref={exportMenuRef}>
        <button
          className="icon-btn"
          onClick={() => setShowExportMenu((value) => !value)}
          title="Export Project"
        >
          <Download size={16} />
        </button>
        {showExportMenu && (
          <div className="dropdown-menu">
            <div className="menu-header">Export As</div>
            <button className="menu-item" onClick={() => handleExport('html')}>
              <Code size={14} /> Standalone HTML
            </button>
            <button className="menu-item" onClick={() => handleExport('cpp')}>
              <Code size={14} /> C++ Code
            </button>
            <button className="menu-item" onClick={() => handleExport('json')}>
              <FileJson size={14} /> JSON Scene Data
            </button>
            <button className="menu-item" onClick={() => handleExport('scaffold')}>
              <Package size={14} /> C++ Project Scaffold
            </button>
          </div>
        )}
      </div>
    </>
  );
}