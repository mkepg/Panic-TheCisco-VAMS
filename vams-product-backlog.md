# VAMS Product Backlog

Based on the `plan.md` and the current state of the repository, here is the comprehensive backlog for the Visual Animation Modeling Simulator (VAMS) project.

## Epic: Stage 0 — Foundation (Status: Done)
**Purpose:** Establish the application shell, state architecture, and rendering infrastructure.

- [x] **Workspace Layout:** Implement top bar, tools rail, 2D canvas, code panel, and math panel.
- [x] **State Architecture:** Create distinct slices for Scene, View, History, Runtime, and Lesson state.
- [x] **Code Generation:** Develop deterministic code generator producing OpenGL output from scene state.
- [x] **2D Rendering:** Implement PixiJS-based 2D canvas rendering corresponding to scene state.
- [x] **History State:** End-to-end Undo/Redo functionality across all scene mutations.
- [x] **Project I/O:** Save and load full scene as a project JSON file.
- [x] **Lesson Engine:** Skeleton for scripted, narrated, multi-step demos with scene mutations.
- [x] **Section Switching:** Implement section selector with correct state preservation semantics.
- [x] **Math Panel Scaffold:** Basic UI shell for contextual mathematical breakdowns.
- [x] **Constraint Enforcement:** Ensure no deferred symbols (e.g., lighting, 3D projections) are emitted in code.

---

## Epic: Stage 1 — Pipeline (Status: Done)
**Purpose:** Cover the OpenGL rendering pipeline, rasterization, NDC, and GLUT program structure.

- [x] All viewport modes, demos, exercises, and math-panel content for the Pipeline section.

---

## Epic: Stage 2 — Primitives (Status: Done)
**Purpose:** Geometric primitives, color, line styling, bitmap text, GLUT callbacks.

- [x] **Primitive Palette:** UI to add all curriculum primitives (GL_POINTS, GL_LINES, GL_TRIANGLES, GL_QUADS, GL_POLYGON, etc.).
- [x] **Color Mode Toggle:** Float (`glColor3f`) vs Byte (`glColor3ub`) color representation per object.
- [x] **Line Styling:** Controls for `glLineWidth` and `glLineStipple` (factor, 16-bit pattern, presets, bit toggles).
- [x] **Text Fix:** Refactored text generation to `glRasterPos2f` + `glutBitmapCharacter` (replaced stroke-text in violation of plan).
- [x] **Callbacks Panel:** UI to register `glutKeyboardFunc`, `glutMouseFunc`, `glutMotionFunc`, `glutReshapeFunc`, `glutIdleFunc`, with the required informational framing note.
- [x] **Math Panel — Color:** Conversion formulas (float ↔ byte) with live swatch.
- [x] **Math Panel — Barycentric:** `C = α·C₀ + β·C₁ + γ·C₂` formula plus live corner swatches.
- [x] **Math Panel — Stipple:** Live 16-bit pattern visualization with hex/factor/lit-count.
- [x] **Math Panel — Vertices:** Vertex coordinate table for the selected object.
- [x] **Demos (5):** Drawing a Triangle, Float vs Byte Colors, Barycentric Color Across a Triangle, Line Stippling, Keyboard Callback.
- [x] **Exercises (5):** Build a Triangle, Match the Color, Toggle to Byte Color, Enable Stippling, Register a Mouse Handler.
- [x] **Project I/O round-trip:** New per-object fields and registered callbacks bumped to schema v3.

---

## Epic: Stage 3 — Buffers (Status: To Do)
**Purpose:** Memory management, vertex arrays, VBOs, usage hints, direct memory access.

- [ ] **Rendering Mode Selector:** Toggle between Immediate, Vertex Array, and VBO modes per object.
- [ ] **Buffer Usage Selector:** Select `GL_STATIC_DRAW`, `GL_DYNAMIC_DRAW`, `GL_STREAM_DRAW` (VBO only).
- [ ] **Math Panel — Buffer Flow:** Visual diagram of data transfer between CPU and GPU over a timeline.
- [ ] **Math Panel — DMA:** Visual pointer diagram for direct memory access (`glMapBuffer`).
- [ ] **Math Panel — Size Calcs:** Buffer size formula and array vs. indexed savings display.
- [ ] **Math Panel — Interleaved Layout:** Diagram for combined position + color buffers.
- [ ] **Demos (4 Minimum):** Immediate Mode, Converting to Vertex Arrays, VBOs: Send Once, Buffer Usage Hints, glMapBuffer.
- [ ] **Exercises (4 Minimum):** Switch to VBO, Use Static for Unchanging Data, Reduce Memory with Indexed Drawing, Pick the Right Usage Hint.

---

## Epic: Stage 4 — Transforms (Status: Partial)
**Purpose:** Matrix math, transformations, matrix stack, orthographic viewing.

- [x] Transform gizmo (translate/rotate/scale), numeric inputs, non-uniform scale with aspect lock.
- [ ] Matrix stack panel, glOrtho editor, matrix math content, demos, and exercises.

---

## Epic: Stage 5 — Textures (Status: To Do)
Untouched — see `plan.md` for full scope.

---

## Epic: Quality, Milestones & Technical Debt (Ongoing)
- [x] **Constraint Audit (Stage 2):** No "lighting" or "3D" terminology in any new strings or generated code.
- [ ] **M1 Release:** Polish Stage 1 for initial distribution to the FEU Tech course.
- [ ] **M2 Release Gate:** Collect feedback from at least 5 students and the instructor before proceeding past Stage 2.
