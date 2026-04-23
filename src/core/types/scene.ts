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
