const CPP_RESERVED: ReadonlySet<string> = new Set([
  'alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto',
  'bitand', 'bitor', 'bool', 'break',
  'case', 'catch', 'char', 'char8_t', 'char16_t', 'char32_t', 'class',
  'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit',
  'const_cast', 'continue', 'co_await', 'co_return', 'co_yield',
  'decltype', 'default', 'delete', 'do', 'double', 'dynamic_cast',
  'else', 'enum', 'explicit', 'export', 'extern',
  'false', 'float', 'for', 'friend',
  'goto',
  'if', 'inline', 'int',
  'long',
  'mutable',
  'namespace', 'new', 'noexcept', 'not', 'not_eq', 'nullptr',
  'operator', 'or', 'or_eq',
  'private', 'protected', 'public',
  'register', 'reinterpret_cast', 'requires', 'return',
  'short', 'signed', 'sizeof', 'static', 'static_assert', 'static_cast',
  'struct', 'switch',
  'template', 'this', 'thread_local', 'throw', 'true', 'try',
  'typedef', 'typeid', 'typename',
  'union', 'unsigned', 'using',
  'virtual', 'void', 'volatile',
  'wchar_t', 'while',
  'xor', 'xor_eq',
]);
export const sanitizeName = (name: string): string => {
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^[0-9]/.test(sanitized)) sanitized = '_' + sanitized;
  if (CPP_RESERVED.has(sanitized)) sanitized = sanitized + '_obj';
  return sanitized;
};
export const hexToGlColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return `${r.toFixed(2)}f, ${g.toFixed(2)}f, ${b.toFixed(2)}f`;
};
import type { PrimitiveType } from "@/core/types/scene";
export const getGlPrimitive = (type: PrimitiveType): string => {
  const map: Record<PrimitiveType, string> = {
    POINTS:         'GL_POINTS',
    LINES:          'GL_LINES',
    LINE_STRIP:     'GL_LINE_STRIP',
    LINE_LOOP:      'GL_LINE_LOOP',
    TRIANGLES:      'GL_TRIANGLES',
    TRIANGLE_STRIP: 'GL_TRIANGLE_STRIP',
    TRIANGLE_FAN:   'GL_TRIANGLE_FAN',
    QUADS:          'GL_QUADS',
    QUAD_STRIP:     'GL_QUAD_STRIP',
    POLYGON:        'GL_POLYGON',
  };
  return map[type] ?? 'GL_POINTS';
};