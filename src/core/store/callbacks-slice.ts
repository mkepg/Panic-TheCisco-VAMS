import type { StateCreator } from 'zustand';
import type { VamsState, CallbacksSlice } from '@/core/store/types';
import type { GlutCallbackKind } from '@/core/types/scene';

const CALLBACK_KINDS: GlutCallbackKind[] = [
  'keyboard', 'mouse', 'reshape', 'motion', 'idle',
];

const EMPTY: Record<GlutCallbackKind, string> = {
  keyboard: '',
  mouse: '',
  reshape: '',
  motion: '',
  idle: '',
};

export const createCallbacksSlice: StateCreator<VamsState, [], [], CallbacksSlice> = (set, get) => ({
  callbacks: { ...EMPTY },

  setCallbackHandler: (kind, handlerName) => {
    get().pushToHistory();
    set((state) => ({
      callbacks: { ...state.callbacks, [kind]: handlerName },
    }));
  },

  clearCallback: (kind) => {
    get().pushToHistory();
    set((state) => ({
      callbacks: { ...state.callbacks, [kind]: '' },
    }));
  },

  getRegisteredCallbacks: () => {
    const cb = get().callbacks;
    return CALLBACK_KINDS
      .filter((k) => cb[k] && cb[k].trim().length > 0)
      .map((k) => ({ kind: k, handlerName: cb[k].trim() }));
  },
});
