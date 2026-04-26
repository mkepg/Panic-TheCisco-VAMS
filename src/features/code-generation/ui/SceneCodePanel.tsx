import { useMemo } from 'react';
import { useVamsStore } from "@/core/store";
import CodeViewer from '@/shared/ui/code-viewer/CodeViewer';
import { generateAppOutput, type RegisteredCallback } from '@/features/code-generation/model/code-generator';
import { useCanvasSize } from '@/features/code-generation/model/useCanvasSize';
import type { SceneNode } from "@/core/types/scene";
import { sanitizeName } from '@/features/code-generation/model/generator/utils';
import { GLUT_BOILERPLATE_ANNOTATIONS } from '@/features/code-generation/model/glut-annotations';

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
  const activeSection = useVamsStore(s => s.activeSection);
  const callbacks = useVamsStore(s => s.callbacks);
  const canvasSize = useCanvasSize();

  const selectedObject = objects.find(o => o.id === selectedObjectId);
  const highlightTarget = selectedObject ? sanitizeName(selectedObject.name) : null;

  const registeredCallbacks: RegisteredCallback[] = useMemo(() => {
    return (Object.keys(callbacks) as Array<keyof typeof callbacks>)
      .filter((k) => callbacks[k] && callbacks[k].trim().length > 0)
      .map((k) => ({ kind: k, handlerName: callbacks[k].trim() }));
  }, [callbacks]);

  const generatedCode = useMemo(() => {
    if (objects.length === 0) {
      return generateAppOutput(
        [], [], [],
        canvasBackgroundColor, canvasSize,
        "    // Empty scene\n",
        registeredCallbacks
      );
    }
    const visibleObjects = getEffectivelyVisibleObjects(objects);
    const rootObjects = visibleObjects.filter(o => !o.parentId);
    return generateAppOutput(
      visibleObjects,
      rootObjects,
      visibleObjects,
      canvasBackgroundColor,
      canvasSize,
      "    // Empty scene\n",
      registeredCallbacks
    );
  }, [objects, canvasBackgroundColor, canvasSize, registeredCallbacks]);

  const showAnnotations = activeSection === 'Pipeline' && objects.length === 0;

  return (
    <CodeViewer
      code={generatedCode}
      highlightTarget={highlightTarget}
      isLessonMode={appMode === 'Lesson'}
      annotations={showAnnotations ? GLUT_BOILERPLATE_ANNOTATIONS : undefined}
    />
  );
}
