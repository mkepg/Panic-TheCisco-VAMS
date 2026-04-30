import type { StateCreator } from 'zustand';
import type { VamsState, LessonSlice } from '@/core/store/types';
import type { GlutCallbackKind } from '@/core/types/scene';

const EMPTY_CALLBACKS: Record<GlutCallbackKind, string> = {
  keyboard: '',
  mouse: '',
  reshape: '',
  motion: '',
  idle: '',
};

export const createLessonSlice: StateCreator<VamsState, [], [], LessonSlice> = (set, get) => ({
  activeLessonId: null,
  currentStepIndex: 0,
  exerciseAnswers: {},
  isSuccess: false,
  sceneBackup: null,
  callbacksBackup: null,
  canvasBackgroundColorBackup: null,
  lessonFocusPanel: null,
  dmaDriverStep: null,
  changedCodeLines: [],

  setActiveLesson: (lessonId) => {
    const state = get();
    if (lessonId && !state.activeLessonId) {
      set({
        activeLessonId: lessonId,
        currentStepIndex: 0,
        exerciseAnswers: {},
        isSuccess: false,
        sceneBackup: state.objects,
        callbacksBackup: state.callbacks,
        canvasBackgroundColorBackup: state.canvasBackgroundColor,
        objects: [],
        callbacks: { ...EMPTY_CALLBACKS },
        canvasBackgroundColor: '#000000',
        selectedObjectId: null,
        interactionMode: 'SELECT',
        lessonFocusPanel: null,
        dmaDriverStep: null,
        changedCodeLines: [],
      });
    } else {
      set({
        activeLessonId: lessonId,
        lessonFocusPanel: null,
        dmaDriverStep: null,
        changedCodeLines: [],
      });
    }
  },
  setCurrentStep: (index) => set({ currentStepIndex: index }),
  setExerciseAnswer: (stepId, answer) => set((state) => ({
    exerciseAnswers: {
      ...state.exerciseAnswers,
      [stepId]: answer,
    },
  })),
  setSuccessState: (success) => set({ isSuccess: success }),
  setLessonFocusPanel: (panelId) => set({ lessonFocusPanel: panelId }),
  setDmaDriverStep: (index) => set({ dmaDriverStep: index }),
  setChangedCodeLines: (lines) => set({ changedCodeLines: lines }),
  clearLessonState: () => {
    const state = get();
    set({
      activeLessonId: null,
      currentStepIndex: 0,
      exerciseAnswers: {},
      isSuccess: false,
      objects: state.sceneBackup || [],
      callbacks: state.callbacksBackup || { ...EMPTY_CALLBACKS },
      canvasBackgroundColor: state.canvasBackgroundColorBackup || '#000000',
      sceneBackup: null,
      callbacksBackup: null,
      canvasBackgroundColorBackup: null,
      selectedObjectId: null,
      lessonFocusPanel: null,
      dmaDriverStep: null,
      changedCodeLines: [],
    });
  },
});
