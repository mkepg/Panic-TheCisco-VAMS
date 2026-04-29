import type { Lesson } from '@/core/types/lesson';
import { PIPELINE_LESSONS } from './pipeline-lessons';
import { PRIMITIVES_LESSONS } from './primitives-lessons';
import { BUFFERS_LESSONS } from './buffers-lessons';

export const LESSON_REGISTRY: Record<string, Lesson> = {
  ...PIPELINE_LESSONS,
  ...PRIMITIVES_LESSONS,
  ...BUFFERS_LESSONS,
};
