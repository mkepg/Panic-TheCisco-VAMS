import type { Lesson } from '@/core/types/lesson';

export const LESSON_REGISTRY: Record<string, Lesson> = {
  'poc-demo-1': {
    id: 'poc-demo-1',
    title: 'Proof of Concept: Drawing a Triangle',
    type: 'demo',
    section: 'Pipeline',
    steps: [
      {
        narration: "Welcome to VAMS! In this demo, we'll see how scene actions reflect in the code panel.",
        waitForUser: true,
      },
      {
        narration: "Let's automatically add a triangle to the scene.",
        waitForUser: true,
        action: (state) => {
          state.addCustomObject('TRIANGLES', [
            { x: 0, y: 0.5 },
            { x: -0.5, y: -0.5 },
            { x: 0.5, y: -0.5 }
          ]);
        }
      },
      {
        narration: "Notice how the C++ code updated? Let's hide the triangle.",
        waitForUser: true,
        action: (state) => {
          const triangle = state.objects.find(o => o.type === 'TRIANGLES');
          if (triangle) {
            state.toggleObjectVisibility(triangle.id);
          }
        }
      },
      {
        narration: "The code for the hidden object is completely excluded from the display loop. You've completed the demo!",
        waitForUser: true,
      }
    ]
  }
};