export interface CodeAnnotation {
  pattern: RegExp;
  title: string;
  description: string;
}
export const GLUT_BOILERPLATE_ANNOTATIONS: CodeAnnotation[] = [
  {
    pattern: /^#include\s+<GL\/glew\.h>/,
    title: '#include <GL/glew.h>',
    description: 'Loads modern-OpenGL entry points (VBOs, glMapBuffer, etc.) at runtime. Must come BEFORE freeglut.h.',
  },
  {
    pattern: /^#include\s+<GL\/freeglut\.h>/,
    title: '#include <GL/freeglut.h>',
    description: 'Pulls in FreeGLUT — the helper library that opens the window and wires up OpenGL.',
  },
  {
    pattern: /^#include\s+<cmath>/,
    title: '#include <cmath>',
    description: 'C++ math functions like sin, cos, sqrt — handy for procedural geometry.',
  },
  {
    pattern: /^void\s+display\s*\(\s*\)/,
    title: 'display()',
    description: 'The painter. GLUT calls this whenever the window needs to be redrawn.',
  },
  {
    pattern: /glClear\s*\(\s*GL_COLOR_BUFFER_BIT/,
    title: 'glClear',
    description: 'Wipes the screen to the background color before drawing the new frame.',
  },
  {
    pattern: /glutSwapBuffers/,
    title: 'glutSwapBuffers',
    description: 'Shows the freshly drawn frame. Double buffering avoids flicker while the next frame is built.',
  },
  {
    pattern: /^int\s+main\s*\(/,
    title: 'main()',
    description: 'Program entry point. Configures GLUT, opens the window, and starts the event loop.',
  },
  {
    pattern: /glutInit\s*\(\s*&argc/,
    title: 'glutInit',
    description: 'Initializes the GLUT runtime and lets it parse command-line arguments.',
  },
  {
    pattern: /glutInitDisplayMode/,
    title: 'glutInitDisplayMode',
    description: 'Picks the pixel format: double buffering, RGB color, and multisample anti-aliasing.',
  },
  {
    pattern: /glutInitWindowSize/,
    title: 'glutInitWindowSize',
    description: 'Sets the initial window size in pixels.',
  },
  {
    pattern: /glutCreateWindow/,
    title: 'glutCreateWindow',
    description: 'Opens the operating-system window with the given title.',
  },
  {
    pattern: /glewInit\s*\(\s*\)/,
    title: 'glewInit',
    description: 'Resolves modern-GL function pointers (glGenBuffers, glBufferData, glMapBuffer, ...) against the driver. Must run AFTER a window/context exists and BEFORE any VBO call.',
  },
  {
    pattern: /glClearColor/,
    title: 'glClearColor',
    description: 'Tells OpenGL which color glClear should paint the screen with each frame.',
  },
  {
    pattern: /glutDisplayFunc/,
    title: 'glutDisplayFunc',
    description: 'Registers display() as the function GLUT will call whenever it needs to redraw.',
  },
  {
    pattern: /glutMainLoop/,
    title: 'glutMainLoop',
    description: 'Hands control to GLUT. Runs forever — until the window is closed.',
  },
  {
    pattern: /^struct\s+ObjectState/,
    title: 'ObjectState',
    description: 'Each scene object you place will get one of these — its position, rotation, and scale.',
  },
  {
    pattern: /^void\s+draw\s*\(\s*\)/,
    title: 'draw()',
    description: 'The scene composer. Calls each object\'s draw routine — currently empty.',
  },
];