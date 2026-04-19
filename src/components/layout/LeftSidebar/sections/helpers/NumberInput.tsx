import React, { useState, useRef } from 'react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon: React.ReactNode;
  iconClass?: string;
  step?: number;
  precision?: number;
}

const NumberInput = ({
  label,
  value,
  onChange,
  icon,
  iconClass,
  step = 0.1,
  precision = 2,
}: NumberInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Show the live edit string while focused; formatted prop value otherwise.
  const displayValue = isFocused ? editValue : value.toFixed(precision);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.currentTarget.value);
  };

  const handleBlur = () => {
    let numValue = parseFloat(editValue);
    // Prevent NaN deadlock when input is cleared completely.
    if (isNaN(numValue)) {
      numValue = 0;
    }
    const rounded = parseFloat(numValue.toFixed(precision));
    onChange(rounded);
    setIsFocused(false);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setEditValue(value.toString());
    setIsFocused(true);
    // Select all text on next tick so it works reliably across browsers.
    setTimeout(() => e.currentTarget.select(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      // Bug 4 fix: the original code only called `setIsFocused(false)` on Escape,
      // without calling `.blur()`. The browser then fired the native `blur` event
      // which triggered `handleBlur`, which parsed `editValue` — still containing
      // the in-progress text — and committed it via `onChange`. The cancel intent
      // was directly contradicted by the commit that followed.
      //
      // Fix: restore `editValue` to the original prop value BEFORE calling blur()
      // so that when `handleBlur` fires (which it will, because blur() triggers it),
      // it parses the original value and calls onChange with a no-op change.
      setEditValue(value.toString());
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="input-row">
      <label>
        <span className={`icon ${iconClass || ''}`}>{icon}</span>
        {label}
      </label>
      <input
        ref={inputRef}
        type="number"
        step={step}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default NumberInput;
