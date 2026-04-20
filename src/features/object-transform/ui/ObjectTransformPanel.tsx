import './object-transform-panel.scss';
import { Move, RotateCw } from 'lucide-react';
import { IoMdResize } from "react-icons/io";
import { useVamsStore } from "@/core/store";
import CollapsibleSection from '@/shared/ui/collapsible-section/CollapsibleSection';
import NumberInput from '@/shared/ui/number-input/NumberInput';
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
          icon="X"
          iconClass="icon-red"
          step={1}
          precision={2}
        />
        <NumberInput
          label="Move Y"
          value={selectedObject.transform.translateY}
          onChange={(v) => handleTransformChange({ translateY: v })}
          icon="Y"
          iconClass="icon-green"
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
        <NumberInput
          label="Resize"
          value={selectedObject.transform.scale}
          onChange={(v) => handleTransformChange({ scale: v })}
          icon={<IoMdResize size={14} />}
          step={0.1}
          precision={2}
        />
      </div>
    </CollapsibleSection>
  );
}