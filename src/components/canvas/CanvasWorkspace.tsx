import { useRef, useState } from "react";
import { useVamsStore } from "@/stores";
import { usePixiApp } from "./hooks/usePixiApp";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { useSceneRenderer } from "./hooks/useSceneRenderer";
import { useCustomShapePreview } from "./hooks/useCustomShapePreview";
import { useGridSystem } from "./hooks/useGridSystem";
import { CanvasOverlays } from "./sections/CanvasOverlays";
import "./CanvasWorkspace.scss";

export default function CanvasWorkspace() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
  
  const viewportLimits = useVamsStore((s) => s.viewportLimits);
  const interactionMode = useVamsStore((s) => s.interactionMode);
  const axisVisibility = useVamsStore((s) => s.axisVisibility);
  const showCoordinateTracker = useVamsStore((s) => s.showCoordinateTracker);

  // gridRef is now available
  const { pixiReady, appRef, worldRef, gridRef, overlayRef } = usePixiApp(canvasRef);
  
  const { screenToWorld, applyViewportTransform } = useCanvasInteraction({
    pixiReady,
    appRef,
    worldRef,
    canvasRef,
  });

  // Render Objects
  useSceneRenderer({
    pixiReady,
    appRef,
    worldRef,
    overlayRef,
    applyViewportTransform,
  });

  // Render Infinite Axes (Vector Sharpness)
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

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    setCoordinates({ x, y });
  };

  const cursorStyle =
    interactionMode === "CUSTOM_SHAPE_PLACE" ? "crosshair" : undefined;

  return (
    <div
      className="canvas-wrapper"
      ref={canvasRef}
      onPointerMove={handlePointerMove}
      onContextMenu={(e) => e.preventDefault()}
      style={{ cursor: cursorStyle }}
    >
      <CanvasOverlays
        viewportLimits={viewportLimits}
        interactionMode={interactionMode}
        coordinates={coordinates}
        axisVisibility={axisVisibility}
        showCoordinateTracker={showCoordinateTracker}
      />
    </div>
  );
}