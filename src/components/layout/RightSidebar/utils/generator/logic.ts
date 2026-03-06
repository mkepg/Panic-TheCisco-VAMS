export const generateUpdateLoop = (): string => {
  let code = `// --- Logic Update Loop ---\n`;
  code += `void update(int value) {\n`;
  code += `    // TODO: Behavior Engine Integration Point\n`;
  code += `    // 1. Process ON_START intervals\n`;
  code += `    // 2. Process KEY_PRESS / KEY_HOLD\n`;
  code += `    // 3. Process COLLISION logic\n\n`;

  code += `    // Reset single-frame input flags\n`;
  code += `    for(int i = 0; i < 256; i++) {\n`;
  code += `        keysPressedThisFrame[i] = false;\n`;
  code += `    }\n\n`;

  code += `    glutPostRedisplay();\n`;
  code += `    glutTimerFunc(16, update, 0); // ~60 FPS\n`;
  code += `}\n\n`;
  
  return code;
};