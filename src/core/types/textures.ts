/** A single uploaded or sample texture image. */
export interface TextureAsset {
  id: string;
  name: string;
  /** Data URL — the source-of-truth for both rendering and project files. */
  dataUrl: string;
  width: number;
  height: number;
  /** True for VAMS-shipped sample textures (Checker, UV Test, Seamless). */
  isSample?: boolean;
}

/** glTexParameteri MIN/MAG filter mode. */
export type TextureFilter = 'NEAREST' | 'LINEAR';

/** glTexParameteri WRAP_S/WRAP_T mode. */
export type TextureWrap = 'REPEAT' | 'CLAMP_TO_EDGE';

/** What a SceneNode stores when a texture is attached to it. */
export interface TextureAttachment {
  textureId: string;
  filter: TextureFilter;
  wrap: TextureWrap;
}

/** A 2D UV coordinate; one entry per vertex of the textured object. */
export interface UV {
  u: number;
  v: number;
}
