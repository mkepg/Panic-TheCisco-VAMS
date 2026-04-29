import type { VamsState } from '@/core/store/types';
import type { CurriculumSection } from '@/core/store/types';

export type ExerciseWidget =
  | {
      kind: 'multiple-choice';
      prompt: string;
      visualArtifact?:
        | 'vertex-specification'
        | 'vertex-processing'
        | 'primitive-assembly'
        | 'clipping'
        | 'rasterization'
        | 'fragment-processing'
        | 'per-sample-operations';
      options: { id: string; label: string }[];
      correctId: string;
    }
  | {
      kind: 'ordered-list';
      prompt: string;
      items: { id: string; label: string }[];
      correctOrder: string[];
    };

export interface LessonStep {
  narration: string;
  waitForUser?: boolean;
  action?: (state: VamsState) => void;
  successCheck?: (state: VamsState) => boolean;
  codeHighlightTarget?: string;
  exercise?: ExerciseWidget;
  focusPanel?: string; // Targets a specific CollapsibleSection panelId

  /**
   * Drives the Direct Memory Access pointer diagram in the Buffers math panel.
   * When set, the diagram shows this step (0-indexed) and hides its own controls.
   * When omitted/null, the diagram falls back to its standalone state.
   */
  dmaStep?: number | null;
}

export interface Lesson {
  id: string;
  title: string;
  type: 'demo' | 'exercise';
  section: CurriculumSection;
  shuffleRange?: [number, number];
  steps: LessonStep[];
}
