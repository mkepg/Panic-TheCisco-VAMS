import type { Lesson } from '@/core/types/lesson';

export const LESSON_REGISTRY: Record<string, Lesson> = {
  'poc-demo-1': {
    id: 'poc-demo-1',
    title: 'Proof of Concept: Drawing a Triangle',
    type: 'demo',
    section: 'Primitives',
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
  },
  'pipeline-demo-1': {
    id: 'pipeline-demo-1',
    title: 'From Vertex to Pixel',
    type: 'demo',
    section: 'Pipeline',
    steps: [
      {
        narration: "Welcome to the OpenGL Rendering Pipeline. The pipeline is the sequence of steps that takes raw math and turns it into pixels.",
        waitForUser: true,
        action: (state) => {
          state.setPipelineMode('Diagram');
          state.setActivePipelineStage(null);
        }
      },
      {
        narration: "1. Vertex Specification: The application (your code) defines vertices, coordinates, and colors, then sends them to the GPU.",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(0)
      },
      {
        narration: "2. Vertex Processing: The GPU runs operations on each individual vertex, like multiplying them by transformation matrices to position them in the world.",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(1)
      },
      {
        narration: "3. Primitive Assembly: The vertices are grouped together according to the GL primitive type (e.g., three vertices make a GL_TRIANGLES primitive).",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(2)
      },
      {
        narration: "4. Clipping & Culling: Shapes outside the camera's view are cut off (clipped). Triangles facing away from the camera are discarded (backface culling).",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(3)
      },
      {
        narration: "5. Rasterization: The crucial shift! Vector geometry is sliced into a discrete grid of 'fragments'—potential pixels that fall inside the shape.",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(4)
      },
      {
        narration: "6. Fragment Processing: Operations run on every individual fragment to determine its color, such as sampling textures or calculating lighting.",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(5)
      },
      {
        narration: "7. Per-Sample Operations: Final checks occur (like Depth Testing to see if it's hidden behind another shape). If it passes, it's written to the Framebuffer as a final pixel.",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(6)
      },
      {
        narration: "That is the journey from Vertex to Pixel. You have completed the demo!",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(null)
      }
    ]
  }
};