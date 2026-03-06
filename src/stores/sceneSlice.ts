import type { StateCreator } from 'zustand';
import type { VamsState, SceneSlice } from './storeTypes';
import type { VamsObject, TransformState } from '@/types';
import { getInitialVertices } from './storeUtils';

// --- Safe ID Generator ---
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID(); } catch { /* Fallback to custom generator on error */ }
  }
  return 'id-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

// --- Naming Utilities ---
const getUniqueName = (basePrefix: string, objects: VamsObject[]) => {
  let counter = 1;
  let newName = `${basePrefix}_${counter}`;
  while (objects.some((o) => o.name === newName)) {
    counter++;
    newName = `${basePrefix}_${counter}`;
  }
  return newName;
};

const getDuplicateName = (originalName: string, objects: VamsObject[]) => {
  let newName = `${originalName}_copy`;
  let counter = 2;
  while (objects.some((o) => o.name === newName)) {
    newName = `${originalName}_copy_${counter}`;
    counter++;
  }
  return newName;
};

// --- Matrix Math Helpers for Drag & Drop Hierarchy ---
const getMatrix = (t: TransformState) => {
  const rad = (t.rotate * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    t.scale * cos, -t.scale * sin, t.translateX,
    t.scale * sin,  t.scale * cos, t.translateY
  ];
};

const multiplyMat = (m1: number[], m2: number[]) => {
  return [
    m1[0]*m2[0] + m1[1]*m2[3],
    m1[0]*m2[1] + m1[1]*m2[4],
    m1[0]*m2[2] + m1[1]*m2[5] + m1[2],
    m1[3]*m2[0] + m1[4]*m2[3],
    m1[3]*m2[1] + m1[4]*m2[4],
    m1[3]*m2[2] + m1[4]*m2[5] + m1[5]
  ];
};

const invertMat = (m: number[]) => {
  const det = m[0]*m[4] - m[1]*m[3];
  if (det === 0) return [1,0,0, 0,1,0];
  const invDet = 1 / det;
  return [
     m[4] * invDet, -m[1] * invDet, (m[1]*m[5] - m[2]*m[4]) * invDet,
    -m[3] * invDet,  m[0] * invDet, (m[2]*m[3] - m[0]*m[5]) * invDet
  ];
};

const extractTransform = (m: number[]): TransformState => {
  const scale = Math.sqrt(m[0]*m[0] + m[3]*m[3]);
  const rotate = Math.atan2(m[3], m[0]) * 180 / Math.PI;
  return {
    translateX: m[2],
    translateY: m[5],
    rotate,
    scale
  };
};

const getGlobalMatrix = (objId: string, objects: VamsObject[]) => {
  const current = objects.find(o => o.id === objId);
  let mat = [1,0,0, 0,1,0];
  if (!current) return mat;
  mat = getMatrix(current.transform);
  
  let parentId = current.parentId;
  while (parentId) {
    const parent = objects.find(o => o.id === parentId);
    if (!parent) break;
    mat = multiplyMat(getMatrix(parent.transform), mat);
    parentId = parent.parentId;
  }
  return mat;
};

// --- Zustand Slice ---
export const createSceneSlice: StateCreator<VamsState, [], [], SceneSlice> = (set, get) => ({
  objects: [],
  selectedObjectId: null,

  setSelection: (id) => get().selectObject(id),
  
  selectObject: (id) => set({
    selectedObjectId: id,
    creationMode: null,
    selectedVertexId: null,
  }),

  addObject: (type) => {
    get().pushToHistory();
    set((state) => {
      const newId = generateId();
      const newObj: VamsObject = {
        id: newId,
        name: getUniqueName(type, state.objects),
        type,
        isVisible: true,
        shading: 'SMOOTH',
        vertices: getInitialVertices(type),
        transform: { translateX: 0, translateY: 0, rotate: 0, scale: 1 },
        behaviors: [],
        parentId: null,
        childIds: [],
      };

      return {
        objects: [newObj, ...state.objects],
        selectedObjectId: newId,
        creationMode: null,
        interactionMode: 'SELECT',
      };
    });
  },

  addCustomObject: (type, placedVertices) => {
    get().pushToHistory();
    set((state) => {
      const newId = generateId();
      
      let centerX = 0;
      let centerY = 0;
      if (placedVertices.length > 0) {
        let sumX = 0;
        let sumY = 0;
        placedVertices.forEach(v => {
          sumX += v.x;
          sumY += v.y;
        });
        centerX = sumX / placedVertices.length;
        centerY = sumY / placedVertices.length;
      }

      const vertices = placedVertices.map((pv, i) => ({
        id: `v${i}`,
        x: pv.x - centerX,
        y: pv.y - centerY,
        color: '#ffffff',
      }));

      const newObj: VamsObject = {
        id: newId,
        name: getUniqueName(type, state.objects),
        type,
        isVisible: true,
        shading: 'SMOOTH',
        vertices,
        transform: { translateX: centerX, translateY: centerY, rotate: 0, scale: 1 },
        behaviors: [],
        parentId: null,
        childIds: [],
      };

      return {
        objects: [newObj, ...state.objects],
        selectedObjectId: newId,
        pendingShapeType: null,
        pendingVertices: [],
        interactionMode: 'SELECT',
      };
    });
  },

  deleteObject: (id) => {
    get().pushToHistory();
    set((state) => {
      const obj = state.objects.find(o => o.id === id);
      if (!obj) return state;

      const childIdsToDelete = obj.type === 'GROUP' ? (obj.childIds || []) : [];
      const idsToDelete = [id, ...childIdsToDelete];

      let updatedObjects = state.objects.filter(o => !idsToDelete.includes(o.id));

      if (obj.parentId) {
        updatedObjects = updatedObjects.map(o => {
          if (o.id === obj.parentId) {
            return {
              ...o,
              childIds: o.childIds?.filter(cid => cid !== id) || []
            };
          }
          return o;
        });
      }

      updatedObjects = updatedObjects.map(o => {
        if (o.behaviors.some(b => b.triggerTargetId && idsToDelete.includes(b.triggerTargetId))) {
          return {
            ...o,
            behaviors: o.behaviors.filter(b => !b.triggerTargetId || !idsToDelete.includes(b.triggerTargetId))
          };
        }
        return o;
      });

      const isSelectedDeleted = state.selectedObjectId && idsToDelete.includes(state.selectedObjectId);

      return {
        objects: updatedObjects,
        selectedObjectId: isSelectedDeleted ? null : state.selectedObjectId,
        ...(isSelectedDeleted ? { 
          selectedVertexId: null,
          interactionMode: state.interactionMode === 'VERTEX_EDIT' ? 'SELECT' : state.interactionMode 
        } : {})
      };
    });
  },

  duplicateObject: (id) => {
    get().pushToHistory();
    set((state) => {
      const objIndex = state.objects.findIndex(o => o.id === id);
      if (objIndex === -1) return state;

      const obj = state.objects[objIndex];
      const newId = generateId();
      
      const duplicate: VamsObject = {
        ...obj,
        id: newId,
        name: getDuplicateName(obj.name, state.objects),
        vertices: obj.vertices.map(v => ({ ...v, id: generateId() })),
        behaviors: obj.behaviors.map(b => ({ ...b, id: generateId() })),
        parentId: null,
        childIds: [],
      };

      const newObjects = [...state.objects];
      newObjects.splice(objIndex + 1, 0, duplicate);

      return {
        objects: newObjects,
        selectedObjectId: newId,
      };
    });
  },

  updateObjectName: (id, name) => {
    get().pushToHistory();
    set((state) => ({
      objects: state.objects.map(o => o.id === id ? { ...o, name } : o),
    }));
  },

  toggleObjectVisibility: (id) => {
    get().pushToHistory();
    set((state) => ({
      objects: state.objects.map(o => 
        o.id === id ? { ...o, isVisible: !o.isVisible } : o
      ),
    }));
  },

  updateObjectTransform: (id, update) => {
    set((state) => {
      return {
        objects: state.objects.map(obj =>
          obj.id === id
            ? { ...obj, transform: { ...obj.transform, ...update } }
            : obj
        ),
      };
    });
  },

  updateVertexPosition: (objectId, vertexId, x, y) => {
    set((state) => ({
      objects: state.objects.map(obj => {
        if (obj.id !== objectId) return obj;
        return {
          ...obj,
          vertices: obj.vertices.map(v => 
            v.id === vertexId ? { ...v, x, y } : v
          ),
        };
      }),
    }));
  },

  updateVertexColor: (objectId, vertexId, color) => {
    const state = get();
    if (!state.isBatchMode) {
      state.pushToHistory();
    }
    set((state) => ({
      objects: state.objects.map(obj => {
        if (obj.id !== objectId) return obj;
        return {
          ...obj,
          vertices: obj.vertices.map(v => 
            v.id === vertexId ? { ...v, color } : v
          ),
        };
      }),
    }));
  },

  setAllVertexColors: (objectId, color) => {
    get().pushToHistory();
    set((state) => ({
      objects: state.objects.map(obj => {
        if (obj.id !== objectId) return obj;
        return {
          ...obj,
          vertices: obj.vertices.map(v => ({ ...v, color })),
        };
      }),
    }));
  },

  updateObjectShading: (id, mode) => {
    get().pushToHistory();
    set((state) => ({
      objects: state.objects.map(obj => obj.id === id ? { ...obj, shading: mode } : obj),
    }));
  },

  addBehavior: (objectId, behavior) => {
    get().pushToHistory();
    set((state) => ({
      objects: state.objects.map(obj => {
        if (obj.id !== objectId) return obj;
        const newBehavior = { 
          ...behavior, 
          id: generateId(),
          enabled: true,
          mode: behavior.mode || 'INSTANT'
        };
        return { ...obj, behaviors: [...obj.behaviors, newBehavior] };
      }),
    }));
  },

  removeBehavior: (objectId, behaviorId) => {
    get().pushToHistory();
    set((state) => ({
      objects: state.objects.map(obj => {
        if (obj.id !== objectId) return obj;
        return { ...obj, behaviors: obj.behaviors.filter(b => b.id !== behaviorId) };
      }),
    }));
  },

  updateBehavior: (objectId, behaviorId, update) => {
    get().pushToHistory();
    set((state) => ({
      objects: state.objects.map(obj => {
        if (obj.id !== objectId) return obj;
        return { 
          ...obj, 
          behaviors: obj.behaviors.map(b => 
            b.id === behaviorId ? { ...b, ...update } : b
          )
        };
      }),
    }));
  },

  addTextObject: (text, x, y) => {
    get().pushToHistory();
    set((state) => {
      const newId = generateId();
      const textObj: VamsObject = {
        id: newId,
        name: getUniqueName('TEXT', state.objects),
        type: 'TEXT',
        isVisible: true,
        shading: 'FLAT',
        vertices: [{ id: 'v0', x: 0, y: 0, color: '#ffffff' }],
        transform: { translateX: x, translateY: y, rotate: 0, scale: 1 },
        behaviors: [],
        textContent: text,
        rasterPosition: { x, y },
        parentId: null,
        childIds: [],
      };
      
      return { objects: [textObj, ...state.objects], selectedObjectId: newId };
    });
  },

  updateTextContent: (id, text) => {
    set((state) => ({
      objects: state.objects.map(obj =>
        obj.id === id ? { ...obj, textContent: text } : obj
      ),
    }));
  },

  createGroup: (objectIds) => {
    if (objectIds.length < 2) return;
    
    get().pushToHistory();
    set((state) => {
      const groupId = generateId();
      const validObjectIds = objectIds.filter(id => {
        const obj = state.objects.find(o => o.id === id);
        return obj && !obj.parentId;
      });

      if (validObjectIds.length < 2) return state;

      const objectsToGroup = state.objects.filter(o => validObjectIds.includes(o.id));
      
      const centerX = objectsToGroup.reduce((sum, obj) => sum + obj.transform.translateX, 0) / objectsToGroup.length;
      const centerY = objectsToGroup.reduce((sum, obj) => sum + obj.transform.translateY, 0) / objectsToGroup.length;

      const groupObj: VamsObject = {
        id: groupId,
        name: getUniqueName('Group', state.objects),
        type: 'GROUP',
        isVisible: true,
        shading: 'FLAT',
        vertices: [],
        transform: { translateX: centerX, translateY: centerY, rotate: 0, scale: 1 },
        behaviors: [],
        parentId: null,
        childIds: validObjectIds,
      };

      const updatedObjects = state.objects.map(obj => {
        if (validObjectIds.includes(obj.id)) {
          return {
            ...obj,
            parentId: groupId,
            transform: {
              ...obj.transform,
              translateX: obj.transform.translateX - centerX,
              translateY: obj.transform.translateY - centerY,
            }
          };
        }
        return obj;
      });

      return {
        objects: [groupObj, ...updatedObjects],
        selectedObjectId: groupId,
      };
    });
  },

  ungroup: (groupId) => {
    get().pushToHistory();
    set((state) => {
      const group = state.objects.find(o => o.id === groupId);
      if (!group || group.type !== 'GROUP') return state;

      const gTx = group.transform;
      const gRad = (gTx.rotate * Math.PI) / 180;
      const gCos = Math.cos(gRad);
      const gSin = Math.sin(gRad);
      const gScale = gTx.scale;

      const newParentId = group.parentId;

      let updatedObjects = state.objects
        .filter(o => o.id !== groupId)
        .map(obj => {
          if (group.childIds?.includes(obj.id)) {
            const lx = obj.transform.translateX;
            const ly = obj.transform.translateY;
            const wx = (lx * gScale * gCos) - (ly * gScale * gSin) + gTx.translateX;
            const wy = (lx * gScale * gSin) + (ly * gScale * gCos) + gTx.translateY;

            return {
              ...obj,
              parentId: newParentId,
              transform: {
                ...obj.transform,
                translateX: wx,
                translateY: wy,
                rotate: obj.transform.rotate + gTx.rotate,
                scale: obj.transform.scale * gScale
              }
            };
          }
          return obj;
        });

      if (newParentId) {
         updatedObjects = updatedObjects.map(o => {
             if (o.id === newParentId) {
                 return {
                     ...o,
                     childIds: [...(o.childIds || []), ...group.childIds!]
                 };
             }
             return o;
         });
      }

      updatedObjects = updatedObjects.map(o => {
        if (o.behaviors.some(b => b.triggerTargetId === groupId)) {
          return {
            ...o,
            behaviors: o.behaviors.filter(b => b.triggerTargetId !== groupId)
          };
        }
        return o;
      });

      const isSelectedDeleted = state.selectedObjectId === groupId;

      return {
        objects: updatedObjects,
        selectedObjectId: isSelectedDeleted ? null : state.selectedObjectId,
        ...(isSelectedDeleted ? { 
          selectedVertexId: null,
          interactionMode: state.interactionMode === 'VERTEX_EDIT' ? 'SELECT' : state.interactionMode 
        } : {})
      };
    });
  },

  deleteGroup: (groupId) => {
    get().pushToHistory();
    set((state) => {
      const group = state.objects.find(o => o.id === groupId);
      if (!group || group.type !== 'GROUP') return state;

      const childIdsToDelete = group.childIds || [];
      const idsToDelete = [groupId, ...childIdsToDelete];

      let updatedObjects = state.objects.filter(
        o => !idsToDelete.includes(o.id)
      );

      updatedObjects = updatedObjects.map(o => {
        if (o.behaviors.some(b => b.triggerTargetId && idsToDelete.includes(b.triggerTargetId))) {
          return {
            ...o,
            behaviors: o.behaviors.filter(b => !b.triggerTargetId || !idsToDelete.includes(b.triggerTargetId))
          };
        }
        return o;
      });

      const isSelectedDeleted = state.selectedObjectId && idsToDelete.includes(state.selectedObjectId);

      return {
        objects: updatedObjects,
        selectedObjectId: isSelectedDeleted ? null : state.selectedObjectId,
        ...(isSelectedDeleted ? { 
          selectedVertexId: null,
          interactionMode: state.interactionMode === 'VERTEX_EDIT' ? 'SELECT' : state.interactionMode 
        } : {})
      };
    });
  },

  reorderObject: (sourceId, targetId, position) => {
    get().pushToHistory();
    set((state) => {
      if (sourceId === targetId) return state;

      const sourceIndex = state.objects.findIndex(o => o.id === sourceId);
      const targetIndex = state.objects.findIndex(o => o.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return state;

      const sourceObj = state.objects[sourceIndex];
      const targetObj = state.objects[targetIndex];

      // Prevent circular hierarchy
      let currentParent = targetObj.parentId;
      while (currentParent) {
        if (currentParent === sourceId) return state; 
        const parentObj = state.objects.find(o => o.id === currentParent);
        currentParent = parentObj?.parentId || null;
      }

      let newObjects = [...state.objects];

      const getDescendants = (id: string): VamsObject[] => {
        const children = newObjects.filter(o => o.parentId === id);
        return children.reduce((acc, child) => [...acc, child, ...getDescendants(child.id)], children);
      };

      const sourceDescendants = getDescendants(sourceId);
      const sourceFamilyIds = new Set([sourceId, ...sourceDescendants.map(o => o.id)]);

      // Calculate source object's absolute global transform before detaching
      const globalMat = getGlobalMatrix(sourceObj.id, state.objects);

      let newParentId = sourceObj.parentId;
      if (position === 'inside' && targetObj.type === 'GROUP') {
        newParentId = targetId;
      } else if (position === 'before' || position === 'after') {
        newParentId = targetObj.parentId;
      }

      // Calculate inverse matrix of the target parent to compute the new normalized local transform
      let newParentGlobalMat = [1,0,0, 0,1,0];
      if (newParentId) {
         newParentGlobalMat = getGlobalMatrix(newParentId, state.objects);
      }
      
      const invParentMat = invertMat(newParentGlobalMat);
      const newLocalMat = multiplyMat(invParentMat, globalMat);
      const newTransform = extractTransform(newLocalMat);

      // Clean up precision artifacts
      newTransform.translateX = parseFloat(newTransform.translateX.toFixed(4));
      newTransform.translateY = parseFloat(newTransform.translateY.toFixed(4));
      newTransform.rotate = parseFloat(newTransform.rotate.toFixed(4));
      newTransform.scale = parseFloat(newTransform.scale.toFixed(4));

      const familyObjects = newObjects.filter(o => sourceFamilyIds.has(o.id));
      newObjects = newObjects.filter(o => !sourceFamilyIds.has(o.id));

      familyObjects[0] = { 
        ...familyObjects[0], 
        parentId: newParentId,
        transform: newTransform
      };

      const newTargetIndex = newObjects.findIndex(o => o.id === targetId);
      let insertIndex = newTargetIndex;

      if (position === 'inside') {
        insertIndex = newTargetIndex + 1;
      } else if (position === 'after') {
        const targetDescendants = getDescendants(targetId);
        const validDescendantsCount = targetDescendants.filter(o => !sourceFamilyIds.has(o.id)).length;
        insertIndex = newTargetIndex + 1 + validDescendantsCount;
      }

      newObjects.splice(insertIndex, 0, ...familyObjects);

      newObjects = newObjects.map(obj => {
        if (obj.type === 'GROUP') {
          const actualChildren = newObjects.filter(o => o.parentId === obj.id);
          return { ...obj, childIds: actualChildren.map(c => c.id) };
        }
        return obj;
      });

      return { objects: newObjects };
    });
  },
});