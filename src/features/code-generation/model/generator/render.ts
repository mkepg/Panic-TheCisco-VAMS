import type { SceneNode } from '@/core/types/scene';
import { sanitizeName, hexToGlColor, getGlPrimitive } from './utils';

export const generateObjectDrawBody = (
  object: SceneNode,
  allObjects: SceneNode[]
): string => {
  let drawBody = '';
  const safeName = sanitizeName(object.name);

  drawBody += `    // ${object.name}\n`;
  drawBody += `    glPushMatrix();\n`;
  drawBody += `    // Transform\n`;
  drawBody += `    glTranslatef(state_${safeName}.x, state_${safeName}.y, 0.0f);\n`;
  drawBody += `    glRotatef(state_${safeName}.rotation, 0.0f, 0.0f, 1.0f);\n`;
  drawBody += `    glScalef(state_${safeName}.scaleX, state_${safeName}.scaleY, 1.0f);\n\n`;

  if (object.type === 'GROUP') {
    drawBody += `    // Children\n`;
    const children = allObjects.filter(o => o.parentId === object.id);
    [...children].reverse().forEach(child => {
      drawBody += `    draw_${sanitizeName(child.name)}();\n`;
    });
  } else if (object.type === 'TEXT') {
    const textContent = object.textContent || '';
    const safeTextComment = textContent.replace(/\n/g, '\\n');
    const colorHex = object.vertices[0]?.color || '#ffffff';
    const colorStr = hexToGlColor(colorHex);

    drawBody += `    // Text: "${safeTextComment}"\n`;
    drawBody += `    glColor3f(${colorStr});\n`;
    drawBody += `    glLineWidth(3.0f);\n`;
    drawBody += `    glPushMatrix();\n`;
    
    // Decouple X and Y scale to perfectly match the canvas monospace aspect ratio
    drawBody += `    float textScaleX = 0.0011f;\n`;
    drawBody += `    float textScaleY = 0.0016f;\n`;
    drawBody += `    glScalef(textScaleX, textScaleY, 1.0f);\n\n`;

    const lines = textContent.split('\n');
    lines.forEach((line, index) => {
      const safeLine = line
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\r/g, '')
        .split('')
        .filter(char => char.charCodeAt(0) < 0x00 || (char.charCodeAt(0) > 0x1F && char.charCodeAt(0) < 0x7F) || char.charCodeAt(0) > 0x9F)
        .join('');

      const yOffset = (((lines.length - 1) / 2.0) - index) * 119.05 - 59.525;

      drawBody += `    {\n`;
      drawBody += `        const char* textLine = "${safeLine}";\n`;
      drawBody += `        int textWidth = glutStrokeLength(GLUT_STROKE_MONO_ROMAN, reinterpret_cast<const unsigned char*>(textLine));\n`;
      drawBody += `        glPushMatrix();\n`;
      drawBody += `        glTranslatef(-textWidth / 2.0f, ${yOffset.toFixed(4)}f, 0.0f);\n`;
      drawBody += `        for (const char* c = textLine; *c != '\\0'; c++) {\n`;
      drawBody += `            glutStrokeCharacter(GLUT_STROKE_MONO_ROMAN, *c);\n`;
      drawBody += `        }\n`;
      drawBody += `        glPopMatrix();\n`;
      drawBody += `    }\n`;
    });

    drawBody += `    glPopMatrix();\n`;
    drawBody += `    glLineWidth(1.0f); // Reset line width\n`;
  } else {
    drawBody += `    // Render\n`;
    drawBody += `    glShadeModel(${object.shading === 'FLAT' ? 'GL_FLAT' : 'GL_SMOOTH'});\n\n`;

    if (object.type === 'POINTS') {
      drawBody += `    // Adjust visible point size — default is 1px\n`;
      drawBody += `    glPointSize(8.0f);\n`;
    }

    drawBody += `    glBegin(${getGlPrimitive(object.type)});\n`;
    object.vertices.forEach((v) => {
      const colorStr = hexToGlColor(v.color);
      drawBody += `        glColor3f(${colorStr});\n`;
      drawBody += `        glVertex2f(${v.x.toFixed(4)}f, ${v.y.toFixed(4)}f);\n`;
    });
    drawBody += `    glEnd();\n`;

    if (object.type === 'POINTS') {
      drawBody += `    glPointSize(1.0f); // Reset\n`;
    }
  }

  drawBody += `    glPopMatrix();\n`;

  return drawBody;
};