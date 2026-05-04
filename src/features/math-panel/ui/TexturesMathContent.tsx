import { useVamsStore } from '@/core/store';
import { Image as ImageIcon, Filter, Repeat } from 'lucide-react';

const TEXTURABLE_TYPES = new Set([
  'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN',
  'QUADS', 'QUAD_STRIP', 'POLYGON',
]);

/**
 * Stage 5 — Textures math content. Styles live in `_textures-math.scss`,
 * which is wired into the panel via `math-panel.scss` (`@use 'textures-math';`).
 * No direct SCSS import here — the underscore-prefixed file is a Sass partial.
 */
export default function TexturesMathContent() {
  const objects = useVamsStore((s) => s.objects);
  const selectedObjectId = useVamsStore((s) => s.selectedObjectId);
  const getTextureById = useVamsStore((s) => s.getTextureById);

  const selected = objects.find((o) => o.id === selectedObjectId);

  if (!selected || !TEXTURABLE_TYPES.has(selected.type)) {
    return (
      <div className="math-empty">
        <p>
          Select a fillable primitive — triangle, quad, or polygon — to see how
          its UV coordinates and sampling rules turn pixels into surface color.
        </p>
      </div>
    );
  }

  if (!selected.texture || !selected.uvs) {
    return (
      <div className="math-empty">
        <p>
          <strong>{selected.name}</strong> has no texture attached yet. Apply
          one from the library to inspect its UV mapping and sampler equations.
        </p>
      </div>
    );
  }

  const tex = getTextureById(selected.texture.textureId);
  const filter = selected.texture.filter;
  const wrap = selected.texture.wrap;

  return (
    <div className="tx-math">
      <header className="tx-math-head">
        <ImageIcon size={14} />
        <h4>{selected.name}</h4>
      </header>

      <section>
        <div className="tx-meta-row">
          <span>Texture</span>
          <strong>{tex?.name ?? '(missing)'} · {tex ? `${tex.width}×${tex.height}` : '—'}</strong>
        </div>
        <div className="tx-meta-row">
          <span>Filter</span>
          <strong>{filter === 'NEAREST' ? 'GL_NEAREST' : 'GL_LINEAR'}</strong>
        </div>
        <div className="tx-meta-row">
          <span>Wrap</span>
          <strong>{wrap === 'CLAMP_TO_EDGE' ? 'GL_CLAMP_TO_EDGE' : 'GL_REPEAT'}</strong>
        </div>
      </section>

      <section>
        <h5>UV Table</h5>
        <p>
          Each vertex carries a (u, v) pair that points into normalized texture
          space. (0, 0) is the bottom-left of the image; (1, 1) is the top-right.
        </p>
        <div className="tx-uv-table">
          <div className="tx-uv-table-head">
            <span>#</span><span>u</span><span>v</span>
          </div>
          {selected.uvs.map((uv, i) => (
            <div className="tx-uv-table-row" key={i}>
              <span>{i}</span>
              <span>{uv.u.toFixed(3)}</span>
              <span>{uv.v.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h5><Filter size={11} /> Filtering</h5>
        <p>
          When a fragment lands at sample point (u, v), the texture's width W
          and height H scale it into texel coordinates:
        </p>
        <pre className="tx-eq">x = u · W,    y = v · H</pre>
        <p>
          {filter === 'NEAREST'
            ? 'Nearest-neighbour picks the single texel that contains (x, y):'
            : 'Linear sampling blends the four texels surrounding (x, y) by their fractional distance:'}
        </p>
        {filter === 'NEAREST' ? (
          <pre className="tx-eq">color = T[ ⌊x⌋ , ⌊y⌋ ]</pre>
        ) : (
          <pre className="tx-eq">{`α = x − ⌊x⌋   β = y − ⌊y⌋
color = (1−α)(1−β) · T[i,j]
      +   α  (1−β) · T[i+1,j]
      + (1−α)  β   · T[i,j+1]
      +   α    β   · T[i+1,j+1]`}</pre>
        )}
      </section>

      <section>
        <h5><Repeat size={11} /> Wrap mode</h5>
        <p>
          When (u, v) drifts outside [0, 1], the wrap mode decides which texel
          to read:
        </p>
        {wrap === 'REPEAT' ? (
          <pre className="tx-eq">{`u' = u − ⌊u⌋
v' = v − ⌊v⌋     (tile forever)`}</pre>
        ) : (
          <pre className="tx-eq">{`u' = clamp(u, 0, 1)
v' = clamp(v, 0, 1)   (stretch the edge)`}</pre>
        )}
      </section>

      <section>
        <h5>Across the triangle</h5>
        <p>
          Inside a triangle the per-vertex UVs are interpolated by barycentric
          weights (λ₀, λ₁, λ₂) summing to 1:
        </p>
        <pre className="tx-eq">{`u(p) = λ₀·u₀ + λ₁·u₁ + λ₂·u₂
v(p) = λ₀·v₀ + λ₁·v₁ + λ₂·v₂`}</pre>
        <p>
          That smoothly-varying (u, v) is what each fragment hands to the
          sampler — so the texture follows the geometry across the whole face.
        </p>
      </section>
    </div>
  );
}
