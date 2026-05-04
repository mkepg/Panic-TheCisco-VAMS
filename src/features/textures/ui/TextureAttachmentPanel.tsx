import './textures-panels.scss';
import { Link, Unlink, Hash, Filter, Repeat, Square as SquareIcon, ImageOff } from 'lucide-react';
import { useVamsStore } from '@/core/store';
import CollapsibleSection from '@/shared/ui/collapsible-section/CollapsibleSection';
import type { SceneNode } from '@/core/types/scene';
import type { TextureFilter, TextureWrap } from '@/core/types/textures';

const TEXTUREABLE_TYPES: ReadonlySet<SceneNode['type']> = new Set([
  'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN',
  'QUADS', 'QUAD_STRIP', 'POLYGON',
]);

export default function TextureAttachmentPanel() {
  const objects = useVamsStore((s) => s.objects);
  const selectedObjectId = useVamsStore((s) => s.selectedObjectId);
  const activeTextureId = useVamsStore((s) => s.activeTextureId);
  const getTextureById = useVamsStore((s) => s.getTextureById);
  const attachTexture = useVamsStore((s) => s.attachTexture);
  const detachTexture = useVamsStore((s) => s.detachTexture);
  const updateTextureFilter = useVamsStore((s) => s.updateTextureFilter);
  const updateTextureWrap = useVamsStore((s) => s.updateTextureWrap);

  const selected = objects.find((o) => o.id === selectedObjectId);

  if (!selected || !TEXTUREABLE_TYPES.has(selected.type)) {
    return (
      <CollapsibleSection
        panelId="texture-attach"
        title="Apply Texture"
        icon={<Link size={14} />}
        defaultOpen={true}
      >
        <div className="tx-attach-empty">
          <ImageOff size={28} strokeWidth={1.5} />
          <p>
            Select a fillable primitive — triangle, quad, or polygon — to apply a texture to it.
          </p>
        </div>
      </CollapsibleSection>
    );
  }

  const attached = selected.texture
    ? getTextureById(selected.texture.textureId)
    : null;

  const candidate = activeTextureId ? getTextureById(activeTextureId) : null;
  const canApply = !!candidate;

  const filter: TextureFilter = selected.texture?.filter ?? 'LINEAR';
  const wrap: TextureWrap = selected.texture?.wrap ?? 'REPEAT';

  return (
    <CollapsibleSection
      panelId="texture-attach"
      title="Apply Texture"
      icon={<Link size={14} />}
      defaultOpen={true}
    >
      <div className="tx-attach">
        {attached ? (
          <div className="tx-attach-active-row">
            <div
              className="tx-attach-thumb"
              style={{ backgroundImage: `url(${attached.dataUrl})` }}
            />
            <div className="tx-attach-info">
              <span className="tx-attach-name">{attached.name}</span>
              <span className="tx-attach-dim">
                {attached.width} × {attached.height}
              </span>
            </div>
            <button
              type="button"
              className="tx-attach-detach"
              onClick={() => detachTexture(selected.id)}
            >
              <Unlink size={11} />
              <span>Detach</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="tx-attach-apply"
            disabled={!canApply}
            onClick={() => candidate && attachTexture(selected.id, candidate.id)}
            title={
              canApply
                ? `Apply "${candidate!.name}" to ${selected.name}`
                : 'Pick a texture in the library first'
            }
          >
            <Link size={13} />
            <span>
              {canApply ? `Apply "${candidate!.name}"` : 'Pick a texture in the library above'}
            </span>
          </button>
        )}

        {selected.texture && (
          <>
            <div className="tx-attach-block">
              <div className="tx-attach-block-head">
                <span className="tx-attach-block-label">Filter</span>
                <span className="tx-attach-block-hint">
                  {filter === 'NEAREST' ? 'GL_NEAREST' : 'GL_LINEAR'}
                </span>
              </div>
              <div className="tx-attach-toggle" role="radiogroup" aria-label="Filter mode">
                <button
                  type="button"
                  className={filter === 'NEAREST' ? 'active' : ''}
                  onClick={() => updateTextureFilter(selected.id, 'NEAREST')}
                  title="Nearest-neighbour sampling — blocky on zoom"
                >
                  <Hash size={11} />
                  <span>Nearest</span>
                </button>
                <button
                  type="button"
                  className={filter === 'LINEAR' ? 'active' : ''}
                  onClick={() => updateTextureFilter(selected.id, 'LINEAR')}
                  title="Bilinear sampling — smooth on zoom"
                >
                  <Filter size={11} />
                  <span>Linear</span>
                </button>
              </div>
            </div>

            <div className="tx-attach-block">
              <div className="tx-attach-block-head">
                <span className="tx-attach-block-label">Wrap</span>
                <span className="tx-attach-block-hint">
                  {wrap === 'REPEAT' ? 'GL_REPEAT' : 'GL_CLAMP_TO_EDGE'}
                </span>
              </div>
              <div className="tx-attach-toggle" role="radiogroup" aria-label="Wrap mode">
                <button
                  type="button"
                  className={wrap === 'REPEAT' ? 'active' : ''}
                  onClick={() => updateTextureWrap(selected.id, 'REPEAT')}
                  title="Tile the texture beyond [0,1]"
                >
                  <Repeat size={11} />
                  <span>Repeat</span>
                </button>
                <button
                  type="button"
                  className={wrap === 'CLAMP_TO_EDGE' ? 'active' : ''}
                  onClick={() => updateTextureWrap(selected.id, 'CLAMP_TO_EDGE')}
                  title="Stretch the edge pixels beyond [0,1]"
                >
                  <SquareIcon size={11} />
                  <span>Clamp</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </CollapsibleSection>
  );
}
