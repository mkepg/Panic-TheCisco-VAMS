import './pedagogical-views.scss';

export default function RasterVectorView() {
  return (
    <div className="pedagogical-overlay raster-vector-view">
      <div className="split-view">
        <div className="view-pane vector-pane">
          <h3>Vector Representation</h3>
          <div className="visualization vector-viz">
            {/* Mathematical representation (lines, vertices) goes here */}
            <p className="hint">Mathematical formulas and continuous coordinates.</p>
          </div>
        </div>
        <div className="divider" />
        <div className="view-pane raster-pane">
          <h3>Raster Representation</h3>
          <div className="visualization raster-viz">
            {/* Pixel grid visualization goes here */}
            <p className="hint">Discrete grid of pixels (fragments).</p>
          </div>
        </div>
      </div>
    </div>
  );
}