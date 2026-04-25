import type {
  PrimitiveType,
  SceneNode,
  ShadingModel,
  TransformState,
  ViewportLimits,
  LearningSettings,
  InteractionMode,
  AxisVisibility,
  PendingVertex,
} from '@/core/types/scene';

export interface SceneSlice {
  objects: SceneNode[];
  selectedObjectId: string | null;
  setSelection: (id: string | null) => void;
  selectObject: (id: string | null) => void;
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
  addTextObject: (text: string, x: number, y: number) => void;
  updateTextContent: (id: string, text: string) => void;
  createGroup: (objectIds: string[]) => void;
  ungroup: (groupId: string) => void;
  deleteGroup: (groupId: string) => void;
  reorderObject: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
}

export interface InteractionSlice {
  interactionMode: InteractionMode;
  selectedVertexId: string | null;
  setInteractionMode: (mode: InteractionMode) => void;
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
  pendingVertexStride: number | null;
  startCustomShape: (type: PrimitiveType, minVertices: number, stride?: number | null) => void;
  cancelCustomShape: () => void;
  addPendingVertex: (x: number, y: number) => void;
  addManualVertex: () => void;
  removeLastPendingVertex: () => void;
  removePendingVertexAt: (index: number) => void;
  updatePendingVertex: (index: number, x: number, y: number) => void;
}

export interface HistorySnapshot {
  objects: SceneNode[];
  selectedObjectId: string | null;
  interactionMode: InteractionMode;
  selectedVertexId: string | null;
  pendingShapeType: PrimitiveType | null;
  pendingVertices: PendingVertex[];
  pendingMinVertices: number;
  pendingVertexStride: number | null;
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

export type AppMode = 'Author' | 'Lesson';
export type CurriculumSection = 'Pipeline' | 'Primitives' | 'Buffers' | 'Transforms' | 'Textures';
export type PipelineMode = 'Diagram' | 'Playground' | 'RasterVector';

export interface RuntimeSlice {
  appMode: AppMode;
  activeSection: CurriculumSection;
  pipelineMode: PipelineMode;
  activePipelineStage: number | null;
  cursorWorld: { x: number; y: number } | null;
  setAppMode: (mode: AppMode) => void;
  setActiveSection: (section: CurriculumSection) => void;
  setPipelineMode: (mode: PipelineMode) => void;
  setActivePipelineStage: (stageIndex: number | null) => void;
  setCursorWorld: (pos: { x: number; y: number } | null) => void;
}

export interface LessonSlice {
  activeLessonId: string | null;
  currentStepIndex: number;
  exerciseAnswers: Record<string, unknown>;
  isSuccess: boolean;
  sceneBackup: SceneNode[] | null;
  setActiveLesson: (lessonId: string | null) => void;
  setCurrentStep: (index: number) => void;
  setExerciseAnswer: (stepId: string, answer: unknown) => void;
  setSuccessState: (success: boolean) => void;
  clearLessonState: () => void;
}

export type VamsState = SceneSlice &
  InteractionSlice &
  ViewportSlice &
  SettingsSlice &
  CustomShapeBuilderSlice &
  HistorySlice &
  RuntimeSlice &
  LessonSlice;
