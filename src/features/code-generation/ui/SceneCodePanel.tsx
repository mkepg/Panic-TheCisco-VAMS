import { useMemo } from 'react';
import { useVamsStore } from "@/core/store";
import CodeViewer from '@/shared/ui/code-viewer/CodeViewer';
import { generateAppOutput } from '@/features/code-generation/model/code-generator';
import { useCanvasSize } from '@/features/code-generation/model/useCanvasSize';
import type { SceneNode } from "@/core/types/scene";
function getEffectivelyVisibleObjects(objects: SceneNode[]): SceneNode[] {
  const byId = new Map(objects.map(o => [o.id, o]));
  const isEffectivelyHidden = (obj: SceneNode): boolean => {
    if (!obj.isVisible) return true;
    if (obj.parentId) {
      const parent = byId.get(obj.parentId);
      if (parent && isEffectivelyHidden(parent)) return true;
    }
    return false;
  };
  return objects.filter(o => !isEffectivelyHidden(o));
}
export default function SceneCodePanel() {
  const objects = useVamsStore(s => s.objects);
  const canvasBackgroundColor = useVamsStore(s => s.canvasBackgroundColor);
  const canvasSize = useCanvasSize();
  const generatedCode = useMemo(() => {
    if (objects.length === 0) {
      return generateAppOutput([], [], [], canvasBackgroundColor, canvasSize);
    }
    const visibleObjects = getEffectivelyVisibleObjects(objects);
    const rootObjects = visibleObjects.filter(o => !o.parentId);
    return generateAppOutput(
      visibleObjects,
      rootObjects,
      visibleObjects,
      canvasBackgroundColor,
      canvasSize
    );
  }, [objects, canvasBackgroundColor, canvasSize]);
  return <CodeViewer code={generatedCode} />;
}