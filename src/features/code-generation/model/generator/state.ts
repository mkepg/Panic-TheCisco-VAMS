import type { SceneNode } from '@/core/types/scene';
import { sanitizeName } from './utils';

export const generateState = (allObjects: SceneNode[]): string => {
  let code = `// --- Global State ---\n`;
  code += `struct ObjectState {\n`;
  code += `    float x, y;\n`;
  code += `    float rotation;\n`;
  code += `    float scale;\n`;
  code += `    bool isVisible;\n`;
  code += `};\n\n`;

  allObjects.forEach(obj => {
    const safeName = sanitizeName(obj.name);
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

  return code + `\n`;
};