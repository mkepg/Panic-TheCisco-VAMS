import './buffers-panel.scss';
import { Database, Cpu, HardDrive, Hash, Info, Boxes, Pencil, Pointer } from 'lucide-react';
import { useVamsStore } from '@/core/store';
import CollapsibleSection from '@/shared/ui/collapsible-section/CollapsibleSection';
import type {
  BufferUpdateMethod,
  BufferUsage,
  RenderingMode,
  SceneNode,
} from '@/core/types/scene';

const NON_PRIMITIVE_TYPES: ReadonlySet<SceneNode['type']> = new Set(['GROUP', 'TEXT']);

interface ModeOption {
  id: RenderingMode;
  label: string;
  api: string;
  hint: string;
}

const MODE_OPTIONS: ModeOption[] = [
  { id: 'IMMEDIATE',    label: 'Immediate',    api: 'glBegin / glEnd', hint: 'Re-issued every frame' },
  { id: 'VERTEX_ARRAY', label: 'Vertex Array', api: 'glDrawArrays',    hint: 'Client memory, sent each frame' },
  { id: 'VBO',          label: 'VBO',          api: 'glBufferData',    hint: 'Uploaded once, lives on GPU' },
];

interface UsageOption {
  id: BufferUsage;
  label: string;
  macro: string;
  hint: string;
}

const USAGE_OPTIONS: UsageOption[] = [
  { id: 'STATIC',  label: 'Static',  macro: 'GL_STATIC_DRAW',  hint: 'Set once · drawn many times' },
  { id: 'DYNAMIC', label: 'Dynamic', macro: 'GL_DYNAMIC_DRAW', hint: 'Updated occasionally' },
  { id: 'STREAM',  label: 'Stream',  macro: 'GL_STREAM_DRAW',  hint: 'Updated every frame' },
];

interface UpdateMethodOption {
  id: BufferUpdateMethod;
  label: string;
  api: string;
  hint: string;
  icon: typeof Pencil;
}

const UPDATE_METHOD_OPTIONS: UpdateMethodOption[] = [
  {
    id: 'BUFFER_SUB_DATA',
    label: 'Sub Data',
    api: 'glBufferSubData',
    hint: 'Push a range of bytes to the GPU',
    icon: Pencil,
  },
  {
    id: 'MAP_BUFFER',
    label: 'Map Buffer',
    api: 'glMapBuffer',
    hint: 'Edit GPU memory through a pointer',
    icon: Pointer,
  },
];

export default function BuffersPanel() {
  const objects = useVamsStore((s) => s.objects);
  const selectedObjectId = useVamsStore((s) => s.selectedObjectId);
  const updateRenderingMode = useVamsStore((s) => s.updateRenderingMode);
  const updateBufferUsage = useVamsStore((s) => s.updateBufferUsage);
  const updateUseIndexed = useVamsStore((s) => s.updateUseIndexed);
  const updateUpdateMethod = useVamsStore((s) => s.updateUpdateMethod);

  const selected = objects.find((o) => o.id === selectedObjectId);

  if (!selected) {
    return (
      <CollapsibleSection
        panelId="buffers-panel"
        title="Memory & Buffers"
        icon={<Database size={14} />}
        defaultOpen={true}
      >
        <div className="bp-empty">
          <Boxes size={28} className="bp-empty-icon" strokeWidth={1.5} />
          <p>Select a primitive to manage how its vertex data is stored and submitted to OpenGL.</p>
        </div>
      </CollapsibleSection>
    );
  }

  if (NON_PRIMITIVE_TYPES.has(selected.type)) {
    return (
      <CollapsibleSection
        panelId="buffers-panel"
        title="Memory & Buffers"
        icon={<Database size={14} />}
        defaultOpen={true}
      >
        <div className="bp-empty">
          <p>Buffer settings apply to drawing primitives only. Select a shape to continue.</p>
        </div>
      </CollapsibleSection>
    );
  }

  const mode: RenderingMode = selected.renderingMode ?? 'IMMEDIATE';
  const usage: BufferUsage = selected.bufferUsage ?? 'STATIC';
  const updateMethod: BufferUpdateMethod = selected.updateMethod ?? 'BUFFER_SUB_DATA';
  const indexed = !!selected.useIndexed;

  const showUsage = mode === 'VBO';
  const showUpdateMethod = mode === 'VBO' && usage === 'DYNAMIC';

  return (
    <CollapsibleSection
      panelId="buffers-panel"
      title="Memory & Buffers"
      icon={<Database size={14} />}
      defaultOpen={true}
    >
      <div className="bp-panel">

        {/* ---- Rendering Mode segmented control ---- */}
        <div className="bp-block">
          <div className="bp-block-head">
            <span className="bp-block-label">Rendering Mode</span>
            <span className="bp-block-hint">{MODE_OPTIONS.find((m) => m.id === mode)!.api}</span>
          </div>
          <div className="bp-mode-grid" role="radiogroup" aria-label="Rendering mode">
            {MODE_OPTIONS.map((opt) => {
              const active = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`bp-mode-btn ${active ? 'active' : ''}`}
                  role="radio"
                  aria-checked={active}
                  onClick={() => updateRenderingMode(selected.id, opt.id)}
                  title={opt.api}
                >
                  <span className="bp-mode-icon">
                    {opt.id === 'IMMEDIATE' && <Cpu size={13} />}
                    {opt.id === 'VERTEX_ARRAY' && <HardDrive size={13} />}
                    {opt.id === 'VBO' && <Database size={13} />}
                  </span>
                  <span className="bp-mode-name">{opt.label}</span>
                  <span className="bp-mode-hint">{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Buffer Usage Hint (VBO only) ---- */}
        {showUsage && (
          <div className="bp-block">
            <div className="bp-block-head">
              <span className="bp-block-label">Buffer Usage</span>
              <span className="bp-block-hint">{USAGE_OPTIONS.find((u) => u.id === usage)!.macro}</span>
            </div>
            <div className="bp-usage-grid" role="radiogroup" aria-label="Buffer usage hint">
              {USAGE_OPTIONS.map((opt) => {
                const active = usage === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`bp-usage-btn ${active ? 'active' : ''}`}
                    role="radio"
                    aria-checked={active}
                    onClick={() => updateBufferUsage(selected.id, opt.id)}
                    title={opt.macro}
                  >
                    <span className="bp-usage-name">{opt.label}</span>
                    <span className="bp-usage-hint">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Update Method (VBO + DYNAMIC only) ----
             STATIC has no update path. STREAM always re-uploads the whole
             buffer regardless. The choice between sub-data and map-buffer
             only meaningfully changes the emitted code for DYNAMIC. */}
        {showUpdateMethod && (
          <div className="bp-block">
            <div className="bp-block-head">
              <span className="bp-block-label">Update Method</span>
              <span className="bp-block-hint">
                {UPDATE_METHOD_OPTIONS.find((u) => u.id === updateMethod)!.api}
              </span>
            </div>
            <div className="bp-method-grid" role="radiogroup" aria-label="Buffer update method">
              {UPDATE_METHOD_OPTIONS.map((opt) => {
                const active = updateMethod === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`bp-method-btn ${active ? 'active' : ''}`}
                    role="radio"
                    aria-checked={active}
                    onClick={() => updateUpdateMethod(selected.id, opt.id)}
                    title={opt.api}
                  >
                    <span className="bp-method-icon"><Icon size={13} /></span>
                    <span className="bp-method-name">{opt.label}</span>
                    <span className="bp-method-hint">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Indexed Drawing toggle ---- */}
        <div className="bp-block">
          <div className="bp-block-head">
            <span className="bp-block-label">Indexed Drawing</span>
            <span className="bp-block-hint">{indexed ? 'glDrawElements' : 'glDrawArrays'}</span>
          </div>
          <button
            type="button"
            className={`bp-indexed-toggle ${indexed ? 'on' : ''}`}
            onClick={() => updateUseIndexed(selected.id, !indexed)}
            aria-pressed={indexed}
          >
            <span className="bp-indexed-dot" />
            <span className="bp-indexed-content">
              <span className="bp-indexed-name">
                <Hash size={11} /> Deduplicate vertices
              </span>
              <span className="bp-indexed-sub">
                {indexed
                  ? 'Vertices reused via an index array.'
                  : 'Each vertex is emitted in order — repetition is allowed.'}
              </span>
            </span>
          </button>
        </div>

        {/* ---- Footnote ---- */}
        <div className="bp-note" role="note">
          <Info size={12} className="bp-note-icon" aria-hidden />
          <p>
            Visual output is identical across modes — switching changes the
            generated code structure. Watch the code panel for the diff, especially
            when you change usage or update method.
          </p>
        </div>
      </div>
    </CollapsibleSection>
  );
}
