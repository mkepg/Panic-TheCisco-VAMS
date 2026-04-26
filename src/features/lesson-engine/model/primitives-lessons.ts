import type { Lesson } from '@/core/types/lesson';

export const PRIMITIVES_LESSONS: Record<string, Lesson> = {
  'primitives-demo-1': {
    id: 'primitives-demo-1',
    title: 'Drawing a Triangle',
    type: 'demo',
    section: 'Primitives',
    steps: [
      {
        narration: "Every triangle starts the same way: three vertices, fed to OpenGL between glBegin and glEnd.",
        waitForUser: true,
      },
      {
        narration: "Watch the code panel as we add the first vertex.",
        waitForUser: true,
        focusPanel: 'primitive-palette',
        action: (state) => {
          state.startCustomShape('TRIANGLES', 3, 3);
          state.addPendingVertex(0, 0.5);
        },
      },
      {
        narration: "Second vertex — notice glVertex2f appearing in the draw block.",
        waitForUser: true,
        action: (state) => state.addPendingVertex(-0.5, -0.5),
      },
      {
        narration: "And the third vertex closes the primitive.",
        waitForUser: true,
        focusPanel: 'primitive-palette',
        action: (state) => {
          state.addCustomObject('TRIANGLES', [...state.pendingVertices, { x: 0.5, y: -0.5 }]);
        },
      },
      {
        narration: "That's it — three points, one GL_TRIANGLES primitive. The vertex data lives in the draw function alongside the corresponding glColor3f and glVertex2f calls.",
        waitForUser: true,
      },
    ],
  },
  'primitives-demo-2': {
    id: 'primitives-demo-2',
    title: 'Float vs Byte Colors',
    type: 'demo',
    section: 'Primitives',
    steps: [
      {
        narration: "OpenGL accepts colors in two flavors: normalized floats from 0.0–1.0, or unsigned bytes from 0–255.",
        waitForUser: true,
        action: (state) => {
          state.addCustomObject('TRIANGLES', [
            { x: 0, y: 0.4 }, { x: -0.4, y: -0.3 }, { x: 0.4, y: -0.3 },
          ]);
          const obj = state.objects[0];
          if (obj) state.setAllVertexColors(obj.id, '#3b82f6');
        },
      },
      {
        narration: "By default, the generator emits glColor3f. Floats are easy to interpolate and feel natural for math.",
        waitForUser: true,
      },
      {
        narration: "Watch what happens when we switch the same triangle to byte mode.",
        waitForUser: true,
        focusPanel: 'appearance-panel',
        action: (state) => {
          const obj = state.objects[0];
          if (obj) state.updateObjectColorMode(obj.id, 'BYTE');
        },
      },
      {
        narration: "glColor3ub now appears in the code — same color visually, different representation. The math panel shows the conversion: byte ÷ 255 = float.",
        waitForUser: true,
      },
    ],
  },
  'primitives-demo-3': {
    id: 'primitives-demo-3',
    title: 'Barycentric Color Across a Triangle',
    type: 'demo',
    section: 'Primitives',
    steps: [
      {
        narration: "Per-vertex colors unlock smooth gradients. The trick is barycentric interpolation — each pixel mixes the three corner colors.",
        waitForUser: true,
        action: (state) => {
          state.addCustomObject('TRIANGLES', [
            { x: 0, y: 0.5 }, { x: -0.5, y: -0.4 }, { x: 0.5, y: -0.4 },
          ]);
        },
      },
      {
        narration: "Let's paint each vertex a different color.",
        waitForUser: true,
        focusPanel: 'appearance-panel',
        action: (state) => {
          const obj = state.objects[0];
          if (!obj) return;
          state.updateVertexColor(obj.id, obj.vertices[0].id, '#ef4444');
          state.updateVertexColor(obj.id, obj.vertices[1].id, '#22c55e');
          state.updateVertexColor(obj.id, obj.vertices[2].id, '#3b82f6');
        },
      },
      {
        narration: "The fragment processor blends these corner colors smoothly. The math panel shows the formula: C = α·C₀ + β·C₁ + γ·C₂, with the weights summing to 1.",
        waitForUser: true,
      },
    ],
  },
  'primitives-demo-4': {
    id: 'primitives-demo-4',
    title: 'Line Stippling',
    type: 'demo',
    section: 'Primitives',
    steps: [
      {
        narration: "Stippling turns a solid line into a repeating dot/dash pattern using a 16-bit mask.",
        waitForUser: true,
        action: (state) => {
          state.addCustomObject('LINE_STRIP', [
            { x: -0.7, y: 0 }, { x: 0, y: 0.4 }, { x: 0.7, y: 0 },
          ]);
        },
      },
      {
        narration: "We'll thicken the line first so the pattern is easy to see.",
        waitForUser: true,
        focusPanel: 'line-style-panel',
        action: (state) => {
          const obj = state.objects[0];
          if (obj) state.updateLineWidth(obj.id, 4);
        },
      },
      {
        narration: "Now apply a dashed pattern: 0x00FF — eight off, eight on.",
        waitForUser: true,
        focusPanel: 'line-style-panel',
        action: (state) => {
          const obj = state.objects[0];
          if (obj) state.updateLineStipple(obj.id, { factor: 1, pattern: 0x00FF });
        },
      },
      {
        narration: "Bumping the factor stretches each bit — useful when the pattern is too dense to read.",
        waitForUser: true,
        focusPanel: 'line-style-panel',
        action: (state) => {
          const obj = state.objects[0];
          if (obj) state.updateLineStipple(obj.id, { factor: 3, pattern: 0x00FF });
        },
      },
      {
        narration: "The math panel shows the active 16 bits and how many are lit. The code panel shows glLineStipple wrapped between glEnable and glDisable.",
        waitForUser: true,
      },
    ],
  },
  'primitives-demo-5': {
    id: 'primitives-demo-5',
    title: 'Keyboard Callback',
    type: 'demo',
    section: 'Primitives',
    steps: [
      {
        narration: "Interactive programs respond to events. GLUT calls your registered handler when the user types, clicks, or resizes the window.",
        waitForUser: true,
      },
      {
        narration: "Let's register a keyboard handler called 'onKey'.",
        waitForUser: true,
        focusPanel: 'callbacks-panel',
        action: (state) => state.setCallbackHandler('keyboard', 'onKey'),
      },
      {
        narration: "Notice the new glutKeyboardFunc registration in main(), plus the empty handler stub above it. The handler runs only when you compile and execute the exported program — VAMS shows you exactly what to write, not how to run it.",
        waitForUser: true,
      },
      {
        narration: "You can register handlers for mouse, motion, reshape, and idle the same way. Each one inserts its corresponding glut*Func call.",
        waitForUser: true,
      },
    ],
  },
  'primitives-exercise-1': {
    id: 'primitives-exercise-1',
    title: 'Build a Triangle',
    type: 'exercise',
    section: 'Primitives',
    steps: [
      {
        narration: "Add a triangle to the empty scene using the GL_TRIANGLES button in the primitive palette.",
        waitForUser: true,
        focusPanel: 'primitive-palette',
        successCheck: (state) =>
          state.objects.some((o) => o.type === 'TRIANGLES' && o.vertices.length >= 3),
      },
      {
        narration: "Nice. The draw function now contains a glBegin(GL_TRIANGLES) block with three vertices.",
        waitForUser: true,
      },
    ],
  },
  'primitives-exercise-2': {
    id: 'primitives-exercise-2',
    title: 'Match the Color',
    type: 'exercise',
    section: 'Primitives',
    steps: [
      {
        narration: "Use the color picker in the appearance panel to make the triangle below match this target color: #f59e0b (a warm amber).",
        waitForUser: true,
        focusPanel: 'appearance-panel',
        action: (state) => {
          if (state.objects.length === 0) {
            state.addCustomObject('TRIANGLES', [
              { x: 0, y: 0.4 }, { x: -0.4, y: -0.3 }, { x: 0.4, y: -0.3 },
            ]);
          }
        },
        successCheck: (state) => {
          const obj = state.objects.find((o) => o.type === 'TRIANGLES');
          if (!obj) return false;
          const target: [number, number, number] = [0xf5, 0x9e, 0x0b];
          return obj.vertices.every((v) => {
            const r = parseInt(v.color.slice(1, 3), 16);
            const g = parseInt(v.color.slice(3, 5), 16);
            const b = parseInt(v.color.slice(5, 7), 16);
            return (
              Math.abs(r - target[0]) < 12 &&
              Math.abs(g - target[1]) < 12 &&
              Math.abs(b - target[2]) < 12
            );
          });
        },
      },
      {
        narration: "Close enough — the generated glColor3f reflects your pick.",
        waitForUser: true,
      },
    ],
  },
  'primitives-exercise-3': {
    id: 'primitives-exercise-3',
    title: 'Toggle to Byte Color',
    type: 'exercise',
    section: 'Primitives',
    steps: [
      {
        narration: "Switch the triangle below to byte color mode using the Float / Byte toggle.",
        waitForUser: true,
        focusPanel: 'appearance-panel',
        action: (state) => {
          if (state.objects.length === 0) {
            state.addCustomObject('TRIANGLES', [
              { x: 0, y: 0.4 }, { x: -0.4, y: -0.3 }, { x: 0.4, y: -0.3 },
            ]);
          }
        },
        successCheck: (state) => {
          const obj = state.objects.find((o) => o.type === 'TRIANGLES');
          return !!obj && obj.colorMode === 'BYTE';
        },
      },
      {
        narration: "glColor3f became glColor3ub. Same color, integer values 0–255.",
        waitForUser: true,
      },
    ],
  },
  'primitives-exercise-4': {
    id: 'primitives-exercise-4',
    title: 'Enable Stippling',
    type: 'exercise',
    section: 'Primitives',
    steps: [
      {
        narration: "Apply a stipple to the line below. Use factor 2 and pattern 0x00FF (the 'Long-dash' preset works).",
        waitForUser: true,
        focusPanel: 'line-style-panel',
        action: (state) => {
          if (state.objects.length === 0) {
            state.addCustomObject('LINE_STRIP', [
              { x: -0.7, y: 0 }, { x: 0, y: 0.4 }, { x: 0.7, y: 0 },
            ]);
          }
        },
        successCheck: (state) => {
          const line = state.objects.find(
            (o) => o.type === 'LINE_STRIP' || o.type === 'LINES' || o.type === 'LINE_LOOP'
          );
          if (!line || !line.lineStipple) return false;
          return line.lineStipple.factor === 2 && line.lineStipple.pattern === 0x0FFF;
        },
      },
      {
        narration: "Generated code now wraps the line in glEnable(GL_LINE_STIPPLE) / glLineStipple / glDisable.",
        waitForUser: true,
      },
    ],
  },
  'primitives-exercise-5': {
    id: 'primitives-exercise-5',
    title: 'Register a Mouse Handler',
    type: 'exercise',
    section: 'Primitives',
    steps: [
      {
        narration: "Open the Callbacks panel and register a mouse handler. Any valid C++ identifier works — the goal is to see glutMouseFunc appear in main().",
        waitForUser: true,
        focusPanel: 'callbacks-panel',
        successCheck: (state) => {
          const name = (state.callbacks.mouse || '').trim();
          return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
        },
      },
      {
        narration: "Done. The generated program now has a glutMouseFunc registration plus the empty handler stub waiting for your real code when you compile.",
        waitForUser: true,
      },
    ],
  },
};