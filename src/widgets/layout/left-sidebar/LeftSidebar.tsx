import { useEffect, useState } from 'react';
import { Plus, BoxSelect } from 'lucide-react';
import { VscTypeHierarchySub, VscSymbolProperty } from 'react-icons/vsc';
import { useVamsStore } from '@/core/store';
import CustomShapeBuilderPanel from '@/features/custom-shapes/ui/CustomShapeBuilderPanel';
import TextNodePanel from '@/features/text-nodes/ui/TextNodePanel';
import SceneHierarchyPanel from '@/features/scene-hierarchy/ui/SceneHierarchyPanel';
import ObjectTransformPanel from '@/features/object-transform/ui/ObjectTransformPanel';
import ObjectAppearancePanel from '@/features/object-appearance/ui/ObjectAppearancePanel';
import './left-sidebar.scss';

type Tab = 'create' | 'scene' | 'edit';

export default function LeftSidebar() {
  const { selectedObjectId, objects } = useVamsStore();
  const selectedObject = objects.find((object) => object.id === selectedObjectId);

  const [activeTab, setActiveTab] = useState<Tab>(() =>
    selectedObjectId ? 'edit' : 'create'
  );

  useEffect(() => {
    if (!selectedObjectId) return;
    const timer = setTimeout(() => {
      setActiveTab((previous) => (previous === 'edit' ? previous : 'edit'));
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedObjectId]);

  return (
    <aside className="left-sidebar">
      <div className="sidebar-tabs">
        <SidebarTab
          label="Create"
          icon={<Plus size={16} />}
          isActive={activeTab === 'create'}
          onClick={() => setActiveTab('create')}
        />
        <SidebarTab
          label="Scene"
          icon={<VscTypeHierarchySub size={16} />}
          isActive={activeTab === 'scene'}
          onClick={() => setActiveTab('scene')}
        />
        <SidebarTab
          label="Properties"
          icon={<VscSymbolProperty size={16} />}
          isActive={activeTab === 'edit'}
          onClick={() => setActiveTab('edit')}
        />
      </div>

      <div className="sidebar-content">
        {activeTab === 'create' && (
          <div className="tab-pane">
            <CustomShapeBuilderPanel />
            <TextNodePanel />
          </div>
        )}

        {activeTab === 'scene' && (
          <div className="tab-pane">
            <SceneHierarchyPanel />
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="tab-pane">
            {selectedObject ? (
              <>
                <ObjectTransformPanel />
                <ObjectAppearancePanel />
              </>
            ) : (
              <div className="empty-selection-state">
                <BoxSelect size={40} className="empty-icon" strokeWidth={1.5} />
                <h4>No Node Selected</h4>
                <p>
                  Select a scene node from the Scene tab or click the canvas to
                  edit properties.
                </p>
                <div className="separator" />
                <div style={{ width: '100%', textAlign: 'left' }}>
                  <ObjectAppearancePanel />
                </div>
              </div>
            )}
          </div>
        )}
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
