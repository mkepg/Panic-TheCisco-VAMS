import { GitCommit, Shapes, Database, Move3d, Image as ImageIcon, BoxSelect } from 'lucide-react';
import { useVamsStore } from '@/core/store';
import type { CurriculumSection } from '@/core/store/types';

import CustomShapeBuilderPanel from '@/features/custom-shapes/ui/CustomShapeBuilderPanel';
import TextNodePanel from '@/features/text-nodes/ui/TextNodePanel';
import SceneHierarchyPanel from '@/features/scene-hierarchy/ui/SceneHierarchyPanel';
import ObjectTransformPanel from '@/features/object-transform/ui/ObjectTransformPanel';
import ObjectAppearancePanel from '@/features/object-appearance/ui/ObjectAppearancePanel';

import './left-sidebar.scss';

export default function LeftSidebar() {
  const { 
    activeSection, 
    setActiveSection, 
    selectedObjectId, 
    objects,
    appMode,
    setAppMode,
    clearLessonState
  } = useVamsStore();
  
  const selectedObject = objects.find((object) => object.id === selectedObjectId);

  const handleTabClick = (section: CurriculumSection) => {
    if (activeSection === section) return;
    if (appMode === 'Lesson') {
      const confirmLeave = window.confirm('Leave current lesson? Progress will be lost.');
      if (confirmLeave) {
        clearLessonState();
        setAppMode('Author');
        setActiveSection(section);
      }
    } else {
      setActiveSection(section);
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'Pipeline':
        return (
          <div className="tab-pane">
            <SceneHierarchyPanel />
            {!selectedObject && <ObjectAppearancePanel />}
          </div>
        );
      case 'Primitives':
        return (
          <div className="tab-pane">
            {/* 1. ANCHOR: The Hierarchy tells us what we have */}
            <SceneHierarchyPanel />
            
            <div className="separator" />

            {/* 2. ACTIONS: The tools to make more things */}
            <CustomShapeBuilderPanel />
            <TextNodePanel />

            <div className="separator" />

            {/* 3. PROPERTIES: The details of the selection (or canvas) */}
            <ObjectAppearancePanel />
          </div>
        );
      case 'Buffers':
        return (
          <div className="tab-pane">
            <SceneHierarchyPanel />
          </div>
        );
      case 'Transforms':
        return (
          <div className="tab-pane">
            <SceneHierarchyPanel />
            {selectedObject ? <ObjectTransformPanel /> : <EmptySelectionState />}
          </div>
        );
      case 'Textures':
        return (
          <div className="tab-pane">
            <SceneHierarchyPanel />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="left-sidebar">
      <div className="sidebar-tabs">
        <SidebarTab label="Pipe" icon={<GitCommit size={16} />} isActive={activeSection === 'Pipeline'} onClick={() => handleTabClick('Pipeline')} />
        <SidebarTab label="Prims" icon={<Shapes size={16} />} isActive={activeSection === 'Primitives'} onClick={() => handleTabClick('Primitives')} />
        <SidebarTab label="Bufs" icon={<Database size={16} />} isActive={activeSection === 'Buffers'} onClick={() => handleTabClick('Buffers')} />
        <SidebarTab label="Trans" icon={<Move3d size={16} />} isActive={activeSection === 'Transforms'} onClick={() => handleTabClick('Transforms')} />
        <SidebarTab label="Texs" icon={<ImageIcon size={16} />} isActive={activeSection === 'Textures'} onClick={() => handleTabClick('Textures')} />
      </div>
      <div className="sidebar-content">
        {renderSectionContent()}
      </div>
    </aside>
  );
}

type SidebarTabProps = {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
};

function SidebarTab({ label, icon, isActive, onClick }: SidebarTabProps) {
  return (
    <button
      className={`tab-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
      type="button"
      title={label}
    >
      <span className="tab-icon">{icon}</span>
      <span className="tab-label">{label}</span>
    </button>
  );
}

function EmptySelectionState() {
  return (
    <div className="empty-selection-state">
      <BoxSelect size={40} className="empty-icon" strokeWidth={1.5} />
      <h4>No Node Selected</h4>
      <p>Select a scene node from the hierarchy to edit properties.</p>
      <div className="separator" />
    </div>
  );
}