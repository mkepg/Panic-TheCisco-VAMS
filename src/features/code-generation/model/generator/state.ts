import type { SceneNode } from '@/core/types/scene';
import { sanitizeName } from './utils';
export const generateState = (allObjects: SceneNode[]): string => {
  let code = `// --- Global State ---\n`;
  code += `struct ObjectState {\n`;
  code += `    float x, y;\n`;
  code += `    float rotation;\n`;
  code += `    float scaleX, scaleY;\n`;
  code += `    bool isVisible;\n`;
  code += `};\n\n`;
  allObjects.forEach(obj => {
    const safeName = sanitizeName(obj.name);
    const transPrec = 4;
    const rotPrec = 4;
    const scalePrec = 4;
    const tx = obj.transform.translateX.toFixed(transPrec);
    const ty = obj.transform.translateY.toFixed(transPrec);
    const rot = obj.transform.rotate.toFixed(rotPrec);
    const sx = obj.transform.scaleX.toFixed(scalePrec);
    const sy = obj.transform.scaleY.toFixed(scalePrec);
    const isVis = obj.visible ? 'true' : 'false';
    code += `ObjectState state_${safeName} = { ${tx}f, ${ty}f, ${rot}f, ${sx}f, ${sy}f, ${isVis} };\n`;
  });
  return code + `\n`;
};