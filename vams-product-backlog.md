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

## Epic: Stage 1 — Pipeline (Status: In Progress)
**Purpose:** Cover the OpenGL rendering pipeline, rasterization, NDC, and GLUT program structure.

- [x] **Viewport Mode Controls:** UI for toggling between Pipeline Diagram, Coordinate Playground, and Raster/Vector.
- [x] **Pipeline Diagram View:** Step-through visual diagram of the seven pipeline stages.
- [x] **Raster/Vector View:** Split view illustrating raster vs. vector representations.
- [x] **Coordinate Playground View:** Interactive grid for placing markers and reading NDC positions.
- [x] **GLUT Boilerplate:** Display complete, annotated GLUT boilerplate for an empty scene.
- [x] **Code Annotations:** Hoverable line annotations/tooltips for the GLUT boilerplate.
- [x] **Math Panel - NDC:** Show live NDC coordinates that update as the cursor moves over the viewport.
- [x] **Demo 1: From Vertex to Pixel:** Steps through the 7 pipeline stages (`pipeline-demo-1`).
- [x] **Demo 2: Raster vs Vector:** Demonstrates the raster/vector split view.
- [x] **Demo 3: Normalized Device Coordinates:** Marker placement and coordinate system narration.
- [x] **Demo 4: Anatomy of a GLUT Program:** Steps through the boilerplate line by line.
- [x] **Exercise 1: Place the Point:** Student places a marker at a specified NDC coordinate.
- [x] **Exercise 2: Which Stage?:** Identify the pipeline stage from visual artifacts.
- [x] **Exercise 3: Order the Pipeline:** Reorder scrambled pipeline stage names.

---

## Epic: Stage 2 — Primitives (Status: To Do)
**Purpose:** Geometric primitives, color, line styling, bitmap text, GLUT callbacks.

- [x] **Primitive Palette:** UI to add all curriculum primitives (GL_POINTS, GL_LINES, GL_TRIANGLES, GL_QUADS, GL_POLYGON, etc.).
- [ ] **Color Mode Toggle:** Float (`glColor3f`) vs Byte (`glColor3ub`) color representation per object.
- [ ] **Line Styling:** Controls for `glLineWidth` and `glLineStipple`.
- [ ] **Text Fix:** Refactor text generation to use `glRasterPos2f` + `glutBitmapCharacter` (currently using stroke text in violation of plan).
- [ ] **Callbacks Panel:** UI to register `glutKeyboardFunc`, `glutMouseFunc`, etc., with correct informational framing.
- [ ] **Math Panel - Color:** Conversion formulas (float ↔ byte).
- [ ] **Math Panel - Barycentric:** Barycentric color interpolation equations.
- [ ] **Math Panel - Stipple:** Stipple pattern bit display.
- [ ] **Math Panel - Vertices:** Vertex coordinate table for the selected object.
- [ ] **Demos (4 Minimum):** Drawing a Triangle, Float vs Byte Colors, Barycentric Color Across a Triangle, Line Stippling, Keyboard Callback.
- [ ] **Exercises (4 Minimum):** Build a Triangle, Match the Color, Toggle to Byte Color, Enable Stippling, Register a Mouse Handler.

---

## Epic: Stage 3 — Buffers (Status: To Do)
**Purpose:** Memory management, vertex arrays, VBOs, usage hints, direct memory access.

- [ ] **Rendering Mode Selector:** Toggle between Immediate, Vertex Array, and VBO modes per object.
- [ ] **Buffer Usage Selector:** Select `GL_STATIC_DRAW`, `GL_DYNAMIC_DRAW`, `GL_STREAM_DRAW` (VBO only).
- [ ] **Math Panel - Buffer Flow:** Visual diagram of data transfer between CPU and GPU over a timeline.
- [ ] **Math Panel - DMA:** Visual pointer diagram for direct memory access (`glMapBuffer`).
- [ ] **Math Panel - Size Calcs:** Buffer size formula and array vs. indexed savings display.
- [ ] **Math Panel - Interleaved Layout:** Diagram for combined position + color buffers.
- [ ] **Demos (4 Minimum):** Immediate Mode, Converting to Vertex Arrays, VBOs: Send Once, Buffer Usage Hints, glMapBuffer.
- [ ] **Exercises (4 Minimum):** Switch to VBO, Use Static for Unchanging Data, Reduce Memory with Indexed Drawing, Pick the Right Usage Hint.

---

## Epic: Stage 4 — Transforms (Status: To Do)
**Purpose:** Matrix math, transformations, matrix stack, orthographic viewing.

- [x] **Transform Gizmo:** Canvas overlay for Translate, Rotate, and Scale modes.
- [x] **Numeric Transform Inputs:** Base UI for X/Y position, rotation, and scale.
- [x] **Non-Uniform Scale:** Aspect-ratio lock toggle and independent scaling integration.
- [ ] **Matrix Stack Panel:** Compact vertical list showing nested `glPushMatrix`/`glPopMatrix`.
- [ ] **glOrtho Editor:** Dedicated numeric inputs (left, right, bottom, top) to control viewport range.
- [ ] **Math Panel - Matrices:** 4×4 matrix display, matrix composition trace, glOrtho mapping equation.
- [ ] **Demos (4 Minimum):** Translate/Rotate/Scale, Matrix Representation, The Matrix Stack, glOrtho.
- [ ] **Exercises (4 Minimum):** Translate to Position, Rotate to Angle, Build a Hierarchy, Set the Viewport Range.

---

## Epic: Stage 5 — Textures (Status: To Do)
**Purpose:** Texture mapping, image loading, UV coordinates, filtering, wrapping.

- [ ] **Texture Library:** Image upload, thumbnail list, delete functionality, and bundled sample textures.
- [ ] **Texture Attachment:** Apply loaded textures to scene objects.
- [ ] **Filter Mode Toggle:** Select between `GL_NEAREST` and `GL_LINEAR`.
- [ ] **Wrap Mode Toggle:** Select between `GL_REPEAT` and `GL_CLAMP_TO_EDGE`.
- [ ] **UV Editor:** Compact inline panel for dragging UV handles.
- [ ] **Math Panel - Textures:** UV coordinate table, texel sampling equations, wrap equations, UV barycentric interpolation.
- [ ] **Texture Persistence:** Save/Load project files with bundled texture image data.
- [ ] **Missing Texture Handling:** Detach missing textures cleanly with a calm toast message on load.
- [ ] **Demos (4 Minimum):** From Image to Texture, UV Coordinates, Filtering, Wrapping, Texture on a Triangle.
- [ ] **Exercises (4 Minimum):** Apply a Texture, Tile the Texture, Pixelate, Map UVs to Match Target.

---

## Epic: Quality, Milestones & Technical Debt (Ongoing)
- [ ] **Constraint Audit:** Ensure absolutely no "lighting" or "3D" terminology leaks into UI strings or code generation.
- [ ] **M1 Release:** Polish Stage 1 for initial distribution to the FEU Tech course.
- [ ] **M2 Release Gate:** Collect actionable feedback from at least 5 students and the instructor before proceeding past Stage 2.
