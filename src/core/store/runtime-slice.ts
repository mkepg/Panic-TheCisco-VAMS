import type { StateCreator } from 'zustand';
import type { VamsState, RuntimeSlice } from '@/core/store/types';

export const createRuntimeSlice: StateCreator<VamsState, [], [], RuntimeSlice> = (set) => ({
  appMode: 'Author',
  activeSection: 'Pipeline',
  pipelineMode: 'Playground',
  activePipelineStage: null,
  cursorWorld: null,

  setAppMode: (mode) => set({ appMode: mode }),

  setActiveSection: (section) => set((state) => {
    if (state.activeSection === section) return {};
    return {
      activeSection: section,
      pipelineMode: 'Playground',
      activePipelineStage: null,
    };
  }),

  setPipelineMode: (mode) => set({ pipelineMode: mode }),
  setActivePipelineStage: (stageIndex) => set({ activePipelineStage: stageIndex }),
  setCursorWorld: (pos) => set({ cursorWorld: pos }),
});
