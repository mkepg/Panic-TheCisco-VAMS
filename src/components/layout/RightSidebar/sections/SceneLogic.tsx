import { useMemo } from 'react';
import { useVamsStore } from "@/stores";
import CodeViewer from './helpers/CodeViewer';
import { generateAppOutput } from '../utils/codeGenerator';
import { useCanvasSize } from '../hooks/useCanvasSize';

export default function SceneLogic() {
  const objects = useVamsStore(s => s.objects);
  const canvasBackgroundColor = useVamsStore(s => s.canvasBackgroundColor);
  const canvasSize = useCanvasSize();

  const generatedCode = useMemo(() => {
    if (objects.length === 0) {
      return generateAppOutput([], [], objects, canvasBackgroundColor, canvasSize);
    }

    const visibleObjects = objects.filter(o => o.isVisible);
    // Root objects are objects without a parent
    const rootObjects = visibleObjects.filter(o => !o.parentId);

    return generateAppOutput(
      visibleObjects, 
      rootObjects, 
      objects, 
      canvasBackgroundColor, 
      canvasSize
    );
  }, [objects, canvasBackgroundColor, canvasSize]);

  return <CodeViewer code={generatedCode} />;
}