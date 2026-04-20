import './built-in-shapes-panel.scss';
import React from 'react';
import { CircleSmall, Circle, Square, Triangle, Star, Plus, Minus } from 'lucide-react';
import { MdOutlineHexagon } from "react-icons/md";
import { useVamsStore } from "@/core/store";
import type { PrimitiveType } from "@/core/types/scene";
import CollapsibleSection from '@/shared/ui/collapsible-section/CollapsibleSection';
export default function BuiltInShapesPanel() {
  const { addObject } = useVamsStore();
  const primitives: {type: PrimitiveType, icon: React.ReactNode, label: string}[] = [
    { type: 'POINT', icon: <CircleSmall size={18} />, label: 'Point' },
    { type: 'LINE', icon: <Minus size={20} />, label: 'Line' },
    { type: 'TRIANGLE', icon: <Triangle size={18} />, label: 'Triangle' },
    { type: 'RECTANGLE', icon: <Square size={18} />, label: 'Rectangle' },
    { type: 'CIRCLE', icon: <Circle size={18} />, label: 'Circle' },
    { type: 'ELLIPSE', icon: <Circle size={18} style={{transform: 'scaleX(1.4)'}} />, label: 'Ellipse' },
    { type: 'HEXAGON', icon: <MdOutlineHexagon size={18} />, label: 'Hexagon' },
    { type: 'STAR', icon: <Star size={18} />, label: 'Star' },
  ];
  return (
    <CollapsibleSection title="Built-In Shapes" icon={<Plus size={14} />} defaultOpen={true}>
      <div className="grid-buttons">
        {primitives.map((prim) => (
          <button
            key={prim.type}
            onClick={() => addObject(prim.type)}
            className="create-btn"
            title={`Create ${prim.label}`}>
            {prim.icon}
            <span>{prim.label}</span>
          </button>
        ))}
      </div>
    </CollapsibleSection>
  );
}