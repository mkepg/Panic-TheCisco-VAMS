import type { PrimitiveType } from '@/types';

// Bug 9 fix: `calculateMatrix` has been removed. It was confirmed dead code —
// grep across the entire codebase found zero consumers of this export.
// The live matrix utilities are in sceneSlice.ts (flat number[6] format) and
// useBehaviorEngine.ts (number[][] 3×3 format). Those are not touched here
// as they are covered by a separate consolidation task (Bug 9 Phase 2).

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
    case 'POINTS':
      return [
        { id: 'v0', x: -0.5, y: 0, color: '#ffffff' },
        { id: 'v1', x: 0.5, y: 0, color: '#ffffff' },
      ];
    case 'LINE_STRIP':
      return [
        { id: 'v0', x: -0.5, y: -0.5, color: '#ffffff' },
        { id: 'v1', x: 0, y: 0.5, color: '#ffffff' },
        { id: 'v2', x: 0.5, y: -0.5, color: '#ffffff' },
      ];
    case 'POLYGON':
      return [
        { id: 'v0', x: -0.5, y: 0.5, color: '#ffffff' },
        { id: 'v1', x: 0.5, y: 0.5, color: '#ffffff' },
        { id: 'v2', x: 0.5, y: -0.5, color: '#ffffff' },
        { id: 'v3', x: -0.5, y: -0.5, color: '#ffffff' },
      ];
    case 'TRIANGLE_STRIP':
      return [
        { id: 'v0', x: -0.5, y: 0.5, color: '#ffffff' },
        { id: 'v1', x: 0.5, y: 0.5, color: '#ffffff' },
        { id: 'v2', x: -0.5, y: -0.5, color: '#ffffff' },
        { id: 'v3', x: 0.5, y: -0.5, color: '#ffffff' },
      ];
    default:
      return [{ id: 'v0', x: 0, y: 0, color: '#ffffff' }];
  }
};
