import type {
  PrimitiveType,
  VamsObject,
  ShadingModel,
  TransformState,
  Behavior,
  ViewportLimits,
  LearningSettings,
  InteractionMode,
  AxisVisibility,
  SimulationState,
  PendingVertex,
} from '@/types';

export interface SceneSlice {
  objects: VamsObject[];
  selectedObjectId: string | null;
  setSelection: (id: string | null) => void;
  selectObject: (id: string | null) => void;
  addObject: (type: PrimitiveType) => void;
  addCustomObject: (type: PrimitiveType, vertices: PendingVertex[]) => void;
  deleteObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  updateObjectName: (id: string, name: string) => void;
  toggleObjectVisibility: (id: string) => void;
  updateObjectTransform: (id: string, update: Partial<TransformState>) => void;
  updateVertexPosition: (objectId: string, vertexId: string, x: number, y: number) => void;
  updateVertexColor: (objectId: string, vertexId: string, color: string) => void;
  setAllVertexColors: (objectId: string, color: string) => void;
  updateObjectShading: (id: string, mode: ShadingModel) => void;
  addBehavior: (objectId: string, behavior: Omit<Behavior, 'id'>) => void;
  removeBehavior: (objectId: string, behaviorId: string) => void;
  updateBehavior: (objectId: string, behaviorId: string, update: Partial<Behavior>) => void;
  addTextObject: (text: string, x: number, y: number) => void;
  updateTextContent: (id: string, text: string) => void;
  createGroup: (objectIds: string[]) => void;
  ungroup: (groupId: string) => void;
  deleteGroup: (groupId: string) => void;
  reorderObject: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
}

export interface InteractionSlice {
  interactionMode: InteractionMode;
  creationMode: PrimitiveType | null;
  isVertexEditMode: boolean;
  selectedVertexId: string | null;
  setInteractionMode: (mode: InteractionMode) => void;
  setCreationMode: (mode: PrimitiveType | null) => void;
  toggleVertexEditMode: () => void;
  setSelectedVertex: (vertexId: string | null) => void;
}

export interface ViewportSlice {
  viewportLimits: ViewportLimits;
  axisVisibility: AxisVisibility;
  showCoordinateTracker: boolean;
  setViewportLimits: (limits: Partial<ViewportLimits>) => void;
  setAxisVisibility: (visibility: Partial<AxisVisibility>) => void;
  setShowCoordinateTracker: (show: boolean) => void;
}

export type ObjectSnapshot = VamsObject;

export interface SimulationSlice {
  simulationState: SimulationState;
  isGameOver: boolean;
  initialObjectStates: Map<string, ObjectSnapshot>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setGameOver: (isGameOver: boolean) => void;
}

export interface SettingsSlice {
  learningSettings: LearningSettings;
  theme: 'dark' | 'light';
  canvasBackgroundColor: string;
  updateLearningSettings: (settings: Partial<LearningSettings>) => void;
  toggleTheme: () => void;
  setCanvasBackgroundColor: (color: string) => void;
}

export interface CustomShapeBuilderSlice {
  pendingShapeType: PrimitiveType | null;
  pendingVertices: PendingVertex[];
  pendingMinVertices: number;
  startCustomShape: (type: PrimitiveType, minVertices: number) => void;
  cancelCustomShape: () => void;
  addPendingVertex: (x: number, y: number) => void;
  addManualVertex: () => void;
  removeLastPendingVertex: () => void;
  removePendingVertexAt: (index: number) => void;
  updatePendingVertex: (index: number, x: number, y: number) => void;
}

export interface HistorySnapshot {
  objects: VamsObject[];
  selectedObjectId: string | null;
  interactionMode: InteractionMode;
  selectedVertexId: string | null;
  isVertexEditMode: boolean;
  pendingShapeType: PrimitiveType | null;
  pendingVertices: PendingVertex[];
  timestamp: number;
}

export interface HistorySlice {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  maxHistorySize: number;
  isBatchMode: boolean;
  startBatch: () => void;
  endBatch: () => void;
  pushToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

export type VamsState = SceneSlice &
  InteractionSlice &
  ViewportSlice &
  SimulationSlice &
  SettingsSlice &
  CustomShapeBuilderSlice &
  HistorySlice;