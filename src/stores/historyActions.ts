// src/stores/historyActions.ts
/**
 * Action wrappers for proper history management
 * These functions wrap store actions to ensure history is properly managed
 */

import { useVamsStore } from './index';

/**
 * Wrapper for transform operations (drag, rotate, scale)
 * Returns start/update/end functions for continuous gestures
 */
export const createTransformAction = (objectId: string) => {
  const store = useVamsStore.getState();
  
  return {
    start: () => {
      // Push history ONCE at the start
      store.pushToHistory();
    },
    
    update: (transform: Partial<{ translateX: number; translateY: number; rotate: number; scale: number }>) => {
      // Update without pushing to history
      store.updateObjectTransform(objectId, transform);
    },
    
    end: () => {
      // Nothing needed - state is already updated
    }
  };
};

/**
 * Wrapper for vertex position updates (drag vertices)
 */
export const createVertexPositionAction = (objectId: string, vertexId: string) => {
  const store = useVamsStore.getState();
  
  return {
    start: () => {
      // Push history ONCE at the start
      store.pushToHistory();
    },
    
    update: (x: number, y: number) => {
      // Update without pushing to history
      store.updateVertexPosition(objectId, vertexId, x, y);
    },
    
    end: () => {
      // Nothing needed
    }
  };
};

/**
 * Wrapper for text content updates (typing)
 * Text editing should batch all changes until blur/unfocus
 */
export const createTextEditAction = (objectId: string) => {
  const store = useVamsStore.getState();
  
  return {
    start: () => {
      // Push history when starting to edit
      store.pushToHistory();
    },
    
    update: (text: string) => {
      // Update without pushing to history
      store.updateTextContent(objectId, text);
    },
    
    end: () => {
      // Nothing needed - final state is committed on start of next action
    }
  };
};

/**
 * Wrapper for multi-vertex color changes (uniform color)
 * This ensures all vertex color changes happen atomically
 */
export const setUniformColor = (objectId: string, color: string) => {
  const store = useVamsStore.getState();
  
  // Use the atomic setAllVertexColors which handles history internally
  store.setAllVertexColors(objectId, color);
};

/**
 * Wrapper for preset color application to all vertices
 */
export const applyColorPresetToVertices = (objectId: string, colors: string[]) => {
  const store = useVamsStore.getState();
  const state = store;
  
  // Push history ONCE before applying all colors
  store.pushToHistory();
  
  // Start batch mode to prevent individual commits
  store.startBatch();
  
  // Update all vertices
  const obj = state.objects.find(o => o.id === objectId);
  if (obj) {
    obj.vertices.forEach((v, i) => {
      if (i < colors.length) {
        // Update without history push (batch mode prevents it anyway)
        useVamsStore.setState((state) => ({
          objects: state.objects.map(o => {
            if (o.id !== objectId) return o;
            return {
              ...o,
              vertices: o.vertices.map(vertex => 
                vertex.id === v.id ? { ...vertex, color: colors[i] } : vertex
              ),
            };
          }),
        }));
      }
    });
  }
  
  // End batch - this commits the final state
  store.endBatch();
};