export const sanitizeName = (name: string): string => {
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^[0-9]/.test(sanitized)) sanitized = '_' + sanitized;
  return sanitized;
};

export const hexToGlColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return `${r.toFixed(2)}f, ${g.toFixed(2)}f, ${b.toFixed(2)}f`;
};

export const getGlPrimitive = (type: string): string => {
  switch (type) {
    case 'POINT':
    case 'POINTS':
      return 'GL_QUADS';
    case 'LINE':
    case 'LINE_STRIP':
      return 'GL_LINE_STRIP';
    case 'TRIANGLE':
      return 'GL_TRIANGLES';
    case 'RECTANGLE':
      return 'GL_QUADS';
    case 'POLYGON':
    case 'HEXAGON':
    case 'STAR':
    case 'CIRCLE':
    case 'ELLIPSE':
      return 'GL_POLYGON';
    case 'TRIANGLE_STRIP':
      return 'GL_TRIANGLE_STRIP';
    default:
      return 'GL_POINTS';
  }
};