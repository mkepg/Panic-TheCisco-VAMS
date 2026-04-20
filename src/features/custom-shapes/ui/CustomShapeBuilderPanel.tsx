import './custom-shape-builder-panel.scss';
import React from 'react';
import { Edit3, X, Plus, Minus, MousePointer, Trash2 } from 'lucide-react';
import { MdShowChart } from "react-icons/md";
import { TbTriangles, TbHexagons } from "react-icons/tb";
import { CirclePile } from 'lucide-react';
import type { PrimitiveType } from "@/core/types/scene";
import { useVamsStore } from "@/core/store";
import CollapsibleSection from '@/shared/ui/collapsible-section/CollapsibleSection';
interface ShapeDefinition {
  type: PrimitiveType;
  icon: React.ReactNode;
  label: string;
  minVertices: number;
}
const SHAPE_DEFS: ShapeDefinition[] = [
  { type: 'POINTS',       icon: <CirclePile size={18} />,   label: 'Points',      minVertices: 1 },
  { type: 'LINE_STRIP',       icon: <MdShowChart size={18} />,  label: 'Line Strip',      minVertices: 2 },
  { type: 'POLYGON',         icon: <TbHexagons size={18} />,   label: 'Polygon',        minVertices: 3 },
  { type: 'TRIANGLE_STRIP',  icon: <TbTriangles size={18} />,  label: 'Triangle Strip', minVertices: 3 },
];
export default function CustomShapeBuilderPanel() {
  const pendingShapeType   = useVamsStore((s) => s.pendingShapeType);
  const pendingVertices    = useVamsStore((s) => s.pendingVertices);
  const pendingMinVertices = useVamsStore((s) => s.pendingMinVertices);
  const interactionMode    = useVamsStore((s) => s.interactionMode);
  const startCustomShape        = useVamsStore((s) => s.startCustomShape);
  const cancelCustomShape       = useVamsStore((s) => s.cancelCustomShape);
  const addManualVertex         = useVamsStore((s) => s.addManualVertex);
  const removeLastPendingVertex = useVamsStore((s) => s.removeLastPendingVertex);
  const removePendingVertexAt   = useVamsStore((s) => s.removePendingVertexAt);
  const updatePendingVertex     = useVamsStore((s) => s.updatePendingVertex);
  const addCustomObject         = useVamsStore((s) => s.addCustomObject);
  const isPlacing = interactionMode === 'CUSTOM_SHAPE_PLACE';
  const activeDef = SHAPE_DEFS.find((d) => d.type === pendingShapeType);
  const canCreate = pendingVertices.length >= pendingMinVertices;
  const handleCreate = () => {
    if (!pendingShapeType || !canCreate) return;
    addCustomObject(pendingShapeType, pendingVertices);
  };
  const handleCoordChange = (index: number, axis: 'x' | 'y', raw: string) => {
    const num = parseFloat(raw);
    const val = isNaN(num) ? 0 : num;
    const v = pendingVertices[index];
    updatePendingVertex(index, axis === 'x' ? val : v.x, axis === 'y' ? val : v.y);
  };
  if (!pendingShapeType) {
    return (
      <CollapsibleSection title="Custom Shapes" icon={<Edit3 size={12} />} defaultOpen={true}>
        <div className="grid-buttons">
          {SHAPE_DEFS.map((def) => (
            <button
              key={def.type}
              onClick={() => startCustomShape(def.type, def.minVertices)}
              className="create-btn"
              title={`Create ${def.label}`}
            >
              {def.icon}
              <span>{def.label}</span>
            </button>
          ))}
        </div>
      </CollapsibleSection>
    );
  }
  return (
    <CollapsibleSection title="Custom Shapes" icon={<Edit3 size={12} />} defaultOpen={true}>
      <div className="vertex-shape-builder">
        {}
        <div className="control-row header">
          <span className="shape-label">{activeDef?.label}</span>
          <button onClick={cancelCustomShape} className="icon-btn-ghost" title="Cancel">
            <X size={16} />
          </button>
        </div>
        {}
        <div className={`placement-hint ${isPlacing ? 'active' : ''}`}>
          <MousePointer size={13} className="hint-icon" />
          <span>
            {isPlacing
              ? 'Click on the canvas to place vertices'
              : 'Click on the canvas or type coords below'}
          </span>
        </div>
        {}
        <div className="vertex-list">
          {pendingVertices.length === 0 && (
            <div className="vertex-empty-msg">No vertices yet — click the canvas or add one below</div>
          )}
          {pendingVertices.map((v, i) => (
            <div key={i} className="vertex-row">
              <span className="vertex-index">V{i}</span>
              <div className="coord-input-group">
                <span className="coord-label">X</span>
                <input
                  type="number"
                  value={v.x}
                  onChange={(e) => handleCoordChange(i, 'x', e.currentTarget.value)}
                  placeholder="0.0"
                  step="0.1"
                  className="vertex-coord-input"
                />
              </div>
              <div className="coord-input-group">
                <span className="coord-label">Y</span>
                <input
                  type="number"
                  value={v.y}
                  onChange={(e) => handleCoordChange(i, 'y', e.currentTarget.value)}
                  placeholder="0.0"
                  step="0.1"
                  className="vertex-coord-input"
                />
              </div>
              {}
              <button
                className="icon-btn-ghost vertex-delete"
                onClick={() => removePendingVertexAt(i)}
                disabled={pendingVertices.length <= pendingMinVertices}
                title="Remove vertex"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        {}
        <div className="vertex-count-status">
          <span className={`count-badge ${canCreate ? 'sufficient' : 'insufficient'}`}>
            {pendingVertices.length} / {pendingMinVertices} min
          </span>
        </div>
        {}
        <div className="vertex-tools">
          <button
            onClick={addManualVertex}
            className="tool-btn"
          >
            <Plus size={14} /> <span>Add Vertex</span>
          </button>
          <button
            onClick={removeLastPendingVertex}
            disabled={pendingVertices.length === 0}
            className="tool-btn"
          >
            <Minus size={14} /> <span>Remove Last</span>
          </button>
        </div>
        {}
        <div className="vertex-input-actions">
          <button onClick={cancelCustomShape} className="action-btn cancel-btn">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="action-btn create-btn-primary"
          >
            Create Shape
          </button>
        </div>
      </div>
    </CollapsibleSection>
  );
}