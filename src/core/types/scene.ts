export type PrimitiveType =
  | 'POINTS'
  | 'LINES'
  | 'LINE_STRIP'
  | 'LINE_LOOP'
  | 'TRIANGLES'
  | 'TRIANGLE_STRIP'
  | 'TRIANGLE_FAN'
  | 'QUADS'
  | 'QUAD_STRIP'
  | 'POLYGON';

export type SceneNodeType = PrimitiveType | 'TEXT' | 'GROUP';
export type ShadingModel = 'FLAT' | 'SMOOTH';

/** Per-object color emission mode. Affects generated code only — visual is identical. */
export type ColorMode = 'FLOAT' | 'BYTE';

/** A `glLineStipple(factor, pattern)` setting. `pattern` is a 16-bit mask. */
export interface LineStipple {
  factor: number;   // 1..256
  pattern: number;  // 16-bit unsigned (0x0000..0xFFFF)
}

export interface ViewportLimits {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface Vertex {
  id: string;
  x: number;
  y: number;
  color: string;
}

export interface TransformState {
  translateX: number;
  translateY: number;
  rotate: number;
  scaleX: number;
  scaleY: number;
}

export interface SceneNode {
  id: string;
  name: string;
  type: SceneNodeType;
  visible: boolean;
  shading: ShadingModel;
  vertices: Vertex[];
  transform: TransformState;
  textContent?: string;
  rasterPosition?: { x: number; y: number };
  parentId?: string | null;
  children?: string[];

  // --- Stage 2 additions (all optional for back-compat with older save files) ---

  /** Float (`glColor3f`) vs Byte (`glColor3ub`). Defaults to FLOAT. */
  colorMode?: ColorMode;

  /** Used only by line primitives. Defaults to 1. */
  lineWidth?: number;

  /** Used only by line primitives. `null` means stippling disabled. */
  lineStipple?: LineStipple | null;

  // --- Stage 3 additions ---

  /** How an object is drawn at the OpenGL API level. Defaults to IMMEDIATE. */
  renderingMode?: RenderingMode;

  /** glBufferData usage hint. Only relevant for VBO mode. Defaults to STATIC. */
  bufferUsage?: BufferUsage;

  /** When true, switches the draw call from glDrawArrays to glDrawElements
   *  with a deduplicated vertex set + index array. */
  useIndexed?: boolean;
}

export interface LearningSettings {
  gridSnapping: boolean;
  snapIncrement: number;
}

export type InteractionMode =
  | 'SELECT'
  | 'VERTEX_PLACE'
  | 'VERTEX_EDIT';

export type AxisVisibility = {
  showGlobalAxes: boolean;
  showLocalAxes: boolean;
  showOriginMarker: boolean;
  showGridlines: boolean;
};

export interface ProjectExportOptions {
  includeHTML: boolean;
  includeCPP: boolean;
  includeJSON: boolean;
  includeScaffold: boolean;
}

export interface PendingVertex {
  x: number;
  y: number;
}

/* -------------------------------------------------------------------------- */
/*                            Stage 2 — GLUT callbacks                        */
/* -------------------------------------------------------------------------- */

/**
 * Identifiers for the GLUT callback registrations the student can wire up.
 * Each maps directly to one `glut*Func()` call in the generated program.
 */
export type GlutCallbackKind =
  | 'keyboard'
  | 'mouse'
  | 'reshape'
  | 'motion'
  | 'idle';

/** A single registered handler — the user types the function name. */
export interface CallbackRegistration {
  kind: GlutCallbackKind;
  handlerName: string;
}

/* -------------------------------------------------------------------------- */
/*                            Stage 3 — Buffers                               */
/* -------------------------------------------------------------------------- */

/**
 * How an object is drawn at the OpenGL API level.
 *  - IMMEDIATE     → glBegin/glVertex/glEnd inline in display()
 *  - VERTEX_ARRAY  → client-side arrays, glDrawArrays in display()
 *  - VBO           → buffers uploaded once in init(), bound and drawn in display()
 *
 * Visual output is identical across modes — the difference is structural.
 */
export type RenderingMode = 'IMMEDIATE' | 'VERTEX_ARRAY' | 'VBO';

/** glBufferData usage hint. Only relevant for VBO mode. */
export type BufferUsage = 'STATIC' | 'DYNAMIC' | 'STREAM';
