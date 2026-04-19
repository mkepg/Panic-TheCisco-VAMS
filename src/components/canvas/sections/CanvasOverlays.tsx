import type { InteractionMode, ViewportLimits } from "@/types";

// Bug 13 fix: `axisVisibility` has been removed from this interface and from the
// component signature. It was accepted as a prop but never used in JSX — axis
// visibility is handled entirely by useGridSystem at the PixiJS layer, which reads
// directly from the store. Accepting it here was dead prop threading.
interface CanvasOverlaysProps {
  viewportLimits: ViewportLimits;
  interactionMode: InteractionMode;
  coordinates: { x: number; y: number };
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
