import { useMemo } from 'react';
import { useVamsStore } from "@/core/store";
import CodeViewer from '@/shared/ui/code-viewer/CodeViewer';
import { useCanvasSize } from '@/features/code-generation/model/useCanvasSize';
import { generateCodeFromState } from '@/features/code-generation/model/generate-from-state';
import { sanitizeName } from '@/features/code-generation/model/generator/utils';
import { GLUT_BOILERPLATE_ANNOTATIONS } from '@/features/code-generation/model/glut-annotations';

export default function SceneCodePanel() {
  const objects = useVamsStore(s => s.objects);
  const selectedObjectId = useVamsStore(s => s.selectedObjectId);
  const canvasBackgroundColor = useVamsStore(s => s.canvasBackgroundColor);
  const appMode = useVamsStore(s => s.appMode);
  const activeSection = useVamsStore(s => s.activeSection);
  const callbacks = useVamsStore(s => s.callbacks);
  const changedCodeLines = useVamsStore(s => s.changedCodeLines);
  const viewportLimits = useVamsStore(s => s.viewportLimits);
  const canvasSize = useCanvasSize();

  const selectedObject = objects.find(o => o.id === selectedObjectId);
  const highlightTarget = selectedObject ? sanitizeName(selectedObject.name) : null;

  const generatedCode = useMemo(
    () => generateCodeFromState(
      { objects, canvasBackgroundColor, callbacks, viewportLimits },
      canvasSize,
    ),
    [objects, canvasBackgroundColor, callbacks, canvasSize, viewportLimits],
  );

  const showAnnotations = activeSection === 'Pipeline' && objects.length === 0;
  const isLessonMode = appMode === 'Lesson';

  // Change-highlights are intentionally lesson-only. Author Mode keeps the
  // existing blue-only behavior.
  const changedLines = isLessonMode ? changedCodeLines : undefined;

  return (
    <CodeViewer
      code={generatedCode}
      highlightTarget={highlightTarget}
      isLessonMode={isLessonMode}
      annotations={showAnnotations ? GLUT_BOILERPLATE_ANNOTATIONS : undefined}
      changedLines={changedLines}
    />
  );
}
