import { useMemo } from 'react';
import { useVamsStore } from "@/core/store";
import CodeViewer from '@/shared/ui/code-viewer/CodeViewer';
import { generateAppOutput } from '@/features/code-generation/model/code-generator';
import { useCanvasSize } from '@/features/code-generation/model/useCanvasSize';
import type { SceneNode } from "@/core/types/scene";
import { sanitizeName } from '@/features/code-generation/model/generator/utils';

function getEffectivelyVisibleObjects(objects: SceneNode[]): SceneNode[] {
  const byId = new Map(objects.map(o => [o.id, o]));
  const isEffectivelyHidden = (obj: SceneNode): boolean => {
    if (!obj.visible) return true;
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
  const selectedObjectId = useVamsStore(s => s.selectedObjectId);
  const canvasBackgroundColor = useVamsStore(s => s.canvasBackgroundColor);
  const appMode = useVamsStore(s => s.appMode);
  const canvasSize = useCanvasSize();

  const selectedObject = objects.find(o => o.id === selectedObjectId);
  const highlightTarget = selectedObject ? sanitizeName(selectedObject.name) : null;

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

  return (
    <CodeViewer 
      code={generatedCode} 
      highlightTarget={highlightTarget} 
      isLessonMode={appMode === 'Lesson'} 
    />
  );
}