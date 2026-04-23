import './object-transform-panel.scss';
import { 
  Move, 
  RotateCw, 
  MoveHorizontal, 
  MoveVertical 
} from 'lucide-react';
import { useVamsStore } from "@/core/store";
import CollapsibleSection from '@/shared/ui/collapsible-section/CollapsibleSection';
import NumberInput from '@/shared/ui/number-input/NumberInput';

// Bespoke 3D-editor style scale icons (lines capped with bounding box handles)
const ScaleXIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12H4" />
    <rect width="4" height="4" x="2" y="10" rx="1" />
    <rect width="4" height="4" x="18" y="10" rx="1" />
  </svg>
);

const ScaleYIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20V4" />
    <rect width="4" height="4" x="10" y="2" rx="1" />
    <rect width="4" height="4" x="10" y="18" rx="1" />
  </svg>
);

export default function ObjectTransformPanel() {
  const { objects, selectedObjectId, updateObjectTransform, pushToHistory } = useVamsStore();
  const selectedObject = objects.find(o => o.id === selectedObjectId);

  if (!selectedObject) return null;

  const handleTransformChange = (update: Partial<typeof selectedObject.transform>) => {
    if (!selectedObjectId) return;
    pushToHistory();
    updateObjectTransform(selectedObjectId, update);
  };

  return (
    <CollapsibleSection title="Position & Size" icon={<Move size={14} />} defaultOpen={true}>
      <div className="input-stack">
        <NumberInput
          label="Move X"
          value={selectedObject.transform.translateX}
          onChange={(v) => handleTransformChange({ translateX: v })}
          icon={<MoveHorizontal size={14} />}
          step={1}
          precision={2}
        />
        <NumberInput
          label="Move Y"
          value={selectedObject.transform.translateY}
          onChange={(v) => handleTransformChange({ translateY: v })}
          icon={<MoveVertical size={14} />}
          step={1}
          precision={2}
        />
        <NumberInput
          label="Rotate (deg)"
          value={selectedObject.transform.rotate}
          onChange={(v) => handleTransformChange({ rotate: v })}
          icon={<RotateCw size={14} />}
          step={1}
          precision={2}
        />
        <div className="scale-row">
          <div className="scale-inputs">
            <NumberInput
              label="Scale X"
              value={selectedObject.transform.scaleX}
              onChange={(v) => handleTransformChange({ scaleX: v })}
              icon={<ScaleXIcon size={14} />}
              step={0.1}
              precision={2}
            />
            <NumberInput
              label="Scale Y"
              value={selectedObject.transform.scaleY}
              onChange={(v) => handleTransformChange({ scaleY: v })}
              icon={<ScaleYIcon size={14} />}
              step={0.1}
              precision={2}
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}