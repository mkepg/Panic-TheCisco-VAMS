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
  precision = 2
}: NumberInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Display value: show edit value while focused, formatted value otherwise
  const displayValue = isFocused ? editValue : value.toFixed(precision);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.currentTarget.value);
  };

  const handleBlur = () => {
    let numValue = parseFloat(editValue);
    
    // Prevent NaN Deadlock when input is cleared completely
    if (isNaN(numValue)) {
      numValue = 0;
    }
    
    // Round to specified precision
    const rounded = parseFloat(numValue.toFixed(precision));
    onChange(rounded);
    setIsFocused(false);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setEditValue(value.toString());
    setIsFocused(true);
    // Select all text on next tick to ensure it works
    setTimeout(() => e.currentTarget.select(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setIsFocused(false);
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