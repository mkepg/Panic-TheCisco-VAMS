import type { Lesson } from '@/core/types/lesson';
import { PIPELINE_LESSONS } from './pipeline-lessons';
import { PRIMITIVES_LESSONS } from './primitives-lessons';

export const LESSON_REGISTRY: Record<string, Lesson> = {
  ...PIPELINE_LESSONS,
  ...PRIMITIVES_LESSONS,
};