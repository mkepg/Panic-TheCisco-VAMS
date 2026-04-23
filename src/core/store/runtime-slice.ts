import type { StateCreator } from 'zustand';
import type { VamsState, RuntimeSlice } from '@/core/store/types';

export const createRuntimeSlice: StateCreator<VamsState, [], [], RuntimeSlice> = (set) => ({
  appMode: 'Author',
  activeSection: 'Pipeline', // Stage 0 starts with Pipeline as default
  
  setAppMode: (mode) => set({ appMode: mode }),
  setActiveSection: (section) => set({ activeSection: section }),
});