// src/pixi/primitives.ts
// 
// This file serves as the public API for the primitives rendering system.
// All internal implementation has been refactored into focused modules.
// 
// Module Structure:
// - utils/colorUtils.ts       - Color conversion utilities
// - utils/geometryUtils.ts    - Bounding box, coordinate transforms, geometry calculations
// - rendering/graphicsRenderer.ts - PIXI.Graphics rendering for simple shapes
// - rendering/meshRenderer.ts     - PIXI.Mesh rendering for per-vertex coloring
// - rendering/drawableFactory.ts  - Main orchestration and factory

// Re-export the main factory function
export { createDrawable } from "./rendering/drawableFactory";
export type { CreateDrawableOptions } from "./rendering/drawableFactory";

// Re-export utility functions that may be needed externally
export { 
  toNumColor, 
  colorToRGB 
} from "./utils/colorUtils";

export { 
  pxToWorld, 
  bboxRadii, 
  buildEllipsePoints, 
  hasUniformColor,
  createPaddedHitArea,
  getGroupLocalBounds
} from "./utils/geometryUtils";

// Re-export rendering functions if needed for advanced use cases
export { drawWithGraphics } from "./rendering/graphicsRenderer";
export { createMesh } from "./rendering/meshRenderer";
export type { MeshCreationResult } from "./rendering/meshRenderer";
