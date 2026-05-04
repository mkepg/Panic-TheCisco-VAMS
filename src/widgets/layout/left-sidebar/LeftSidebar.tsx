import { GitCommit, Shapes, Database, Move3d, Image as ImageIcon } from 'lucide-react';
import { useVamsStore } from '@/core/store';
import type { CurriculumSection } from '@/core/store/types';
import PipelineModeControls from '@/features/pipeline-controls/ui/PipelineModeControls';
import CustomShapeBuilderPanel from '@/features/custom-shapes/ui/CustomShapeBuilderPanel';
import TextNodePanel from '@/features/text-nodes/ui/TextNodePanel';
import SceneHierarchyPanel from '@/features/scene-hierarchy/ui/SceneHierarchyPanel';
import ObjectTransformPanel from '@/features/object-transform/ui/ObjectTransformPanel';
import ObjectAppearancePanel from '@/features/object-appearance/ui/ObjectAppearancePanel';
import LineStylePanel from '@/features/line-style/ui/LineStylePanel';
import CallbacksPanel from '@/features/callbacks/ui/CallbacksPanel';
import BuffersPanel from '@/features/buffers/ui/BuffersPanel';
import OrthoEditorPanel from '@/features/ortho-editor/ui/OrthoEditorPanel';
import TextureLibraryPanel from '@/features/textures/ui/TextureLibraryPanel';
import TextureAttachmentPanel from '@/features/textures/ui/TextureAttachmentPanel';
import UVEditorPanel from '@/features/textures/ui/UVEditorPanel';
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
            <PipelineModeControls />
            <div className="separator" />
            <SceneHierarchyPanel />
            {!selectedObject && <ObjectAppearancePanel />}
          </div>
        );
      case 'Primitives':
        return (
          <div className="tab-pane">
            <SceneHierarchyPanel />
            <div className="separator" />
            <CustomShapeBuilderPanel />
            <TextNodePanel />
            <div className="separator" />
            <ObjectAppearancePanel />
            <LineStylePanel />
            <div className="separator" />
            <CallbacksPanel />
          </div>
        );
      case 'Buffers':
        return (
          <div className="tab-pane">
            <SceneHierarchyPanel />
            <div className="separator" />
            <CustomShapeBuilderPanel />
            <div className="separator" />
            <BuffersPanel />
          </div>
        );
      case 'Transforms':
        return (
          <div className="tab-pane">
            <SceneHierarchyPanel />
            {selectedObject && <ObjectTransformPanel />}
            <OrthoEditorPanel />
          </div>
        );
      case 'Textures':
        return (
          <div className="tab-pane">
            <SceneHierarchyPanel />
            <div className="separator" />
            <CustomShapeBuilderPanel />
            <div className="separator" />
            <TextureLibraryPanel />
            <TextureAttachmentPanel />
            <UVEditorPanel />
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