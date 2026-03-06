import type { VamsObject } from '@/types';
import { sanitizeName, hexToGlColor, getGlPrimitive } from './utils';

export const generateObjectDrawBody = (
  object: VamsObject,
  allObjects: VamsObject[],
  canvasSize: { width: number; height: number }
): string => {
  let drawBody = '';
  const safeName = sanitizeName(object.name);
  const glPrimitive = getGlPrimitive(object.type);

  drawBody += `    // ${object.name}\n`;
  drawBody += `    if (!state_${safeName}.isVisible) return;\n\n`;

  drawBody += `    glPushMatrix();\n`;
  drawBody += `    // Transform\n`;
  drawBody += `    glTranslatef(state_${safeName}.x, state_${safeName}.y, 0.0f);\n`;
  drawBody += `    glRotatef(state_${safeName}.rotation, 0.0f, 0.0f, 1.0f);\n`;
  drawBody += `    glScalef(state_${safeName}.scale, state_${safeName}.scale, 1.0f);\n\n`;

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
    drawBody += `    float textScale = 0.0011f;\n`;
    drawBody += `    glScalef(textScale, textScale, 1.0f);\n\n`;

    const lines = textContent.split('\n');
    lines.forEach((line, index) => {
      // Hardened escape logic to prevent C++ string literal compile crashes
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

    if (object.type === 'POINT' || object.type === 'POINTS') {
      const aspect = (canvasSize.height && canvasSize.width) ? (canvasSize.width / canvasSize.height) : 1;
      const halfSizeX = 0.0097;
      const halfSizeY = 0.009 * aspect;

      drawBody += `    float halfSizeX = ${halfSizeX.toFixed(5)}f;\n`;
      drawBody += `    float halfSizeY = ${halfSizeY.toFixed(5)}f;\n`;
      drawBody += `    glBegin(GL_QUADS);\n`;
      object.vertices.forEach((v) => {
        const colorStr = hexToGlColor(v.color);
        drawBody += `        glColor3f(${colorStr});\n`;
        drawBody += `        glVertex2f(${v.x.toFixed(4)}f - halfSizeX, ${v.y.toFixed(4)}f - halfSizeY);\n`;
        drawBody += `        glVertex2f(${v.x.toFixed(4)}f + halfSizeX, ${v.y.toFixed(4)}f - halfSizeY);\n`;
        drawBody += `        glVertex2f(${v.x.toFixed(4)}f + halfSizeX, ${v.y.toFixed(4)}f + halfSizeY);\n`;
        drawBody += `        glVertex2f(${v.x.toFixed(4)}f - halfSizeX, ${v.y.toFixed(4)}f + halfSizeY);\n`;
      });
      drawBody += `    glEnd();\n`;
    } else if (object.type === 'CIRCLE' || object.type === 'ELLIPSE') {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      object.vertices.forEach(v => {
        if (v.x < minX) minX = v.x;
        if (v.x > maxX) maxX = v.x;
        if (v.y < minY) minY = v.y;
        if (v.y > maxY) maxY = v.y;
      });
      if (!isFinite(minX)) {
        minX = -0.5; maxX = 0.5; minY = -0.5; maxY = 0.5;
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const rx = (maxX - minX) / 2;
      const ry = (maxY - minY) / 2;
      const rXToUse = object.type === 'CIRCLE' ? (rx + ry) / 2 : rx;
      const rYToUse = object.type === 'CIRCLE' ? (rx + ry) / 2 : ry;

      const firstColor = object.vertices[0]?.color || '#ffffff';
      const isUniformColor = object.vertices.every(v => v.color === firstColor);

      if (isUniformColor || object.vertices.length === 0) {
        const colorStr = hexToGlColor(firstColor);
        drawBody += `    glColor3f(${colorStr});\n`;
        drawBody += `    glBegin(GL_TRIANGLE_FAN);\n`;
        drawBody += `        glVertex2f(${cx.toFixed(4)}f, ${cy.toFixed(4)}f);\n`;
        drawBody += `        int segments = 64;\n`;
        drawBody += `        for(int i = 0; i <= segments; i++) {\n`;
        drawBody += `            float theta = 2.0f * 3.1415926f * float(i) / float(segments);\n`;
        drawBody += `            float x = ${cx.toFixed(4)}f + ${rXToUse.toFixed(4)}f * cos(theta);\n`;
        drawBody += `            float y = ${cy.toFixed(4)}f + ${rYToUse.toFixed(4)}f * sin(theta);\n`;
        drawBody += `            glVertex2f(x, y);\n`;
        drawBody += `        }\n`;
        drawBody += `    glEnd();\n`;
      } else {
        let avgR = 0, avgG = 0, avgB = 0;
        object.vertices.forEach(v => {
          const r = parseInt(v.color.slice(1, 3), 16) / 255;
          const g = parseInt(v.color.slice(3, 5), 16) / 255;
          const b = parseInt(v.color.slice(5, 7), 16) / 255;
          avgR += r; avgG += g; avgB += b;
        });
        const vCount = object.vertices.length;
        avgR /= vCount; avgG /= vCount; avgB /= vCount;

        const numColors = object.vertices.length;
        drawBody += `    float colors[${numColors}][3] = {\n`;
        object.vertices.forEach(v => {
          drawBody += `        {${hexToGlColor(v.color)}},\n`;
        });
        drawBody += `    };\n`;
        drawBody += `    int numColors = ${numColors};\n`;

        drawBody += `    glBegin(GL_TRIANGLE_FAN);\n`;
        drawBody += `    // Average center color\n`;
        drawBody += `    glColor3f(${avgR.toFixed(4)}f, ${avgG.toFixed(4)}f, ${avgB.toFixed(4)}f);\n`;
        drawBody += `    glVertex2f(${cx.toFixed(4)}f, ${cy.toFixed(4)}f);\n\n`;

        drawBody += `    int segments = 64;\n`;
        drawBody += `    for (int i = 0; i <= segments; i++) {\n`;
        drawBody += `        float ratio = float(i % segments) / float(segments);\n`;
        drawBody += `        float fIdx = ratio * float(numColors);\n`;
        drawBody += `        int idx = (int)floor(fIdx);\n`;
        drawBody += `        int nextIdx = (idx + 1) % numColors;\n`;
        drawBody += `        float localRatio = fIdx - float(idx);\n`;
        drawBody += `        float r = colors[idx][0] * (1.0f - localRatio) + colors[nextIdx][0] * localRatio;\n`;
        drawBody += `        float g = colors[idx][1] * (1.0f - localRatio) + colors[nextIdx][1] * localRatio;\n`;
        drawBody += `        float b = colors[idx][2] * (1.0f - localRatio) + colors[nextIdx][2] * localRatio;\n`;
        drawBody += `        glColor3f(r, g, b);\n\n`;

        drawBody += `        float theta = 2.0f * 3.1415926f * float(i) / float(segments);\n`;
        drawBody += `        float x = ${cx.toFixed(4)}f + ${rXToUse.toFixed(4)}f * cos(theta);\n`;
        drawBody += `        float y = ${cy.toFixed(4)}f + ${rYToUse.toFixed(4)}f * sin(theta);\n`;
        drawBody += `        glVertex2f(x, y);\n`;
        drawBody += `    }\n`;
        drawBody += `    glEnd();\n`;
      }
    } else if (object.type === 'STAR') {
      drawBody += `    glBegin(GL_TRIANGLE_FAN);\n`;
      const vCount = object.vertices.length;
      if (vCount > 0) {
        let cx = 0, cy = 0;
        let avgR = 0, avgG = 0, avgB = 0;
        object.vertices.forEach(v => {
          cx += v.x;
          cy += v.y;
          const r = parseInt(v.color.slice(1, 3), 16) / 255;
          const g = parseInt(v.color.slice(3, 5), 16) / 255;
          const b = parseInt(v.color.slice(5, 7), 16) / 255;
          avgR += r; avgG += g; avgB += b;
        });
        cx /= vCount; cy /= vCount;
        avgR /= vCount; avgG /= vCount; avgB /= vCount;

        drawBody += `        // Center vertex\n`;
        drawBody += `        glColor3f(${avgR.toFixed(4)}f, ${avgG.toFixed(4)}f, ${avgB.toFixed(4)}f);\n`;
        drawBody += `        glVertex2f(${cx.toFixed(4)}f, ${cy.toFixed(4)}f);\n\n`;

        object.vertices.forEach((v) => {
          drawBody += `        glColor3f(${hexToGlColor(v.color)});\n`;
          drawBody += `        glVertex2f(${v.x.toFixed(4)}f, ${v.y.toFixed(4)}f);\n`;
        });
        const v0 = object.vertices[0];
        drawBody += `        glColor3f(${hexToGlColor(v0.color)});\n`;
        drawBody += `        glVertex2f(${v0.x.toFixed(4)}f, ${v0.y.toFixed(4)}f);\n`;
      }
      drawBody += `    glEnd();\n`;
    } else {
      drawBody += `    glBegin(${glPrimitive});\n`;
      object.vertices.forEach((v) => {
        const colorStr = hexToGlColor(v.color);
        drawBody += `        glColor3f(${colorStr});\n`;
        drawBody += `        glVertex2f(${v.x.toFixed(4)}f, ${v.y.toFixed(4)}f);\n`;
      });
      drawBody += `    glEnd();\n`;
    }
  }

  drawBody += `    glPopMatrix();\n`;
  return drawBody;
};