import type { StateCreator } from 'zustand';
import type { VamsState, InteractionSlice } from '@/core/store/types';
export const createInteractionSlice: StateCreator<VamsState, [], [], InteractionSlice> = (set) => ({
  interactionMode: 'SELECT',
  creationMode: null,
  isVertexEditMode: false,
  selectedVertexId: null,
  setInteractionMode: (mode) => set({ interactionMode: mode }),
  setCreationMode: (mode) => set({
    creationMode: mode,
    selectedObjectId: null,
    interactionMode: mode ? 'CREATE' : 'SELECT',
  }),
  toggleVertexEditMode: () => set((state) => ({
    isVertexEditMode: !state.isVertexEditMode,
    interactionMode: !state.isVertexEditMode ? 'VERTEX_EDIT' : 'SELECT',
  })),
  setSelectedVertex: (vertexId) => set({ selectedVertexId: vertexId }),
});