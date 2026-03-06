import type { InteractionMode, ViewportLimits, AxisVisibility } from "@/types";

interface CanvasOverlaysProps {
  viewportLimits: ViewportLimits;
  interactionMode: InteractionMode;
  coordinates: { x: number; y: number };
  axisVisibility: AxisVisibility;
  showCoordinateTracker: boolean;
}

export function CanvasOverlays({
  viewportLimits,
  interactionMode,
  coordinates,
  showCoordinateTracker,
}: CanvasOverlaysProps) {
  return (
    <>
      {/* Grid overlay removed; Gridlines are now handled by PixiJS in useGridSystem */}
      
      <div className="viewport-info">
        Viewport: ({viewportLimits.minX}, {viewportLimits.maxX})
      </div>

      {interactionMode === "CUSTOM_SHAPE_PLACE" && (
        <div className="placement-mode-banner">
          <span>● Vertex Placement Mode — click to place</span>
        </div>
      )}

      {showCoordinateTracker && (
        <div className="coordinate-tracker">
          <span className="label-x">X:</span> {coordinates.x.toFixed(2)}
          <span className="label-y">Y:</span> {coordinates.y.toFixed(2)}
        </div>
      )}
    </>
  );
}