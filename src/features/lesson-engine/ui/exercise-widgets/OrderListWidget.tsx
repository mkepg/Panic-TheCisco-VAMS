import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import './exercise-widgets.scss';

interface Props {
  prompt: string;
  items: { id: string; label: string }[];
  order: string[];
  correctOrder: string[];
  onChange: (order: string[]) => void;
}

export default function OrderListWidget({
  prompt, items, order, correctOrder, onChange,
}: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const ordered = order
    .map((id) => items.find((i) => i.id === id))
    .filter((x): x is { id: string; label: string } => Boolean(x));

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const next = [...order];
    const fromIdx = next.indexOf(draggedId);
    const toIdx = next.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, draggedId);
    onChange(next);
    setDraggedId(null);
  };

  return (
    <div className="exercise-widget order-widget">
      <div className="widget-prompt">{prompt}</div>
      <ol className="order-list">
        {ordered.map((item, idx) => {
          const isCorrectPosition = correctOrder[idx] === item.id;
          return (
            <li
              key={item.id}
              className={`order-item ${draggedId === item.id ? 'dragging' : ''} ${isCorrectPosition ? 'correct-pos' : ''}`}
              draggable
              onDragStart={() => setDraggedId(item.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(item.id)}
              onDragEnd={() => setDraggedId(null)}
            >
              <GripVertical size={12} className="drag-handle" />
              <span className="order-num">{idx + 1}</span>
              <span className="order-label">{item.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
