import type { VamsState } from '@/stores/storeTypes';
import type {
  AxisVisibility,
  InteractionMode,
  LearningSettings,
  PendingVertex,
  PrimitiveType,
  ShadingModel,
  TransformState,
  VamsObject,
  VamsObjectType,
  Vertex,
  ViewportLimits,
  Behavior,
} from '@/types';

export const VAMS_PROJECT_SCHEMA_VERSION = 1 as const;

export type VamsProjectData = {
  objects: VamsObject[];
  viewportLimits: ViewportLimits;
  axisVisibility: AxisVisibility;
  showCoordinateTracker: boolean;
  learningSettings: LearningSettings;
  theme: 'dark' | 'light';
  canvasBackgroundColor: string;
  selectedObjectId: string | null;
  interactionMode: InteractionMode;
  creationMode: PrimitiveType | null;
  isVertexEditMode: boolean;
  selectedVertexId: string | null;
  pendingShapeType: PrimitiveType | null;
  pendingVertices: PendingVertex[];
  pendingMinVertices: number;
};

export type VamsProjectFile = {
  app: 'VAMS';
  schemaVersion: number;
  exportedAt: string;
  data: VamsProjectData;
};

const ALLOWED_OBJECT_TYPES: ReadonlySet<VamsObjectType> = new Set([
  'TRIANGLE',
  'RECTANGLE',
  'CIRCLE',
  'ELLIPSE',
  'HEXAGON',
  'STAR',
  'POLYGON',
  'LINE',
  'LINE_STRIP',
  'POINT',
  'POINTS',
  'TRIANGLE_STRIP',
  'TEXT',
  'GROUP',
]);

const DEFAULT_VIEWPORT: ViewportLimits = { minX: -1, maxX: 1, minY: -1, maxY: 1 };

const DEFAULT_AXIS: AxisVisibility = {
  showGlobalAxes: true,
  showLocalAxes: true,
  showOriginMarker: true,
  showGridlines: true,
};

const DEFAULT_LEARNING: LearningSettings = {
  gridSnapping: false,
  angleSnapping: false,
  snapIncrement: 0.1,
  angleSnapDegrees: 15,
  colorMode: 'RGB',
};

const DEFAULT_TRANSFORM: TransformState = { translateX: 0, translateY: 0, rotate: 0, scale: 1 };

const DEFAULT_DATA: VamsProjectData = {
  objects: [],
  viewportLimits: DEFAULT_VIEWPORT,
  axisVisibility: DEFAULT_AXIS,
  showCoordinateTracker: true,
  learningSettings: DEFAULT_LEARNING,
  theme: 'dark',
  canvasBackgroundColor: '#000000',
  selectedObjectId: null,
  interactionMode: 'SELECT',
  creationMode: null,
  isVertexEditMode: false,
  selectedVertexId: null,
  pendingShapeType: null,
  pendingVertices: [],
  pendingMinVertices: 1,
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function toNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function toBoolean(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function toString(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}

function toTheme(v: unknown): 'dark' | 'light' {
  return v === 'light' ? 'light' : 'dark';
}

function toShading(v: unknown): ShadingModel {
  return v === 'FLAT' ? 'FLAT' : 'SMOOTH';
}

function toInteractionMode(v: unknown): InteractionMode {
  const allowed: InteractionMode[] = ['SELECT', 'CREATE', 'VERTEX_EDIT', 'PARENT_LINK', 'CUSTOM_SHAPE_PLACE'];
  return allowed.includes(v as InteractionMode) ? (v as InteractionMode) : 'SELECT';
}

function toPrimitiveType(v: unknown): PrimitiveType | null {
  if (typeof v !== 'string') return null;
  const allowed: PrimitiveType[] = [
    'TRIANGLE',
    'RECTANGLE',
    'CIRCLE',
    'ELLIPSE',
    'HEXAGON',
    'STAR',
    'POLYGON',
    'LINE',
    'LINE_STRIP',
    'POINT',
    'POINTS',
    'TRIANGLE_STRIP',
  ];
  return allowed.includes(v as PrimitiveType) ? (v as PrimitiveType) : null;
}

function sanitizeViewport(v: unknown): ViewportLimits {
  if (!isRecord(v)) return DEFAULT_VIEWPORT;
  return {
    minX: toNumber(v.minX, DEFAULT_VIEWPORT.minX),
    maxX: toNumber(v.maxX, DEFAULT_VIEWPORT.maxX),
    minY: toNumber(v.minY, DEFAULT_VIEWPORT.minY),
    maxY: toNumber(v.maxY, DEFAULT_VIEWPORT.maxY),
  };
}

function sanitizeAxis(v: unknown): AxisVisibility {
  if (!isRecord(v)) return DEFAULT_AXIS;
  return {
    showGlobalAxes: toBoolean(v.showGlobalAxes, DEFAULT_AXIS.showGlobalAxes),
    showLocalAxes: toBoolean(v.showLocalAxes, DEFAULT_AXIS.showLocalAxes),
    showOriginMarker: toBoolean(v.showOriginMarker, DEFAULT_AXIS.showOriginMarker),
    showGridlines: toBoolean(v.showGridlines, DEFAULT_AXIS.showGridlines),
  };
}

function sanitizeLearning(v: unknown): LearningSettings {
  if (!isRecord(v)) return DEFAULT_LEARNING;
  const colorMode = v.colorMode === 'FLOAT' ? 'FLOAT' : 'RGB';
  return {
    gridSnapping: toBoolean(v.gridSnapping, DEFAULT_LEARNING.gridSnapping),
    angleSnapping: toBoolean(v.angleSnapping, DEFAULT_LEARNING.angleSnapping),
    snapIncrement: toNumber(v.snapIncrement, DEFAULT_LEARNING.snapIncrement),
    angleSnapDegrees: toNumber(v.angleSnapDegrees, DEFAULT_LEARNING.angleSnapDegrees),
    colorMode,
  };
}

function sanitizeTransform(v: unknown): TransformState {
  if (!isRecord(v)) return DEFAULT_TRANSFORM;
  return {
    translateX: toNumber(v.translateX, DEFAULT_TRANSFORM.translateX),
    translateY: toNumber(v.translateY, DEFAULT_TRANSFORM.translateY),
    rotate: toNumber(v.rotate, DEFAULT_TRANSFORM.rotate),
    scale: toNumber(v.scale, DEFAULT_TRANSFORM.scale),
  };
}

function sanitizeVertex(v: unknown, idx: number): Vertex {
  if (!isRecord(v)) {
    return { id: `v${idx}`, x: 0, y: 0, color: '#ffffff' };
  }
  return {
    id: toString(v.id, `v${idx}`),
    x: toNumber(v.x, 0),
    y: toNumber(v.y, 0),
    color: toString(v.color, '#ffffff'),
  };
}

function sanitizeBehavior(v: unknown, idx: number): Behavior {
  if (!isRecord(v)) {
    return {
      id: `b${idx}`,
      enabled: true,
      trigger: 'ON_START',
      triggerKey: '',
      action: 'TRANSLATE_X',
      mode: 'INSTANT',
      value: 0,
      target: 'OBJECT',
    } as Behavior;
  }
  return {
    id: toString(v.id, `b${idx}`),
    enabled: toBoolean(v.enabled, true),
    trigger: (typeof v.trigger === 'string' ? v.trigger : 'ON_START') as Behavior['trigger'],
    triggerKey: toString(v.triggerKey, ''),
    triggerTargetId: typeof v.triggerTargetId === 'string' ? v.triggerTargetId : undefined,
    action: (typeof v.action === 'string' ? v.action : 'TRANSLATE_X') as Behavior['action'],
    mode: (typeof v.mode === 'string' ? v.mode : 'INSTANT') as Behavior['mode'],
    value: toNumber(v.value, 0),
    target: (typeof v.target === 'string' ? v.target : 'OBJECT') as Behavior['target'],
    textPayload: typeof v.textPayload === 'string' ? v.textPayload : undefined,
    colorPayload: typeof v.colorPayload === 'string' ? v.colorPayload : undefined,
  };
}

function sanitizeObject(v: unknown, idx: number): VamsObject | null {
  if (!isRecord(v)) return null;
  const typeRaw = v.type;
  const type = (typeof typeRaw === 'string' ? typeRaw : '') as VamsObjectType;
  
  if (!ALLOWED_OBJECT_TYPES.has(type)) return null;
  
  const verticesRaw = Array.isArray(v.vertices) ? v.vertices : [];
  const behaviorsRaw = Array.isArray(v.behaviors) ? v.behaviors : [];
  
  return {
    id: toString(v.id, `obj-${idx}`),
    name: toString(v.name, `${type}_${idx + 1}`),
    type,
    isVisible: toBoolean(v.isVisible, true),
    shading: toShading(v.shading),
    vertices: verticesRaw.map((vv, i) => sanitizeVertex(vv, i)),
    transform: sanitizeTransform(v.transform),
    behaviors: behaviorsRaw.map((bb, i) => sanitizeBehavior(bb, i)),
    textContent: typeof v.textContent === 'string' ? v.textContent : undefined,
    rasterPosition: isRecord(v.rasterPosition)
      ? { x: toNumber(v.rasterPosition.x, 0), y: toNumber(v.rasterPosition.y, 0) }
      : undefined,
    parentId: typeof v.parentId === 'string' ? v.parentId : null,
    childIds: Array.isArray(v.childIds) ? (v.childIds.filter((id) => typeof id === 'string') as string[]) : [],
  };
}

function fixHierarchy(objects: VamsObject[]): VamsObject[] {
  const ids = new Set(objects.map((o) => o.id));
  
  let normalized = objects.map((o) => ({
    ...o,
    parentId: o.parentId && ids.has(o.parentId) ? o.parentId : null,
  }));
  
  normalized = normalized.map((o) => {
    if (o.type !== 'GROUP') return o;
    const children = normalized.filter((child) => child.parentId === o.id).map((child) => child.id);
    return { ...o, childIds: children };
  });
  
  return normalized;
}

export function buildProjectFile(state: VamsState): VamsProjectFile {
  const data: VamsProjectData = {
    objects: state.objects,
    viewportLimits: state.viewportLimits,
    axisVisibility: state.axisVisibility,
    showCoordinateTracker: state.showCoordinateTracker,
    learningSettings: state.learningSettings,
    theme: state.theme,
    canvasBackgroundColor: state.canvasBackgroundColor,
    selectedObjectId: state.selectedObjectId,
    interactionMode: state.interactionMode,
    creationMode: state.creationMode,
    isVertexEditMode: state.isVertexEditMode,
    selectedVertexId: state.selectedVertexId,
    pendingShapeType: state.pendingShapeType,
    pendingVertices: state.pendingVertices,
    pendingMinVertices: state.pendingMinVertices,
  };
  
  return {
    app: 'VAMS',
    schemaVersion: VAMS_PROJECT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function createDefaultProjectFilename(prefix = 'vams-project'): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(
    d.getMinutes()
  )}-${pad(d.getSeconds())}`;
  return `${prefix}-${stamp}.vams`;
}

export function downloadJSON(filename: string, payload: unknown) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Background parsing for UI Thread protection
export async function parseProjectFromFile(file: File): Promise<VamsProjectData> {
  return new Promise((resolve, reject) => {
    const workerCode = `
      self.onmessage = async function(e) {
        try {
          const file = e.data;
          const text = await file.text();
          const parsed = JSON.parse(text);
          self.postMessage({ success: true, data: parsed });
        } catch (err) {
          self.postMessage({ success: false, error: err.message });
        }
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      URL.revokeObjectURL(workerUrl);
      worker.terminate();
      
      if (e.data.success) {
        // Yield to the main thread briefly to allow the UI to paint loading states 
        // before running the heavy array sanitization map
        setTimeout(() => {
          try {
            let rawData = e.data.data;
            if (rawData && typeof rawData === 'object' && 'data' in rawData) {
              rawData = rawData.data;
            }
            resolve(sanitizeProjectData(rawData));
          } catch (err) {
            reject(err);
          }
        }, 0);
      } else {
        reject(new Error(e.data.error));
      }
    };

    worker.onerror = (err) => {
      URL.revokeObjectURL(workerUrl);
      worker.terminate();
      reject(err);
    };

    worker.postMessage(file);
  });
}

export function sanitizeProjectData(raw: unknown): VamsProjectData {
  if (!isRecord(raw)) return { ...DEFAULT_DATA };
  
  const objectsRaw = Array.isArray(raw.objects) ? raw.objects : [];
  const objects = fixHierarchy(
    objectsRaw.map((o, i) => sanitizeObject(o, i)).filter((o): o is VamsObject => o !== null)
  );
  
  const viewportLimits = sanitizeViewport(raw.viewportLimits);
  const axisVisibility = sanitizeAxis(raw.axisVisibility);
  const learningSettings = sanitizeLearning(raw.learningSettings);
  const pendingShapeType = toPrimitiveType(raw.pendingShapeType);
  
  const pendingVertices = Array.isArray(raw.pendingVertices)
    ? raw.pendingVertices
        .filter(isRecord)
        .map((v) => ({ x: toNumber(v.x, 0), y: toNumber(v.y, 0) }))
    : [];
    
  const selectedObjectIdRaw = typeof raw.selectedObjectId === 'string' ? raw.selectedObjectId : null;
  const selectedObjectId =
    selectedObjectIdRaw && objects.some((o) => o.id === selectedObjectIdRaw) ? selectedObjectIdRaw : null;
    
  return {
    objects,
    viewportLimits,
    axisVisibility,
    showCoordinateTracker: toBoolean(raw.showCoordinateTracker, DEFAULT_DATA.showCoordinateTracker),
    learningSettings,
    theme: toTheme(raw.theme),
    canvasBackgroundColor: toString(raw.canvasBackgroundColor, DEFAULT_DATA.canvasBackgroundColor),
    selectedObjectId,
    interactionMode: toInteractionMode(raw.interactionMode),
    creationMode: toPrimitiveType(raw.creationMode),
    isVertexEditMode: toBoolean(raw.isVertexEditMode, DEFAULT_DATA.isVertexEditMode),
    selectedVertexId: typeof raw.selectedVertexId === 'string' ? raw.selectedVertexId : null,
    pendingShapeType,
    pendingVertices,
    pendingMinVertices: Math.max(1, Math.floor(toNumber(raw.pendingMinVertices, DEFAULT_DATA.pendingMinVertices))),
  };
}

export function toStorePatchFromProject(data: VamsProjectData): Partial<VamsState> {
  return {
    objects: data.objects,
    viewportLimits: data.viewportLimits,
    axisVisibility: data.axisVisibility,
    showCoordinateTracker: data.showCoordinateTracker,
    learningSettings: data.learningSettings,
    theme: data.theme,
    canvasBackgroundColor: data.canvasBackgroundColor,
    selectedObjectId: data.selectedObjectId,
    interactionMode: data.interactionMode,
    creationMode: data.creationMode,
    isVertexEditMode: data.isVertexEditMode,
    selectedVertexId: data.selectedVertexId,
    pendingShapeType: data.pendingShapeType,
    pendingVertices: data.pendingVertices,
    pendingMinVertices: data.pendingMinVertices,
  };
}