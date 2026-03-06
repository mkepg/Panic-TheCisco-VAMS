import type { StateCreator } from 'zustand';
import type { VamsState, SettingsSlice } from './storeTypes';

export const createSettingsSlice: StateCreator<VamsState, [], [], SettingsSlice> = (set) => ({
  learningSettings: {
    gridSnapping: false,
    angleSnapping: false,
    snapIncrement: 0.1,
    angleSnapDegrees: 15,
    colorMode: 'RGB',
  },
  theme: 'dark',
  canvasBackgroundColor: '#000000',

  updateLearningSettings: (settings) => set((state) => ({ 
    learningSettings: { ...state.learningSettings, ...settings },
  })),

  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'dark' ? 'light' : 'dark' 
  })),

  setCanvasBackgroundColor: (color) => set({ canvasBackgroundColor: color }),
});