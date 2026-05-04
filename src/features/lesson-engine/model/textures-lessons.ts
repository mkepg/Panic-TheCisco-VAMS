import type { Lesson } from '@/core/types/lesson';
import type { VamsState } from '@/core/store/types';

const SAMPLE_CHECKER  = 'sample-checker';
const SAMPLE_UVTEST   = 'sample-uvtest';
const SAMPLE_SEAMLESS = 'sample-seamless';

const QUAD_VERTS = [
  { x: -0.5, y: -0.5 },
  { x:  0.5, y: -0.5 },
  { x:  0.5, y:  0.5 },
  { x: -0.5, y:  0.5 },
];

const TRI_VERTS = [
  { x:  0.0, y:  0.6 },
  { x: -0.6, y: -0.4 },
  { x:  0.6, y: -0.4 },
];

const withSelected = (state: VamsState) =>
  state.objects.find((o) => o.id === state.selectedObjectId);

export const TEXTURES_LESSONS: Record<string, Lesson> = {
  'textures-demo-1': {
    id: 'textures-demo-1',
    title: 'From Image to Texture',
    type: 'demo',
    section: 'Textures',
    steps: [
      {
        narration:
          "Welcome to Textures! In OpenGL, an image becomes a texture object — a chunk of GPU memory that primitives can sample from.",
        waitForUser: true,
      },
      {
        narration: "First, a quad to paint on. Watch the code panel for what happens next.",
        waitForUser: true,
        action: (state: VamsState) => {
          state.addCustomObject('QUADS', QUAD_VERTS);
        },
      },
      {
        narration:
          "Now we attach the Checker sample. Look at the code panel: #include \"stb_image.h\" was added to the top, and the image loading block sits inside init().",
        waitForUser: true,
        focusPanel: 'texture-attach',
        action: (state: VamsState) => {
          const obj = withSelected(state);
          if (obj) state.attachTexture(obj.id, SAMPLE_CHECKER);
        },
      },
      {
        narration:
          "And in the draw routine: glEnable(GL_TEXTURE_2D), glBindTexture, then per-vertex glTexCoord2f calls before each glVertex2f.",
        waitForUser: true,
      },
      {
        narration:
          "The shape's geometry didn't change — only what gets sampled per fragment did. Texturing is a per-fragment operation.",
        waitForUser: true,
      },
    ],
  },

  'textures-demo-2': {
    id: 'textures-demo-2',
    title: 'UV Coordinates',
    type: 'demo',
    section: 'Textures',
    steps: [
      {
        narration:
          "UVs map vertices to points in the texture. (0,0) is the bottom-left of the texture, (1,1) is the top-right.",
        waitForUser: true,
        action: (state: VamsState) => {
          state.addCustomObject('QUADS', QUAD_VERTS);
          const obj = withSelected(state);
          if (obj) state.attachTexture(obj.id, SAMPLE_UVTEST);
        },
      },
      {
        narration:
          "By default, VAMS maps the corners of the bounding box to the corners of the texture — a 1:1 unit-square mapping.",
        waitForUser: true,
        focusPanel: 'uv-editor',
      },
      {
        narration:
          "Watch the code panel as I tighten the top-right UV inward. The glTexCoord2f line for that vertex changes — and so does which texel it samples.",
        waitForUser: true,
        focusPanel: 'uv-editor',
        action: (state: VamsState) => {
          const obj = withSelected(state);
          if (obj) state.updateUV(obj.id, 2, { u: 0.5, v: 0.5 });
        },
      },
      {
        narration:
          "Reset and you're back to the full texture. UVs are just the mapping question: 'where in the image does this vertex look?'",
        waitForUser: true,
        action: (state: VamsState) => {
          const obj = withSelected(state);
          if (obj) state.resetUVsToDefault(obj.id);
        },
      },
      {
        narration:
          "Finally, watch what happens when the shape's geometry changes. As the vertex moves on the canvas, the UV Editor automatically adapts to the new bounding box so your texture doesn't stretch.",
        waitForUser: true,
        focusPanel: 'uv-editor',
        action: (state: VamsState) => {
          const obj = withSelected(state);
          if (obj && obj.vertices[2]) {
            // Programmatically move the top-right vertex to demonstrate the dynamic UV fix
            state.updateVertexPosition(obj.id, obj.vertices[2].id, 0.8, 0.8);
          }
        },
      },
    ],
  },

  'textures-demo-3': {
    id: 'textures-demo-3',
    title: 'Filtering',
    type: 'demo',
    section: 'Textures',
    steps: [
      {
        narration:
          "What happens when one screen pixel covers many texels — or one texel covers many pixels? The filter mode decides.",
        waitForUser: true,
        action: (state: VamsState) => {
          state.addCustomObject('QUADS', QUAD_VERTS);
          const obj = withSelected(state);
          if (obj) {
            state.attachTexture(obj.id, SAMPLE_CHECKER);
            state.updateTextureFilter(obj.id, 'LINEAR');
          }
        },
      },
      {
        narration:
          "GL_LINEAR blends the four nearest texels — soft edges, smooth zoom transitions.",
        waitForUser: true,
        focusPanel: 'texture-attach',
      },
      {
        narration:
          "Switching to GL_NEAREST. Each fragment grabs the single closest texel — pixels become blocky, perfect for retro art.",
        waitForUser: true,
        focusPanel: 'texture-attach',
        action: (state: VamsState) => {
          const obj = withSelected(state);
          if (obj) state.updateTextureFilter(obj.id, 'NEAREST');
        },
      },
      {
        narration:
          "Compare the math panel formulas. NEAREST uses one texel; LINEAR bilerp's between four. The same image, two very different presentations.",
        waitForUser: true,
      },
    ],
  },

  'textures-demo-4': {
    id: 'textures-demo-4',
    title: 'Wrapping',
    type: 'demo',
    section: 'Textures',
    steps: [
      {
        narration:
          "What if a UV goes past 1.0 — say, u = 2.5? The wrap mode decides what the GPU does.",
        waitForUser: true,
        action: (state: VamsState) => {
          state.addCustomObject('QUADS', QUAD_VERTS);
          const obj = withSelected(state);
          if (obj) {
            state.attachTexture(obj.id, SAMPLE_SEAMLESS);
            state.updateTextureWrap(obj.id, 'REPEAT');
          }
        },
      },
      {
        narration:
          "I'll push the UVs to (0,0)…(2,2) — four tiles. With GL_REPEAT, the texture tiles cleanly across the surface.",
        waitForUser: true,
        focusPanel: 'uv-editor',
        action: (state: VamsState) => {
          const obj = withSelected(state);
          if (!obj) return;
          state.updateUV(obj.id, 0, { u: 0, v: 0 });
          state.updateUV(obj.id, 1, { u: 2, v: 0 });
          state.updateUV(obj.id, 2, { u: 2, v: 2 });
          state.updateUV(obj.id, 3, { u: 0, v: 2 });
        },
      },
      {
        narration:
          "Now switch to GL_CLAMP_TO_EDGE. The first tile renders normally — past 1.0, the edge texel just stretches outward.",
        waitForUser: true,
        focusPanel: 'texture-attach',
        action: (state: VamsState) => {
          const obj = withSelected(state);
          if (obj) state.updateTextureWrap(obj.id, 'CLAMP_TO_EDGE');
        },
      },
      {
        narration:
          "Repeat tiles, clamp stretches. Pick the one that fits what your image is supposed to be.",
        waitForUser: true,
      },
    ],
  },

  'textures-demo-5': {
    id: 'textures-demo-5',
    title: 'Texture on a Triangle',
    type: 'demo',
    section: 'Textures',
    steps: [
      {
        narration:
          "Texturing isn't just for quads. Triangles work the same way — but the rasterizer interpolates UVs barycentrically.",
        waitForUser: true,
        action: (state: VamsState) => {
          state.addCustomObject('TRIANGLES', TRI_VERTS);
          const obj = withSelected(state);
          if (obj) state.attachTexture(obj.id, SAMPLE_UVTEST);
        },
      },
      {
        narration:
          "Each vertex gets one UV. Inside the triangle, every fragment's UV is a weighted blend of the three corners — same math as color interpolation.",
        waitForUser: true,
        focusPanel: 'uv-editor',
      },
      {
        narration:
          "Drag a vertex's UV handle and the colors across the whole triangle shift smoothly. That's barycentric UV interpolation in action.",
        waitForUser: true,
        focusPanel: 'uv-editor',
        action: (state: VamsState) => {
          const obj = withSelected(state);
          if (obj) state.updateUV(obj.id, 0, { u: 0.5, v: 1.5 });
        },
      },
      {
        narration:
          "Look at the math panel for the interpolation formula. Same weights as glColor3f-per-vertex — different attribute.",
        waitForUser: true,
      },
    ],
  },

  'textures-exercise-1': {
    id: 'textures-exercise-1',
    title: 'Apply a Texture',
    type: 'exercise',
    section: 'Textures',
    steps: [
      {
        narration:
          "I've added a quad. Pick the Checker sample from the library and apply it.",
        waitForUser: true,
        focusPanel: 'texture-library',
        action: (state: VamsState) => {
          state.addCustomObject('QUADS', QUAD_VERTS);
          state.setActiveTexture(SAMPLE_CHECKER);
        },
        successCheck: (state: VamsState) => {
          const obj = withSelected(state);
          return obj?.texture?.textureId === SAMPLE_CHECKER;
        },
      },
      {
        narration:
          "Excellent. Notice the texture setup landed in init() and the per-vertex glTexCoord2f calls landed in display().",
        waitForUser: true,
      },
    ],
  },

  'textures-exercise-2': {
    id: 'textures-exercise-2',
    title: 'Tile the Texture',
    type: 'exercise',
    section: 'Textures',
    steps: [
      {
        narration:
          "I've applied the Seamless sample to this quad. Set its UVs to range from (0,0) to (3,3), and make sure the wrap mode is GL_REPEAT.",
        waitForUser: true,
        focusPanel: 'uv-editor',
        action: (state: VamsState) => {
          state.addCustomObject('QUADS', QUAD_VERTS);
          const obj = withSelected(state);
          if (obj) {
            state.attachTexture(obj.id, SAMPLE_SEAMLESS);
            state.updateTextureWrap(obj.id, 'REPEAT');
          }
        },
        successCheck: (state: VamsState) => {
          const obj = withSelected(state);
          if (!obj || !obj.uvs || obj.texture?.wrap !== 'REPEAT') return false;

          const u = obj.uvs.map((p) => p.u);
          const v = obj.uvs.map((p) => p.v);
          const tol = 0.3;

          const minU = Math.min(...u), maxU = Math.max(...u);
          const minV = Math.min(...v), maxV = Math.max(...v);

          return (
            Math.abs(minU - 0) < tol && Math.abs(maxU - 3) < tol &&
            Math.abs(minV - 0) < tol && Math.abs(maxV - 3) < tol
          );
        },
      },
      {
        narration:
          "Perfect — a 3×3 tile with seamless wrapping. The same image, multiplied across the surface for free.",
        waitForUser: true,
      },
    ],
  },

  'textures-exercise-3': {
    id: 'textures-exercise-3',
    title: 'Pixelate',
    type: 'exercise',
    section: 'Textures',
    steps: [
      {
        narration:
          "Switch this textured quad to GL_NEAREST filtering so the texels read as crisp blocks.",
        waitForUser: true,
        focusPanel: 'texture-attach',
        action: (state: VamsState) => {
          state.addCustomObject('QUADS', QUAD_VERTS);
          const obj = withSelected(state);
          if (obj) {
            state.attachTexture(obj.id, SAMPLE_CHECKER);
            state.updateTextureFilter(obj.id, 'LINEAR');
          }
        },
        successCheck: (state: VamsState) => {
          const obj = withSelected(state);
          return obj?.texture?.filter === 'NEAREST';
        },
      },
      {
        narration:
          "Nice. glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST) is what the code generator just emitted on your behalf.",
        waitForUser: true,
      },
    ],
  },

  'textures-exercise-4': {
    id: 'textures-exercise-4',
    title: 'Map UVs to Match',
    type: 'exercise',
    section: 'Textures',
    steps: [
      {
        narration:
          "This quad samples only the top-right quarter of the UV-test texture. Move every UV handle into the [0.5, 1.0] range to match.",
        waitForUser: true,
        focusPanel: 'uv-editor',
        action: (state: VamsState) => {
          state.addCustomObject('QUADS', QUAD_VERTS);
          const obj = withSelected(state);
          if (obj) state.attachTexture(obj.id, SAMPLE_UVTEST);
        },
        successCheck: (state: VamsState) => {
          const obj = withSelected(state);
          if (!obj || !obj.uvs) return false;
          return obj.uvs.every(
            (p) =>
              p.u >= 0.5 - 0.05 && p.u <= 1.0 + 0.05 &&
              p.v >= 0.5 - 0.05 && p.v <= 1.0 + 0.05,
          );
        },
      },
      {
        narration:
          "Brilliant. Same shape, same texture — different UVs, different result. UVs are a powerful pedagogical lever.",
        waitForUser: true,
      },
    ],
  },
};