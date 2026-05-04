import type { SceneNode, ViewportLimits, GlutCallbackKind } from '@/core/types/scene';
import type { TextureAsset } from '@/core/types/textures';

import { sanitizeName } from './generator/utils';
import { generateState } from './generator/state';
import { generateObjectDrawBody } from './generator/render';
import { 
  generateBufferGlobals, 
  generateInitBody, 
  generateUpdateBuffersBody, 
  sceneNeedsBufferUpdates 
} from './generator/buffers';
import { 
  generateTextureGlobals, 
  generateTextureInitBody, 
  sceneNeedsTextures 
} from './generator/textures';

export interface RegisteredCallback {
  kind: GlutCallbackKind;
  handlerName: string;
}

export function generateAppOutput(
  rootObjects: SceneNode[],
  allObjects: SceneNode[],
  canvasBackgroundColor: string,
  canvasSize: { width: number; height: number },
  emptySceneComment: string,
  callbacks: RegisteredCallback[],
  viewportLimits?: ViewportLimits,
  textures: Map<string, TextureAsset> = new Map()
): string {
  
  const hasTextures = sceneNeedsTextures(allObjects);
  const needsBufferUpdate = sceneNeedsBufferUpdates(allObjects);

  // 1. Headers
  let code = `#include <GL/freeglut.h>\n#include <cmath>\n`;
  
  if (hasTextures) {
    code += `#include <iostream>\n\n`;
    code += `// 1. Define the implementation macro BEFORE including the header\n`;
    code += `#define STB_IMAGE_IMPLEMENTATION\n`;
    code += `#include "stb_image.h"\n`;
  }
  code += `\n`;

  // 2. Global State & Handles
  code += generateState(allObjects);
  code += generateBufferGlobals(allObjects);
  if (hasTextures) {
    code += generateTextureGlobals(allObjects);
  }

  // 3. Forward Declarations
  allObjects.forEach((obj) => {
    if (obj.type !== 'GROUP' && obj.type !== 'TEXT') {
      code += `void draw_${sanitizeName(obj.name)}();\n`;
    }
  });
  if (needsBufferUpdate) {
    code += `void update_buffers();\n`;
  }
  code += `void init();\n\n`;

  // 4. Object Draw Functions
  allObjects.forEach((obj) => {
    if (obj.type !== 'GROUP' && obj.type !== 'TEXT') {
      code += `void draw_${sanitizeName(obj.name)}()\n{\n`;
      code += generateObjectDrawBody(obj, allObjects);
      code += `}\n\n`;
    }
  });

  // 5. Main Draw Routine
  code += `void draw()\n{\n`;
  if (rootObjects.length === 0) {
    code += emptySceneComment;
  } else {
    // Reverse root objects to match painter's algorithm / Z-index
    [...rootObjects].reverse().forEach((obj) => {
      if (obj.type === 'GROUP' || obj.type === 'TEXT') {
        code += generateObjectDrawBody(obj, allObjects);
      } else {
        code += `    draw_${sanitizeName(obj.name)}();\n`;
      }
    });
  }
  code += `}\n\n`;

  // 6. Buffer Updates Routine (if applicable)
  if (needsBufferUpdate) {
    code += `void update_buffers()\n{\n`;
    code += generateUpdateBuffersBody(allObjects);
    code += `}\n\n`;
  }

  // 7. Display Routine
  code += `void display()\n{\n`;
  code += `    glClear(GL_COLOR_BUFFER_BIT);\n\n`;
  code += `    // 2D orthographic projection — see glOrtho editor in VAMS\n`;
  code += `    glMatrixMode(GL_PROJECTION);\n`;
  code += `    glLoadIdentity();\n`;
  if (viewportLimits) {
    const { minX, maxX, minY, maxY } = viewportLimits;
    code += `    glOrtho(${minX.toFixed(4)}, ${maxX.toFixed(4)}, ${minY.toFixed(4)}, ${maxY.toFixed(4)}, -1.0, 1.0);\n\n`;
  } else {
    code += `    glOrtho(-1.0000, 1.0000, -1.0000, 1.0000, -1.0, 1.0);\n\n`;
  }
  code += `    // Switch to the modelview stack for object transforms\n`;
  code += `    glMatrixMode(GL_MODELVIEW);\n`;
  code += `    glLoadIdentity();\n\n`;
  code += `    draw();\n`;
  code += `    glutSwapBuffers();\n`;
  code += `}\n\n`;

  // 8. User Callback Stubs
  callbacks.forEach((cb) => {
    code += `// Callback stub for ${cb.kind} events\n`;
    if (cb.kind === 'keyboard') {
      code += `void ${cb.handlerName}(unsigned char key, int x, int y)\n{\n    // Add your keyboard logic here\n    glutPostRedisplay();\n}\n\n`;
    } else if (cb.kind === 'mouse') {
      code += `void ${cb.handlerName}(int button, int state, int x, int y)\n{\n    // Add your mouse click logic here\n    glutPostRedisplay();\n}\n\n`;
    } else if (cb.kind === 'motion') {
      code += `void ${cb.handlerName}(int x, int y)\n{\n    // Add your mouse drag logic here\n    glutPostRedisplay();\n}\n\n`;
    } else if (cb.kind === 'reshape') {
      code += `void ${cb.handlerName}(int width, int height)\n{\n    // Add your window resize logic here\n    glViewport(0, 0, width, height);\n    glutPostRedisplay();\n}\n\n`;
    } else if (cb.kind === 'idle') {
      code += `void ${cb.handlerName}()\n{\n    // Add your per-frame logic here\n    glutPostRedisplay();\n}\n\n`;
    }
  });

  // 9. Init Routine
  code += `// One-time setup, called once before the main loop\n`;
  code += `void init()\n{\n`;
  const initBuffers = generateInitBody(allObjects);
  if (initBuffers.trim()) {
    code += initBuffers;
  } else {
    code += `    // No GPU buffers to upload\n`;
  }
  if (hasTextures) {
    code += generateTextureInitBody(allObjects, textures);
  }
  code += `}\n\n`;

  // 10. VAMS Idle Wrapper (combines user idle with dynamic buffer updates safely)
  const idleCb = callbacks.find(cb => cb.kind === 'idle');
  if (needsBufferUpdate || idleCb) {
    code += `// Internal VAMS wrapper to handle background updates safely\n`;
    code += `void _vams_idle()\n{\n`;
    if (needsBufferUpdate) code += `    update_buffers();\n`;
    if (idleCb) code += `    ${idleCb.handlerName}();\n`;
    if (needsBufferUpdate && !idleCb) code += `    glutPostRedisplay();\n`;
    code += `}\n\n`;
  }

  // 11. Main Routine
  code += `int main(int argc, char** argv)\n{\n`;
  code += `    glutInit(&argc, argv);\n`;
  code += `    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_MULTISAMPLE);\n`;
  code += `    glutInitWindowSize(${canvasSize.width}, ${canvasSize.height});\n`;
  code += `    glutCreateWindow("VAMS Preview");\n\n`;

  // Convert HTML hex background to OpenGL float format
  const r = (parseInt(canvasBackgroundColor.slice(1, 3), 16) / 255).toFixed(2);
  const g = (parseInt(canvasBackgroundColor.slice(3, 5), 16) / 255).toFixed(2);
  const b = (parseInt(canvasBackgroundColor.slice(5, 7), 16) / 255).toFixed(2);
  code += `    glClearColor(${r}f, ${g}f, ${b}f, 1.0f);\n\n`;

  code += `    init();\n\n`;
  code += `    glutDisplayFunc(display);\n`;

  callbacks.forEach((cb) => {
    if (cb.kind === 'keyboard') code += `    glutKeyboardFunc(${cb.handlerName});\n`;
    if (cb.kind === 'mouse') code += `    glutMouseFunc(${cb.handlerName});\n`;
    if (cb.kind === 'motion') code += `    glutMotionFunc(${cb.handlerName});\n`;
    if (cb.kind === 'reshape') code += `    glutReshapeFunc(${cb.handlerName});\n`;
  });

  if (needsBufferUpdate || idleCb) {
    code += `    glutIdleFunc(_vams_idle);\n`;
  }

  code += `\n    glutMainLoop();\n`;
  code += `    return 0;\n`;
  code += `}\n`;

  return code;
}