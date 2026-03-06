import { useMemo } from 'react';
import { useVamsStore } from "@/stores";
import CodeViewer from './helpers/CodeViewer';
import { generateAppOutput } from '../utils/codeGenerator';
import { useCanvasSize } from '../hooks/useCanvasSize';
import type { VamsObject } from "@/types";

export default function ActiveObjectLogic() {
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

    // Include the object and its visible subtree in the functions to declare
    const getVisibleSubtree = (parentId: string): VamsObject[] => {
      const children = objects.filter(o => o.parentId === parentId && o.isVisible);
      let subtree = [...children];
      children.forEach(c => {
        subtree = subtree.concat(getVisibleSubtree(c.id));
      });
      return subtree;
    };

    const objectsToDeclare = [object, ...getVisibleSubtree(object.id)];

    // Tell the renderer to only execute this specific active object block in the main draw() loop
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