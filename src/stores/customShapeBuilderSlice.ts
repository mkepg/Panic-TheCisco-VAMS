// src/stores/customShapeBuilderSlice.ts
import type { StateCreator } from 'zustand';
import type { VamsState, CustomShapeBuilderSlice } from './storeTypes';

export const createCustomShapeBuilderSlice: StateCreator<VamsState, [], [], CustomShapeBuilderSlice> = (set, get) => ({
  pendingShapeType: null,
  pendingVertices: [],
  pendingMinVertices: 1,

  startCustomShape: (type, minVertices) =>
    set({
      pendingShapeType: type,
      pendingVertices: [],
      pendingMinVertices: minVertices,
      interactionMode: 'CUSTOM_SHAPE_PLACE',
      selectedObjectId: null, // ← This deselects the object
    }),

  cancelCustomShape: () =>
    set({
      pendingShapeType: null,
      pendingVertices: [],
      interactionMode: 'SELECT',
    }),

  addPendingVertex: (x, y) => {
    // Push to history BEFORE adding vertex
    // This allows undoing individual vertex placements
    get().pushToHistory();
    
    set((state) => ({
      pendingVertices: [...state.pendingVertices, { x, y }],
    }));
  },

  addManualVertex: () => {
    // Push to history BEFORE adding manual vertex
    get().pushToHistory();
    
    set((state) => ({
      pendingVertices: [...state.pendingVertices, { x: 0, y: 0 }],
    }));
  },

  removeLastPendingVertex: () => {
    // Push to history BEFORE removing vertex
    get().pushToHistory();
    
    set((state) => ({
      pendingVertices: state.pendingVertices.slice(0, -1),
    }));
  },

  removePendingVertexAt: (index) => {
    // Push to history BEFORE removing specific vertex
    get().pushToHistory();
    
    set((state) => ({
      pendingVertices: state.pendingVertices.filter((_, i) => i !== index),
    }));
  },

  updatePendingVertex: (index, x, y) => {
    // NO history push - caller manages this for dragging
    // For dragging pending vertices, pushToHistory() should be called once at drag start
    set((state) => ({
      pendingVertices: state.pendingVertices.map((v, i) =>
        i === index ? { x, y } : v
      ),
    }));
  },
});