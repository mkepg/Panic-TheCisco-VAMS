import type { SceneNode } from "@/core/types/scene";
import { sanitizeName } from './generator/utils';
import { generateState } from './generator/state';
import { generateObjectDrawBody } from './generator/render';
import { generateBufferGlobals, generateInitBody } from './generator/buffers';

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

const CALLBACK_TEMPLATES: Record<RegisteredCallback['kind'], CallbackTemplate> = {
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
    body: [
      '    // Called continuously while no other events are pending.',
      '    // Use this hook for animation or polling.',
      '    glutPostRedisplay();',
      '',
    ].join('\n'),
  },
};

function generateCallbackStubs(callbacks: RegisteredCallback[]): string {
  if (callbacks.length === 0) return '';

  let out = `// --- Callback handlers ---\n`;
  callbacks.forEach((cb) => {
    const tpl = CALLBACK_TEMPLATES[cb.kind];
    const sig = tpl.signature.replace('{{name}}', sanitizeName(cb.handlerName));
    out += `${sig}\n{\n${tpl.body}}\n\n`;
  });
  return out;
}

function generateCallbackForwardDecls(callbacks: RegisteredCallback[]): string {
  if (callbacks.length === 0) return '';

  let out = '';
  callbacks.forEach((cb) => {
    const tpl = CALLBACK_TEMPLATES[cb.kind];
    out += tpl.signature.replace('{{name}}', sanitizeName(cb.handlerName)) + ';\n';
  });
  return out + '\n';
}

function generateCallbackRegistrations(callbacks: RegisteredCallback[]): string {
  if (callbacks.length === 0) return '';

  let out = '';
  callbacks.forEach((cb) => {
    const tpl = CALLBACK_TEMPLATES[cb.kind];
    out += `    ${tpl.fn}(${sanitizeName(cb.handlerName)});\n`;
  });
  return out;
}

/** True if any registered callback's body uses printf — pulls in <cstdio>. */
function callbacksNeedStdio(callbacks: RegisteredCallback[]): boolean {
  return callbacks.some((cb) => CALLBACK_TEMPLATES[cb.kind].needsStdio === true);
}

function callbacksNeedStdlib(callbacks: RegisteredCallback[]): boolean {
  return callbacks.some((cb) => cb.kind === 'keyboard');
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
  let fullCode = `#include <GL/freeglut.h>\n#include <cmath>\n`;

  if (callbacksNeedStdio(callbacks)) fullCode += `#include <cstdio>\n`;
  if (callbacksNeedStdlib(callbacks)) fullCode += `#include <cstdlib>\n`;

  fullCode += `\n`;

  fullCode += generateState(objectsToDeclare.length > 0 ? visibleObjects : []);

  // Stage 3: vertex arrays, index arrays, VBO handles
  fullCode += generateBufferGlobals(visibleObjects);

  // Forward declarations
  objectsToDeclare.forEach(obj => {
    fullCode += `void draw_${sanitizeName(obj.name)}();\n`;
  });
  if (objectsToDeclare.length > 0) fullCode += `\n`;
  fullCode += `void init();\n\n`;

  fullCode += generateCallbackForwardDecls(callbacks);

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

  // Stage 3: init() — one-time GPU setup, runs before glutMainLoop.
  fullCode += `// One-time setup, called once before the main loop\n`;
  fullCode += `void init()\n{\n`;
  fullCode += generateInitBody(visibleObjects);
  fullCode += `}\n\n`;

  fullCode += generateCallbackStubs(callbacks);

  const bgR = (parseInt(canvasBackgroundColor.slice(1, 3), 16) / 255).toFixed(2);
  const bgG = (parseInt(canvasBackgroundColor.slice(3, 5), 16) / 255).toFixed(2);
  const bgB = (parseInt(canvasBackgroundColor.slice(5, 7), 16) / 255).toFixed(2);

  fullCode += `int main(int argc, char** argv)\n{\n`;
  fullCode += `    glutInit(&argc, argv);\n`;
  fullCode += `    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_MULTISAMPLE);\n`;
  fullCode += `    glutInitWindowSize(${canvasSize.width}, ${canvasSize.height});\n`;
  fullCode += `    glutCreateWindow("VAMS Preview");\n`;
  fullCode += `    glClearColor(${bgR}f, ${bgG}f, ${bgB}f, 1.0f);\n\n`;
  fullCode += `    init();\n\n`;

  fullCode += `    glutDisplayFunc(display);\n`;
  fullCode += generateCallbackRegistrations(callbacks);

  fullCode += `\n    glutMainLoop();\n`;
  fullCode += `    return 0;\n}`;

  return fullCode;
};
