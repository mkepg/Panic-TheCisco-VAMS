import { useState } from 'react';
import { TbCodePlus, TbCodeAsterisk } from "react-icons/tb";
import './RightSidebar.scss';
import ActiveObjectLogic from './sections/ActiveObjectLogic';
import SceneLogic from './sections/SceneLogic';

type Tab = 'active' | 'scene';

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

export default function RightSidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('active');

  return (
    <aside className="right-sidebar">
      <div className="sidebar-tabs">
        <TabButton
          label="Target Object"
          icon={<TbCodePlus size={16} />}
          isActive={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
        />
        <TabButton
          label="Program Output"
          icon={<TbCodeAsterisk size={16} />}
          isActive={activeTab === 'scene'}
          onClick={() => setActiveTab('scene')}
        />
      </div>

      <div className="sidebar-content">
        {activeTab === 'active' && <ActiveObjectLogic />}
        {activeTab === 'scene' && <SceneLogic />}
      </div>
    </aside>
  );
}