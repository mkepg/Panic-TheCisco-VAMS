import { Texture, Assets } from 'pixi.js';
import type { TextureAsset } from '@/core/types/textures';
import { useVamsStore } from '@/core/store';

const cache = new Map<string, Texture>();
const pending = new Map<string, Promise<Texture>>();

/** Synchronous getter — returns a cached Texture if loaded, else null. */
export function getCachedTexture(asset: TextureAsset): Texture | null {
  return cache.get(asset.id) ?? null;
}

/**
 * Returns a cached `Texture` synchronously, or `null` while the bitmap
 * is still decoding. On miss, kicks off `Assets.load(dataUrl)`; once
 * it resolves the texture is cached AND the store's
 * `notifyTextureLoaded(id)` is called, which bumps `textureLoadedTick`
 * and clones the `texture` attachment on every dependent SceneNode.
 *
 * That clone is what triggers `useSceneRenderer`'s rebuild check —
 * `prevObj.texture !== obj.texture` — so the placeholder mesh gets
 * replaced with the textured one without any global events.
 */
export function ensureTexture(asset: TextureAsset): Texture | null {
  const existing = cache.get(asset.id);
  if (existing) return existing;
  if (pending.has(asset.id)) return null;

  const p = Assets.load<Texture>(asset.dataUrl)
    .then((tex) => {
      cache.set(asset.id, tex);
      pending.delete(asset.id);
      // Hand the result to the store; subscribers do the rest.
      useVamsStore.getState().notifyTextureLoaded(asset.id);
      return tex;
    })
    .catch((err) => {
      pending.delete(asset.id);
      console.error(`[textures] Failed to load "${asset.name}":`, err);
      throw err;
    });
  pending.set(asset.id, p);
  return null;
}

/** Drop a texture from the cache when it's removed from the library. */
export function dropTexture(id: string) {
  const t = cache.get(id);
  if (t) {
    t.destroy(true);
    cache.delete(id);
  }
}
