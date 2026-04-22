import type { SceneNode } from "@/core/types/scene";
import { sanitizeName } from './generator/utils';
import { generateState } from './generator/state';
import { generateObjectDrawBody } from './generator/render';

export const generateAppOutput = (
  objectsToDeclare: SceneNode[],
  objectsToCallInDraw: SceneNode[],
  visibleObjects: SceneNode[],
  canvasBackgroundColor: string,
  canvasSize: { width: number; height: number },
  emptyMessage: string = "    // Empty scene\n"
): string => {
  let fullCode = `#include <GL/freeglut.h>\n#include <cmath>\n\n`;

  fullCode += generateState(objectsToDeclare.length > 0 ? visibleObjects : []);

  objectsToDeclare.forEach(obj => {
    fullCode += `void draw_${sanitizeName(obj.name)}();\n`;
  });
  if (objectsToDeclare.length > 0) fullCode += `\n`;

  objectsToDeclare.forEach(obj => {
    fullCode += `void draw_${sanitizeName(obj.name)}()\n{\n`;
    fullCode += generateObjectDrawBody(obj, visibleObjects, canvasSize);
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

  const bgR = (parseInt(canvasBackgroundColor.slice(1, 3), 16) / 255).toFixed(2);
  const bgG = (parseInt(canvasBackgroundColor.slice(3, 5), 16) / 255).toFixed(2);
  const bgB = (parseInt(canvasBackgroundColor.slice(5, 7), 16) / 255).toFixed(2);

  fullCode += `int main(int argc, char** argv)\n{\n`;
  fullCode += `    glutInit(&argc, argv);\n`;
  fullCode += `    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_MULTISAMPLE);\n`;
  fullCode += `    glutInitWindowSize(${canvasSize.width}, ${canvasSize.height});\n`;
  fullCode += `    glutCreateWindow("VAMS Preview");\n`;
  fullCode += `    glClearColor(${bgR}f, ${bgG}f, ${bgB}f, 1.0f);\n\n`;

  fullCode += `    // --- Anti-aliasing configurations ---\n`;
  fullCode += `    glEnable(GL_BLEND);\n`;
  fullCode += `    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);\n\n`;

  fullCode += `    // Smooth lines (Text & Line Primitives)\n`;
  fullCode += `    glEnable(GL_LINE_SMOOTH);\n`;
  fullCode += `    glHint(GL_LINE_SMOOTH_HINT, GL_NICEST);\n\n`;

  fullCode += `    // Smooth points\n`;
  fullCode += `    glEnable(GL_POINT_SMOOTH);\n`;
  fullCode += `    glHint(GL_POINT_SMOOTH_HINT, GL_NICEST);\n\n`;

  fullCode += `    // Multi-Sample Anti-Aliasing (MSAA) for shapes/polygons\n`;
  fullCode += `    glEnable(GLUT_MULTISAMPLE);\n\n`;

  fullCode += `    // Callbacks Setup\n`;
  fullCode += `    glutDisplayFunc(display);\n\n`;

  fullCode += `    glutMainLoop();\n`;
  fullCode += `    return 0;\n}`;

  return fullCode;
};