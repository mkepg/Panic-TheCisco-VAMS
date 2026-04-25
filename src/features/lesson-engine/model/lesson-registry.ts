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
            { x: 0.5, y: -0.5 },
          ]);
        },
      },
      {
        narration: "Notice how the C++ code updated? Let's hide the triangle.",
        waitForUser: true,
        action: (state) => {
          const triangle = state.objects.find((o) => o.type === 'TRIANGLES');
          if (triangle) state.toggleObjectVisibility(triangle.id);
        },
      },
      {
        narration: "Hidden objects are excluded from the display loop. You've completed the demo!",
        waitForUser: true,
      },
    ],
  },

  'pipeline-demo-1': {
    id: 'pipeline-demo-1',
    title: 'From Vertex to Pixel',
    type: 'demo',
    section: 'Pipeline',
    steps: [
      {
        narration:
          "Welcome to the rendering pipeline — the assembly line that turns your code into pixels on screen.",
        waitForUser: true,
        action: (state) => {
          state.setPipelineMode('Diagram');
          state.setActivePipelineStage(null);
        },
      },
      {
        narration:
          "1. Vertex Specification — your code lists the points (vertices) that describe each shape, along with their colors.",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(0),
      },
      {
        narration:
          "2. Vertex Processing — each vertex is moved into its final position using transformation matrices.",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(1),
      },
      {
        narration:
          "3. Primitive Assembly — vertices are connected into actual shapes: points, lines, or triangles.",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(2),
      },
      {
        narration:
          "4. Clipping — anything outside the visible window is cut away. No work is wasted on offscreen pixels.",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(3),
      },
      {
        narration:
          "5. Rasterization — the moment vector becomes raster. Smooth shapes are sliced into a grid of square fragments.",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(4),
      },
      {
        narration:
          "6. Fragment Processing — each fragment receives its final color. Textures and effects are applied here.",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(5),
      },
      {
        narration:
          "7. Per-Sample Operations — final tests decide which fragments survive and become pixels on the screen.",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(6),
      },
      {
        narration: "That's the journey from vertex to pixel. You've completed the demo!",
        waitForUser: true,
        action: (state) => state.setActivePipelineStage(null),
      },
    ],
  },

  'pipeline-demo-2': {
    id: 'pipeline-demo-2',
    title: 'Vector vs Raster',
    type: 'demo',
    section: 'Pipeline',
    steps: [
      {
        narration:
          "Computer graphics has two ways of describing shapes. Let's compare them side by side.",
        waitForUser: true,
        action: (state) => state.setPipelineMode('RasterVector'),
      },
      {
        narration:
          "On the left: a vector triangle. It's described by three points and exact equations. Zoom in forever — the edges stay crisp.",
        waitForUser: true,
      },
      {
        narration:
          "On the right: the same triangle as raster. It's been sliced into a grid of square fragments — what your screen actually displays.",
        waitForUser: true,
      },
      {
        narration:
          "The pipeline's job is to convert vector input into raster output. Every shape you draw goes through this transformation.",
        waitForUser: true,
      },
    ],
  },

  'pipeline-demo-3': {
    id: 'pipeline-demo-3',
    title: 'Normalized Device Coordinates',
    type: 'demo',
    section: 'Pipeline',
    steps: [
      {
        narration:
          "OpenGL doesn't think in pixels. It uses a clean coordinate system called NDC, ranging from -1 to +1 on each axis.",
        waitForUser: true,
        action: (state) => state.setPipelineMode('Playground'),
      },
      {
        narration:
          "Move your cursor across the canvas — watch the math panel on the right. Those decimals are the cursor's NDC position.",
        waitForUser: true,
      },
      {
        narration:
          "(0, 0) sits at the dead center. (-1, -1) is the bottom-left corner. (+1, +1) is the top-right.",
        waitForUser: true,
      },
      {
        narration:
          "Why use NDC? Because shapes defined in NDC look identical regardless of window size. The pixel mapping happens automatically.",
        waitForUser: true,
      },
    ],
  },

  'pipeline-demo-4': {
    id: 'pipeline-demo-4',
    title: 'Anatomy of a GLUT Program',
    type: 'demo',
    section: 'Pipeline',
    steps: [
      {
        narration:
          "Every OpenGL program with FreeGLUT follows the same skeleton. Let's walk through what each section does.",
        waitForUser: true,
        action: (state) => state.setPipelineMode('Playground'),
      },
      {
        narration:
          "At the top: #include directives bring in FreeGLUT — the library that handles windowing and OpenGL setup.",
        waitForUser: true,
      },
      {
        narration:
          "Next: the display() function. This is your painter. GLUT calls it whenever the window needs redrawing.",
        waitForUser: true,
      },
      {
        narration:
          "Inside display(): glClear wipes the screen, draw() does the work, and glutSwapBuffers shows the result smoothly.",
        waitForUser: true,
      },
      {
        narration:
          "Then: main(). It initializes GLUT, opens the window, registers display() as the painter, and starts the event loop.",
        waitForUser: true,
      },
      {
        narration:
          "Hover any line in the code panel for a closer look. You've completed the demo!",
        waitForUser: true,
      },
    ],
  },

  'pipeline-exercise-1': {
    id: 'pipeline-exercise-1',
    title: 'Place the Point',
    type: 'exercise',
    section: 'Pipeline',
    steps: [
      {
        narration:
          "Let's practice working in NDC. We'll add a point at the origin — your job is to move it.",
        waitForUser: true,
        action: (state) => {
          state.setPipelineMode('Playground');
          const exists = state.objects.find((o) => o.type === 'POINTS');
          if (!exists) state.addCustomObject('POINTS', [{ x: 0, y: 0 }]);
        },
      },
      {
        narration:
          "Drag the point to land on (0.5, 0.5). Just get reasonably close. Once you’ve placed it, release the point.",
        waitForUser: true,
        successCheck: (state) => {
          const pt = state.objects.find((o) => o.type === 'POINTS');
          if (!pt) return false;
          const dx = pt.transform.translateX - 0.5;
          const dy = pt.transform.translateY - 0.5;
          return Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15;
        },
      },
      {
        narration:
          "Excellent! Look at the code panel — glVertex2f reflects exactly where you placed the point.",
        waitForUser: true,
      },
    ],
  },

  'pipeline-exercise-2': {
    id: 'pipeline-exercise-2',
    title: 'Which Stage?',
    type: 'exercise',
    section: 'Pipeline',
    steps: [
      {
        narration: "Look at the diagram. Which stage converts smooth shapes into a grid of fragments?",
        waitForUser: true,
        action: (state) => state.setPipelineMode('Diagram'),
        exercise: {
          kind: 'multiple-choice',
          prompt: 'Which stage converts vector geometry into fragments?',
          options: [
            { id: 'a', label: 'Vertex Processing' },
            { id: 'b', label: 'Primitive Assembly' },
            { id: 'c', label: 'Rasterization' },
            { id: 'd', label: 'Per-Sample Operations' },
          ],
          correctId: 'c',
        },
      },
      {
        narration:
          "Correct! Rasterization is the moment vector geometry becomes raster fragments — the threshold between the two worlds.",
        waitForUser: true,
      },
    ],
  },

  'pipeline-exercise-3': {
    id: 'pipeline-exercise-3',
    title: 'Order the Pipeline',
    type: 'exercise',
    section: 'Pipeline',
    steps: [
      {
        narration:
          "Drag the stages into the order they actually run. The first stage receives data straight from your code.",
        waitForUser: true,
        action: (state) => state.setPipelineMode('Diagram'),
        exercise: {
          kind: 'ordered-list',
          prompt: 'Drag stages into the correct execution order:',
          items: [
            { id: 'rast', label: 'Rasterization' },
            { id: 'frag', label: 'Fragment Processing' },
            { id: 'prim', label: 'Primitive Assembly' },
            { id: 'vspec', label: 'Vertex Specification' },
            { id: 'vproc', label: 'Vertex Processing' },
            { id: 'clip', label: 'Clipping' },
            { id: 'out', label: 'Per-Sample Operations' },
          ],
          correctOrder: ['vspec', 'vproc', 'prim', 'clip', 'rast', 'frag', 'out'],
        },
      },
      {
        narration: "Perfect! That's the OpenGL pipeline from start to finish.",
        waitForUser: true,
      },
    ],
  },
};