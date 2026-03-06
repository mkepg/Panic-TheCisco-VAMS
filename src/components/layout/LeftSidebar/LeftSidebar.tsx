import { useState, useEffect } from 'react';
import { Plus, BoxSelect } from 'lucide-react';
import { VscTypeHierarchySub, VscSymbolProperty } from "react-icons/vsc";
import './LeftSidebar.scss';
import { useVamsStore } from "@/stores";
import BuiltInShapes from './sections/BuiltInShapes';
import CustomShapes from './sections/CustomShapes';
import TextObjects from './sections/TextObjects';
import SceneHierarchy from './sections/SceneHierarchy';
import PositionAndSize from './sections/PositionAndSize';
import ColorControl from './sections/ColorControl';
import BehaviorControl from './sections/BehaviorControl';

type Tab = 'create' | 'scene' | 'edit';

export default function LeftSidebar() {
  const { selectedObjectId, objects, simulationState } = useVamsStore();
  const selectedObject = objects.find(o => o.id === selectedObjectId);
  const isInputDisabled = simulationState === 'PLAYING' || simulationState === 'PAUSED';

  const [activeTab, setActiveTab] = useState<Tab>(() => selectedObjectId ? 'edit' : 'create');

  useEffect(() => {
    if (selectedObjectId) {
      const timer = setTimeout(() => {
        setActiveTab(prev => (prev === 'edit' ? prev : 'edit'));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedObjectId]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <aside
      className="left-sidebar"
      style={{
        pointerEvents: isInputDisabled ? 'none' : 'auto',
        opacity: isInputDisabled ? 0.6 : 1,
        transition: 'opacity 0.2s ease-in-out'
      }}
    >
      {/* Fixed Tab Header */}
      <div className="sidebar-tabs">
        <TabButton
          label="Create"
          icon={<Plus size={16} />}
          isActive={activeTab === 'create'}
          onClick={() => handleTabChange('create')}
        />
        <TabButton
          label="Scene"
          icon={<VscTypeHierarchySub size={16} />}
          isActive={activeTab === 'scene'}
          onClick={() => handleTabChange('scene')}
        />
        <TabButton
          label="Properties"
          icon={<VscSymbolProperty size={16} />}
          isActive={activeTab === 'edit'}
          onClick={() => handleTabChange('edit')}
        />
      </div>

      {/* Scrollable Content Area */}
      <div className="sidebar-content">
        
        {/* CREATE TAB */}
        {activeTab === 'create' && (
          <div className="tab-pane">
            <BuiltInShapes />
            <CustomShapes />
            <TextObjects />
          </div>
        )}

        {/* SCENE TAB */}
        {activeTab === 'scene' && (
          <div className="tab-pane">
            <SceneHierarchy />
          </div>
        )}

        {/* EDIT/PROPERTIES TAB */}
        {activeTab === 'edit' && (
          <div className="tab-pane">
            {selectedObject ? (
              <>
                <PositionAndSize />
                <ColorControl />
                <BehaviorControl />
              </>
            ) : (
              <div className="empty-selection-state">
                <BoxSelect size={40} className="empty-icon" strokeWidth={1.5} />
                <h4>No Object Selected</h4>
                <p>Select an object from the Scene tab or click on the canvas to edit properties.</p>
                
                <div className="separator" />
                
                {/* ColorControl handles the "Canvas Settings" UI internally
                  when no object is selected. We render it here to allow
                  global settings access.
                */}
                <div style={{ width: '100%', textAlign: 'left' }}>
                  <ColorControl />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

// ------------------------------------------------------------------
// Internal Components
// ------------------------------------------------------------------

interface TabButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, icon, isActive, onClick }: TabButtonProps) {
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