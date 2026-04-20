import type { StateCreator } from 'zustand';
import type { VamsState, CustomShapeBuilderSlice } from '@/core/store/types';
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
      selectedObjectId: null,
    }),
  cancelCustomShape: () =>
    set({
      pendingShapeType: null,
      pendingVertices: [],
      interactionMode: 'SELECT',
    }),
  addPendingVertex: (x, y) => {
    get().pushToHistory();
    set((state) => ({
      pendingVertices: [...state.pendingVertices, { x, y }],
    }));
  },
  addManualVertex: () => {
    get().pushToHistory();
    set((state) => ({
      pendingVertices: [...state.pendingVertices, { x: 0, y: 0 }],
    }));
  },
  removeLastPendingVertex: () => {
    get().pushToHistory();
    set((state) => ({
      pendingVertices: state.pendingVertices.slice(0, -1),
    }));
  },
  removePendingVertexAt: (index) => {
    get().pushToHistory();
    set((state) => ({
      pendingVertices: state.pendingVertices.filter((_, i) => i !== index),
    }));
  },
  updatePendingVertex: (index, x, y) => {
    set((state) => ({
      pendingVertices: state.pendingVertices.map((v, i) =>
        i === index ? { x, y } : v
      ),
    }));
  },
});