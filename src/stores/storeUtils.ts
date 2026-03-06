import type { PrimitiveType, VamsObject } from '@/types';

export const getInitialVertices = (type: PrimitiveType) => {
  switch (type) {
    case 'POINT':
      return [{ id: 'v0', x: 0, y: 0, color: '#ffffff' }];
    case 'LINE':
      return [
        { id: 'v0', x: -0.5, y: 0, color: '#ffffff' },
        { id: 'v1', x: 0.5, y: 0, color: '#ffffff' }, 
      ];
    case 'TRIANGLE':
      return [
        { id: 'v0', x: 0, y: 0.5, color: '#ffffff' }, 
        { id: 'v1', x: 0.5, y: -0.5, color: '#ffffff' },
        { id: 'v2', x: -0.5, y: -0.5, color: '#ffffff' },
      ];
    case 'RECTANGLE':
      return [
        { id: 'v0', x: -0.5, y: 0.5, color: '#ffffff' },
        { id: 'v1', x: 0.5, y: 0.5, color: '#ffffff' }, 
        { id: 'v2', x: 0.5, y: -0.5, color: '#ffffff' },
        { id: 'v3', x: -0.5, y: -0.5, color: '#ffffff' },
      ];
    case 'CIRCLE': {
      const circleVertices = [];
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        circleVertices.push({
          id: `v${i}`,
          x: Math.cos(angle) * 0.5,
          y: Math.sin(angle) * 0.5,
          color: '#ffffff',
        });
      }
      return circleVertices;
    }
    case 'ELLIPSE': {
      const ellipseVertices = [];
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        ellipseVertices.push({
          id: `v${i}`,
          x: Math.cos(angle) * 0.7,
          y: Math.sin(angle) * 0.4,
          color: '#ffffff',
        });
      }
      return ellipseVertices;
    }
    case 'STAR': {
      const starVertices = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + Math.PI / 2;
        const radius = i % 2 === 0 ? 0.5 : 0.2;
        starVertices.push({
          id: `v${i}`,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          color: '#ffffff',
        });
      }
      return starVertices;
    }
    case 'HEXAGON': {
      const hexVertices = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        hexVertices.push({
          id: `v${i}`,
          x: Math.cos(angle) * 0.5,
          y: Math.sin(angle) * 0.5,
          color: '#ffffff',
        });
      }
      return hexVertices;
    }
// NEW CUSTOM TYPES
    case 'POINTS':
      // Initial: 2 points
      return [
        { id: 'v0', x: -0.5, y: 0, color: '#ffffff' },
        { id: 'v1', x: 0.5, y: 0, color: '#ffffff' }
      ];

    case 'LINE_STRIP':
      // Initial: 3 vertices
      return [
        { id: 'v0', x: -0.5, y: -0.5, color: '#ffffff' },
        { id: 'v1', x: 0, y: 0.5, color: '#ffffff' },
        { id: 'v2', x: 0.5, y: -0.5, color: '#ffffff' }
      ];

    case 'POLYGON':
      // Initial: 4 vertices (Hexagon shape)
      return [
        { id: 'v0', x: -0.5, y: 0.5, color: '#ffffff' },
        { id: 'v1', x: 0.5, y: 0.5, color: '#ffffff' },
        { id: 'v2', x: 0.5, y: -0.5, color: '#ffffff' },
        { id: 'v3', x: -0.5, y: -0.5, color: '#ffffff' }
      ];

    case 'TRIANGLE_STRIP':
      // Initial: 4 vertices (Mesh-like structure)
      return [
        { id: 'v0', x: -0.5, y: 0.5, color: '#ffffff' },
        { id: 'v1', x: 0.5, y: 0.5, color: '#ffffff' },
        { id: 'v2', x: -0.5, y: -0.5, color: '#ffffff' },
        { id: 'v3', x: 0.5, y: -0.5, color: '#ffffff' }
      ];

    default:
      return [{ id: 'v0', x: 0, y: 0, color: '#ffffff' }];
  }
};

// Simplified: Returns only local transform matrix (no hierarchy)
export const calculateMatrix = (object: VamsObject): number[][] => {
  const { translateX, translateY, rotate, scale } = object.transform;
  const rad = (rotate * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return [
    [scale * cos, scale * -sin, translateX],
    [scale * sin, scale * cos, translateY],
    [0, 0, 1],
  ];
};