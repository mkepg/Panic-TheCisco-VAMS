import { useRef, useState } from 'react';
import { useVamsStore } from '@/core/store';
import { usePixiApp } from '@/shared/engine/pixi/hooks/usePixiApp';
import { useCanvasInteraction } from '@/features/scene-interaction/model/useCanvasInteraction';
import { useSceneRenderer } from '@/shared/engine/pixi/hooks/useSceneRenderer';
import { useCustomShapePreview } from '@/features/custom-shapes/model/useCustomShapePreview';
import { useGridSystem } from '@/shared/engine/pixi/hooks/useGridSystem';
import { CanvasOverlays } from './ui/CanvasOverlays';
import './vams-canvas.scss';

interface VamsCanvasProps {
  isHidden?: boolean;
}

export default function VamsCanvas({ isHidden = false }: VamsCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
  const viewportLimits = useVamsStore((state) => state.viewportLimits);
  const interactionMode = useVamsStore((state) => state.interactionMode);
  const showCoordinateTracker = useVamsStore((state) => state.showCoordinateTracker);
  
  const { pixiReady, appRef, worldRef, gridRef, overlayRef } = usePixiApp(canvasRef);
  
  const { screenToWorld, applyViewportTransform } = useCanvasInteraction({
    pixiReady,
    appRef,
    worldRef,
    canvasRef,
  });

  useSceneRenderer({
    pixiReady,
    appRef,
    worldRef,
    overlayRef,
    applyViewportTransform,
  });

  useGridSystem({
    pixiReady,
    appRef,
    worldRef,
    gridRef,
  });

  useCustomShapePreview({
    pixiReady,
    worldRef,
  });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    // Prevent coordinate updates if the view is obscured
    if (isHidden) return;
    
    const { x, y } = screenToWorld(event.clientX, event.clientY);
    setCoordinates({ x, y });
  };

  const cursorStyle =
    interactionMode === 'VERTEX_PLACE' ? 'crosshair' : undefined;

  return (
    <div
      className={`canvas-wrapper ${isHidden ? 'hidden' : ''}`}
      ref={canvasRef}
      onPointerMove={handlePointerMove}
      onContextMenu={(event) => event.preventDefault()}
      style={{ cursor: cursorStyle }}
    >
      <CanvasOverlays
        viewportLimits={viewportLimits}
        interactionMode={interactionMode}
        coordinates={coordinates}
        showCoordinateTracker={showCoordinateTracker}
      />
    </div>
  );
}