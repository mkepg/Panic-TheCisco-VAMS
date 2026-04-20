import { useMemo } from 'react';
import { useVamsStore } from "@/core/store";
import CodeViewer from '@/shared/ui/code-viewer/CodeViewer';
import { generateAppOutput } from '@/features/code-generation/model/code-generator';
import { useCanvasSize } from '@/features/code-generation/model/useCanvasSize';
import type { SceneNode } from "@/core/types/scene";
export default function ActiveNodeCodePanel() {
  const selectedId = useVamsStore(s => s.selectedObjectId);
  const objects = useVamsStore(s => s.objects);
  const canvasBackgroundColor = useVamsStore(s => s.canvasBackgroundColor);
  const canvasSize = useCanvasSize();
  const generatedCode = useMemo(() => {
    const object = objects.find(o => o.id === selectedId);
    if (!object) {
      return generateAppOutput(
        [],
        [],
        objects,
        canvasBackgroundColor,
        canvasSize,
        "    // No active object selected.\n    // Click on an object to view its code.\n"
      );
    }
    const getVisibleSubtree = (parentId: string): SceneNode[] => {
      const children = objects.filter(o => o.parentId === parentId && o.isVisible);
      let subtree = [...children];
      children.forEach(c => {
        subtree = subtree.concat(getVisibleSubtree(c.id));
      });
      return subtree;
    };
    const objectsToDeclare = [object, ...getVisibleSubtree(object.id)];
    return generateAppOutput(
      objectsToDeclare,
      [object],
      objects,
      canvasBackgroundColor,
      canvasSize
    );
  }, [selectedId, objects, canvasBackgroundColor, canvasSize]);
  return <CodeViewer code={generatedCode} />;
}