import type { SceneNode } from "@/core/types/scene";
import { sanitizeName } from './generator/utils';
import { generateState } from './generator/state';
import { generateObjectDrawBody } from './generator/render';
import {
  generateBufferGlobals,
  generateInitBody,
  generateUpdateBuffersBody,
  sceneNeedsBufferUpdates,
} from './generator/buffers';

export interface RegisteredCallback {
  kind: 'keyboard' | 'mouse' | 'reshape' | 'motion' | 'idle';
  handlerName: string;
}

interface CallbackTemplate {
  fn: string;
  signature: string;
  body: string;
  needsStdio?: boolean;
}

/**
 * Generates the body for the user's `idle` callback stub.
 *
 * When the scene has DYNAMIC or STREAM VBOs, GLUT only fires one idle
 * function — and we register `update_buffers` as that function so the
 * generated program actually demonstrates the dynamic behavior. The
 * user's idle handler in that case becomes a hint rather than a live
 * callback, with a clear note explaining how to wire it back up.
 */
function buildIdleBody(needsUpdates: boolean): string {
  if (!needsUpdates) {
    return [
      '    // Called continuously while no other events are pending.',
      '    // Use this hook for animation or polling.',
      '    glutPostRedisplay();',
      '',
    ].join('\n');
  }
  return [
    '    // NOTE: GLUT only fires one idle callback at a time, and VAMS has',
    '    // registered update_buffers() as the active idle handler so your',
    '    // DYNAMIC and STREAM VBOs actually refresh. To run your own logic',
    '    // here, either:',
    '    //   1) Call update_buffers() at the bottom of this function and',
    '    //      register THIS function as the idle handler instead, or',
    '    //   2) Move your logic into update_buffers() directly.',
    '    glutPostRedisplay();',
    '',
  ].join('\n');
}

function getCallbackTemplates(needsUpdates: boolean): Record<RegisteredCallback['kind'], CallbackTemplate> {
  return {
    keyboard: {
      fn: 'glutKeyboardFunc',
      signature: 'void {{name}}(unsigned char key, int x, int y)',
      body: [
        '    // ESC key quits the program.',
        '    if (key == 27) {',
        '        exit(0);',
        '    }',
        '    // Visual feedback: shift background color based on key press',
        '    glClearColor((key % 3) * 0.2f, (key % 5) * 0.2f, 0.2f, 1.0f);',
        '    glutPostRedisplay();',
        '',
      ].join('\n'),
    },
    mouse: {
      fn: 'glutMouseFunc',
      signature: 'void {{name}}(int button, int state, int x, int y)',
      body: [
        '    // Visual feedback: change background color based on click position',
        '    if (state == GLUT_DOWN) {',
        '        glClearColor((float)x / 800.0f, (float)y / 600.0f, 0.5f, 1.0f);',
        '        glutPostRedisplay();',
        '    }',
        '',
      ].join('\n'),
    },
    motion: {
      fn: 'glutMotionFunc',
      signature: 'void {{name}}(int x, int y)',
      body: [
        '    // Visual feedback: change background color while dragging',
        '    glClearColor(0.2f, (float)x / 800.0f, (float)y / 600.0f, 1.0f);',
        '    glutPostRedisplay();',
        '',
      ].join('\n'),
    },
    reshape: {
      fn: 'glutReshapeFunc',
      signature: 'void {{name}}(int width, int height)',
      body: [
        '    // Map the OpenGL viewport to the new window size.',
        '    glViewport(0, 0, width, height);',
        '    // Reset the projection matrix to a 2D orthographic view.',
        '    glMatrixMode(GL_PROJECTION);',
        '    glLoadIdentity();',
        '    glOrtho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);',
        '    glMatrixMode(GL_MODELVIEW);',
        '    glLoadIdentity();',
        '',
      ].join('\n'),
    },
    idle: {
      fn: 'glutIdleFunc',
      signature: 'void {{name}}()',
      body: buildIdleBody(needsUpdates),
    },
  };
}

function generateCallbackStubs(
  callbacks: RegisteredCallback[],
  templates: Record<RegisteredCallback['kind'], CallbackTemplate>,
): string {
  if (callbacks.length === 0) return '';
  let out = `// --- Callback handlers ---\n`;
  callbacks.forEach((cb) => {
    const tpl = templates[cb.kind];
    const sig = tpl.signature.replace('{{name}}', sanitizeName(cb.handlerName));
    out += `${sig}\n{\n${tpl.body}}\n\n`;
  });
  return out;
}

function generateCallbackForwardDecls(
  callbacks: RegisteredCallback[],
  templates: Record<RegisteredCallback['kind'], CallbackTemplate>,
): string {
  if (callbacks.length === 0) return '';
  let out = '';
  callbacks.forEach((cb) => {
    const tpl = templates[cb.kind];
    out += tpl.signature.replace('{{name}}', sanitizeName(cb.handlerName)) + ';\n';
  });
  return out + '\n';
}

/** True if any registered callback's body uses printf — pulls in <cstdio>. */
function callbacksNeedStdio(
  callbacks: RegisteredCallback[],
  templates: Record<RegisteredCallback['kind'], CallbackTemplate>,
): boolean {
  return callbacks.some((cb) => templates[cb.kind].needsStdio === true);
}

function callbacksNeedStdlib(callbacks: RegisteredCallback[]): boolean {
  return callbacks.some((cb) => cb.kind === 'keyboard');
}

/** Check if any visible object uses VBOs, which requires GLEW on Windows */
function objectsNeedGlew(objects: SceneNode[]): boolean {
  return objects.some((obj) => obj.renderingMode === 'VBO');
}

export const generateAppOutput = (
  objectsToDeclare: SceneNode[],
  objectsToCallInDraw: SceneNode[],
  visibleObjects: SceneNode[],
  canvasBackgroundColor: string,
  canvasSize: { width: number; height: number },
  emptyMessage: string = "    // Empty scene\n",
  callbacks: RegisteredCallback[] = []
): string => {
  const usesGlew = objectsNeedGlew(visibleObjects);
  const needsUpdates = sceneNeedsBufferUpdates(visibleObjects);
  const userHasIdle = callbacks.some((cb) => cb.kind === 'idle');
  const templates = getCallbackTemplates(needsUpdates);

  let fullCode = '';

  if (usesGlew) {
    fullCode += `#include <GL/glew.h>\n`;
  }

  fullCode += `#include <GL/freeglut.h>\n#include <cmath>\n`;

  if (callbacksNeedStdio(callbacks, templates)) fullCode += `#include <cstdio>\n`;
  if (callbacksNeedStdlib(callbacks)) fullCode += `#include <cstdlib>\n`;
  fullCode += `\n`;

  fullCode += generateState(objectsToDeclare.length > 0 ? visibleObjects : []);
  fullCode += generateBufferGlobals(visibleObjects);

  objectsToDeclare.forEach(obj => {
    fullCode += `void draw_${sanitizeName(obj.name)}();\n`;
  });
  if (objectsToDeclare.length > 0) fullCode += `\n`;

  fullCode += `void init();\n`;
  if (needsUpdates) fullCode += `void update_buffers();\n`;
  fullCode += `\n`;

  fullCode += generateCallbackForwardDecls(callbacks, templates);

  objectsToDeclare.forEach(obj => {
    fullCode += `void draw_${sanitizeName(obj.name)}()\n{\n`;
    fullCode += generateObjectDrawBody(obj, visibleObjects);
    fullCode += `}\n\n`;
  });

  fullCode += `void draw()\n{\n`;
  if (objectsToCallInDraw.length === 0) {
    fullCode += emptyMessage;
  } else {
    [...objectsToCallInDraw].reverse().forEach(obj => {
      fullCode += `    draw_${sanitizeName(obj.name)}();\n`;
    });
  }
  fullCode += `}\n\n`;

  fullCode += `void display()\n{\n`;
  fullCode += `    glClear(GL_COLOR_BUFFER_BIT);\n`;
  fullCode += `    draw();\n`;
  fullCode += `    glutSwapBuffers();\n`;
  fullCode += `}\n\n`;

  fullCode += `// One-time setup, called once before the main loop\n`;
  fullCode += `void init()\n{\n`;
  fullCode += generateInitBody(visibleObjects);
  fullCode += `}\n\n`;

  // Per-frame update path for DYNAMIC / STREAM buffers. Only emitted when
  // at least one object actually needs it — STATIC-only scenes skip this
  // entirely, which is exactly the structural diff students should notice.
  if (needsUpdates) {
    fullCode += `// Per-frame buffer refresh — registered as the GLUT idle callback.\n`;
    fullCode += `// This is what makes DYNAMIC and STREAM hints actually do something.\n`;
    fullCode += `void update_buffers()\n{\n`;
    fullCode += generateUpdateBuffersBody(visibleObjects);
    fullCode += `    glutPostRedisplay();\n`;
    fullCode += `}\n\n`;
  }

  fullCode += generateCallbackStubs(callbacks, templates);

  const bgR = (parseInt(canvasBackgroundColor.slice(1, 3), 16) / 255).toFixed(2);
  const bgG = (parseInt(canvasBackgroundColor.slice(3, 5), 16) / 255).toFixed(2);
  const bgB = (parseInt(canvasBackgroundColor.slice(5, 7), 16) / 255).toFixed(2);

  fullCode += `int main(int argc, char** argv)\n{\n`;
  fullCode += `    glutInit(&argc, argv);\n`;
  fullCode += `    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_MULTISAMPLE);\n`;
  fullCode += `    glutInitWindowSize(${canvasSize.width}, ${canvasSize.height});\n`;
  fullCode += `    glutCreateWindow("VAMS Preview");\n`;

  if (usesGlew) {
    fullCode += `\n    // Initialize GLEW for VBO support (OpenGL 1.5+)\n`;
    fullCode += `    if (glewInit() != GLEW_OK) return 1;\n`;
  }

  fullCode += `\n    glClearColor(${bgR}f, ${bgG}f, ${bgB}f, 1.0f);\n\n`;
  fullCode += `    init();\n\n`;
  fullCode += `    glutDisplayFunc(display);\n`;

  // Register every user-defined callback as before — except for `idle`,
  // which we may need to claim for update_buffers to actually run.
  callbacks.forEach((cb) => {
    if (cb.kind === 'idle' && needsUpdates) {
      // Skip the user's idle here — update_buffers is registered instead.
      // The user's idle stub is still emitted above, with a comment block
      // explaining how to compose the two.
      return;
    }
    const tpl = templates[cb.kind];
    fullCode += `    ${tpl.fn}(${sanitizeName(cb.handlerName)});\n`;
  });

  if (needsUpdates) {
    fullCode += `    glutIdleFunc(update_buffers); // VAMS-managed buffer refresh\n`;
    if (userHasIdle) {
      fullCode += `    // Note: your idle handler is defined above but not registered;\n`;
      fullCode += `    // see the comment inside it for how to compose with update_buffers.\n`;
    }
  }

  fullCode += `\n    glutMainLoop();\n`;
  fullCode += `    return 0;\n}`;

  return fullCode;
};
