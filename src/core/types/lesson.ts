import type { VamsState } from '@/core/store/types';
import type { CurriculumSection } from '@/core/store/types';

export interface LessonStep {
  narration: string;
  waitForUser?: boolean;
  /** A scripted scene mutation that fires when this step is reached */
  action?: (state: VamsState) => void;
  /** A pure function to check if the student has met the exercise goal */
  successCheck?: (state: VamsState) => boolean;
  /** The sanitized name of the object to highlight in the code panel */
  codeHighlightTarget?: string;
}

export interface Lesson {
  id: string;
  title: string;
  type: 'demo' | 'exercise';
  section: CurriculumSection;
  steps: LessonStep[];
}