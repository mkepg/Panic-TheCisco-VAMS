export type ShapePrimitive =
  | 'TRIANGLE'
  | 'RECTANGLE'
  | 'CIRCLE'
  | 'ELLIPSE'
  | 'HEXAGON'
  | 'STAR'
  | 'POLYGON';
export type PathPrimitive =
  | 'LINE'
  | 'LINE_STRIP';
export type PointPrimitive =
  | 'POINT'
  | 'POINTS';
export type MeshPrimitive =
  | 'TRIANGLE_STRIP';
export type PrimitiveType = ShapePrimitive | PathPrimitive | PointPrimitive | MeshPrimitive;
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
  scale: number;
}

export interface SceneNode {
  id: string;
  name: string;
  type: SceneNodeType;
  isVisible: boolean;
  shading: ShadingModel;
  vertices: Vertex[];
  transform: TransformState;
  textContent?: string;
  rasterPosition?: { x: number; y: number };
  parentId?: string | null;
  childIds?: string[];
}

export interface LearningSettings {
  gridSnapping: boolean;
  snapIncrement: number;
}

export type InteractionMode =
  | 'SELECT'
  | 'CREATE'
  | 'VERTEX_EDIT'
  | 'PARENT_LINK'
  | 'CUSTOM_SHAPE_PLACE';

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

export interface CircleObject {
  id: string;
  cx: number;
  cy: number;
  radius: number;
  strokeWidth?: number;
  strokeColor?: number;
  fillColor?: number;
}
 
export interface PendingVertex {
  x: number;
  y: number;
}