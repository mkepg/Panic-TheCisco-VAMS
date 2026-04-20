import type { StateCreator } from 'zustand';
import type { VamsState, SimulationSlice, ObjectSnapshot } from '@/core/store/types';
export const createSimulationSlice: StateCreator<VamsState, [], [], SimulationSlice> = (set, get) => ({
  simulationState: 'STOPPED',
  isGameOver: false,
  initialObjectStates: new Map(),
  play: () => {
    const state = get();
    if (state.simulationState === 'STOPPED') {
      const initialStates = new Map<string, ObjectSnapshot>();
      state.objects.forEach(obj => {
        const snapshot: ObjectSnapshot = JSON.parse(JSON.stringify(obj));
        initialStates.set(obj.id, snapshot);
      });
      set({
        simulationState: 'PLAYING',
        isGameOver: false,
        initialObjectStates: initialStates,
        selectedObjectId: null
      });
    } else {
      set({
        simulationState: 'PLAYING',
        isGameOver: false,
        selectedObjectId: null
      });
    }
  },
  pause: () => set({ simulationState: 'PAUSED' }),
  stop: () => {
    const { initialObjectStates } = get();
    const restoredObjects = Array.from(initialObjectStates.values());
    set({
      simulationState: 'STOPPED',
      isGameOver: false,
      objects: restoredObjects,
      initialObjectStates: new Map(),
      selectedObjectId: null,
    });
  },
  setGameOver: (isGameOver) => set({ isGameOver }),
});