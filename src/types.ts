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
export type VamsObjectType = PrimitiveType | 'TEXT' | 'GROUP';
export type ShadingModel = 'FLAT' | 'SMOOTH';
export interface ViewportLimits {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
export type TriggerType =
  | 'KEY_PRESS'
  | 'KEY_HOLD'
  | 'ON_START'
  | 'MOUSE_CLICK'
  | 'MOUSE_DRAG'
  | 'COLLISION_START'
  | 'COLLISION_STAY';
export type ActionType =
  | 'TRANSLATE_X'
  | 'TRANSLATE_Y'
  | 'ROTATE'
  | 'SCALE'
  | 'DESTROY'
  | 'SET_COLOR'
  | 'GAME_OVER';
export type ActionMode = 'INSTANT';
export interface Behavior {
  id: string;
  enabled: boolean;
  trigger: TriggerType;
  triggerKey: string;
  triggerTargetId?: string;
  action: ActionType;
  mode: ActionMode;
  value: number;
  target: 'GROUP' | 'OBJECT' | string;
  textPayload?: string;
  colorPayload?: string;
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
export interface VamsObject {
  id: string;
  name: string;
  type: VamsObjectType;
  isVisible: boolean;
  shading: ShadingModel;
  vertices: Vertex[];
  transform: TransformState;
  behaviors: Behavior[];
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
export type SimulationState = 'STOPPED' | 'PLAYING' | 'PAUSED';
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