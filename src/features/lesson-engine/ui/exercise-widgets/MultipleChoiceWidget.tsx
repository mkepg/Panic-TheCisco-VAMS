import { Check, X } from 'lucide-react';
import './exercise-widgets.scss';

interface Props {
  prompt: string;
  options: { id: string; label: string }[];
  selectedId: string | null;
  correctId: string;
  onSelect: (id: string) => void;
}

export default function MultipleChoiceWidget({
  prompt, options, selectedId, correctId, onSelect,
}: Props) {
  return (
    <div className="exercise-widget mc-widget">
      <div className="widget-prompt">{prompt}</div>
      <div className="mc-options">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          const isCorrect = isSelected && opt.id === correctId;
          const isWrong = isSelected && opt.id !== correctId;
          return (
            <button
              key={opt.id}
              type="button"
              className={`mc-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              onClick={() => onSelect(opt.id)}
            >
              <span className="opt-label">{opt.label}</span>
              {isCorrect && <Check size={14} className="opt-icon correct" />}
              {isWrong && <X size={14} className="opt-icon wrong" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
