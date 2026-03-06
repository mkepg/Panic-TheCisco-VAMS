import type { VamsObject } from '@/types';
import { sanitizeName } from './utils';

export const generateStateAndInput = (allObjects: VamsObject[]): string => {
  let code = `// --- Global State & Input Tracking ---\n`;
  code += `bool keys[256] = {false};\n`;
  code += `bool keysPressedThisFrame[256] = {false};\n\n`;

  code += `struct ObjectState {\n`;
  code += `    float x, y;\n`;
  code += `    float rotation;\n`;
  code += `    float scale;\n`;
  code += `    bool isVisible;\n`;
  code += `};\n\n`;

  allObjects.forEach(obj => {
    const safeName = sanitizeName(obj.name);
    
    // Formatting precision logic moved here where the numbers are actually printed
    const isCustomShape = ['POINTS', 'LINE_STRIP', 'POLYGON', 'TRIANGLE_STRIP'].includes(obj.type);
    const transPrec = isCustomShape ? 4 : 2;
    const rotPrec = isCustomShape ? 4 : 1;
    const scalePrec = isCustomShape ? 4 : 2;

    const tx = obj.transform.translateX.toFixed(transPrec);
    const ty = obj.transform.translateY.toFixed(transPrec);
    const rot = obj.transform.rotate.toFixed(rotPrec);
    const scale = obj.transform.scale.toFixed(scalePrec);
    const isVis = obj.isVisible ? 'true' : 'false';
    
    code += `ObjectState state_${safeName} = { ${tx}f, ${ty}f, ${rot}f, ${scale}f, ${isVis} };\n`;
  });

  code += `\n// --- Input Callbacks ---\n`;
  code += `void keyboardDown(unsigned char key, int x, int y) {\n`;
  code += `    if (!keys[key]) keysPressedThisFrame[key] = true;\n`;
  code += `    keys[key] = true;\n`;
  code += `}\n\n`;
  
  code += `void keyboardUp(unsigned char key, int x, int y) {\n`;
  code += `    keys[key] = false;\n`;
  code += `}\n\n`;

  return code;
};