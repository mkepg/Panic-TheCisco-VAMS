import type { StateCreator } from 'zustand';
import type { VamsState, InteractionSlice } from '@/core/store/types';
export const createInteractionSlice: StateCreator<VamsState, [], [], InteractionSlice> = (set) => ({
  interactionMode: 'SELECT',
  selectedVertexId: null,
  setInteractionMode: (mode) => set({ interactionMode: mode }),
  setSelectedVertex: (vertexId) => set({ selectedVertexId: vertexId }),
});
