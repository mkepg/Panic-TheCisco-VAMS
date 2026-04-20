import { useMemo } from 'react';
import { useVamsStore } from "@/stores";
import CodeViewer from './helpers/CodeViewer';
import { generateAppOutput } from '../utils/codeGenerator';
import { useCanvasSize } from '../hooks/useCanvasSize';
import type { VamsObject } from "@/types";

/** Collect the effective visible set, propagating group hide to all descendants. */
function getEffectivelyVisibleObjects(objects: VamsObject[]): VamsObject[] {
  // Build a quick lookup
  const byId = new Map(objects.map(o => [o.id, o]));

  // Determine which objects are effectively hidden due to an ancestor group being hidden
  const isEffectivelyHidden = (obj: VamsObject): boolean => {
    if (!obj.isVisible) return true;
    if (obj.parentId) {
      const parent = byId.get(obj.parentId);
      if (parent && isEffectivelyHidden(parent)) return true;
    }
    return false;
  };

  return objects.filter(o => !isEffectivelyHidden(o));
}

export default function SceneLogic() {
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
      visibleObjects,   // visible set only — hidden objects produce no state globals
      canvasBackgroundColor,
      canvasSize
    );
  }, [objects, canvasBackgroundColor, canvasSize]);

  return <CodeViewer code={generatedCode} />;
}
