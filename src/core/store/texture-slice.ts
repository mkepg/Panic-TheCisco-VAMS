import type { StateCreator } from 'zustand';
import type { VamsState } from './types';
import type { TextureAsset } from '@/core/types/textures';
import { getSampleTextures } from '@/features/textures/lib/sample-textures';

export interface TextureSlice {
  /** Uploaded textures only — sample textures are merged in at read time. */
  uploadedTextures: TextureAsset[];
  /** Most-recently selected library entry; drives the Apply panel. */
  activeTextureId: string | null;
  /**
   * Bumps each time a previously-async texture finishes decoding.
   * Used as a coarse "something cached" signal for the scene renderer
   * and the code panel — they react to it via Zustand's normal selector
   * subscriptions, no global events needed.
   */
  textureLoadedTick: number;

  getAllTextures: () => TextureAsset[];
  getTextureById: (id: string) => TextureAsset | undefined;

  addUploadedTexture: (asset: TextureAsset) => void;
  removeUploadedTexture: (id: string) => void;
  setActiveTexture: (id: string | null) => void;

  /**
   * Called by `pixi-texture-cache` after a Texture finishes decoding.
   * Bumps `textureLoadedTick` AND clones the `texture` attachment on every
   * SceneNode that references this texture id — the cloned reference
   * trips `prevObj.texture !== obj.texture` in the scene renderer's
   * needsRebuild check, prompting a fresh `createDrawable` call now that
   * the bitmap is cached.
   */
  notifyTextureLoaded: (textureId: string) => void;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID(); } catch { /* fallback */ }
  }
  return 'tex-' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
};

export const createTextureSlice: StateCreator<VamsState, [], [], TextureSlice> = (set, get) => ({
  uploadedTextures: [],
  activeTextureId: null,
  textureLoadedTick: 0,

  getAllTextures: () => {
    const samples = getSampleTextures();
    return [...samples, ...get().uploadedTextures];
  },

  getTextureById: (id) => get().getAllTextures().find((t) => t.id === id),

  addUploadedTexture: (asset) => {
    get().pushToHistory();
    const id = asset.id || generateId();
    set((s) => ({
      uploadedTextures: [...s.uploadedTextures, { ...asset, id }],
      activeTextureId: id,
    }));
  },

  removeUploadedTexture: (id) => {
    get().pushToHistory();
    set((s) => {
      // Detach the texture from any object that's using it.
      const objects = s.objects.map((o) => {
        if (o.texture?.textureId === id) return { ...o, texture: null };
        return o;
      });
      return {
        uploadedTextures: s.uploadedTextures.filter((t) => t.id !== id),
        activeTextureId: s.activeTextureId === id ? null : s.activeTextureId,
        objects,
      };
    });
  },

  setActiveTexture: (id) => set({ activeTextureId: id }),

  notifyTextureLoaded: (textureId) => {
    // No pushToHistory — this is an async resolution, not a user action.
    set((s) => {
      let touched = false;
      const objects = s.objects.map((o) => {
        if (o.texture && o.texture.textureId === textureId) {
          touched = true;
          // Force a fresh reference so `prevObj.texture !== obj.texture`
          // fires in the renderer. Values are unchanged.
          return { ...o, texture: { ...o.texture } };
        }
        return o;
      });
      return {
        textureLoadedTick: s.textureLoadedTick + 1,
        objects: touched ? objects : s.objects,
      };
    });
  },
});
