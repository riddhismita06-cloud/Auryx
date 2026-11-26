import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import { formatDateDDMMYYYY, parseDDMMYYYYToISO } from '../utils/formatters';

interface IndianDateInputProps {
  id?: string;
  value: string; // YYYY-MM-DD
  onChange: (isoDate: string) => void;
  required?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
}

export const IndianDateInput: React.FC<IndianDateInputProps> = ({
  id,
  value,
  onChange,
  required,
  ariaLabel,
  placeholder = 'DD/MM/YYYY',
  className = '',
}) => {
  const [text, setText] = useState(() => formatDateDDMMYYYY(value));
  const nativePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(formatDateDDMMYYYY(value));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setText(next);
    if (next.trim() === '') {
      if (!required) onChange('');
      return;
    }
    const iso = parseDDMMYYYYToISO(next);
    if (iso) {
      onChange(iso);
    }
  };

  const handleBlur = () => {
    if (!text.trim()) {
      if (!required) {
        onChange('');
      } else {
        setText(formatDateDDMMYYYY(value));
      }
      return;
    }
    const iso = parseDDMMYYYYToISO(text);
    if (iso) {
      setText(formatDateDDMMYYYY(iso));
    } else {
      setText(formatDateDDMMYYYY(value));
    }
  };

  const openPicker = () => {
    const picker = nativePickerRef.current;
    if (!picker) return;
    if (typeof picker.showPicker === 'function') {
      try {
        picker.showPicker();
        return;
      } catch {
        // Fallback to focus/click
      }
    }
    picker.click();
  };

  return (
    <div className="relative flex items-center">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-label={ariaLabel}
        required={required}
        className={`w-full pr-9 tabular-nums ${className}`}
      />
      <button
        type="button"
        onClick={openPicker}
        aria-label={ariaLabel ? `Pick ${ariaLabel}` : 'Open calendar'}
        className="absolute right-2.5 p-1 rounded text-[#69706B] dark:text-[#8BA393] hover:text-[#152A20] dark:hover:text-[#C5A869] transition-colors"
      >
        <Calendar className="w-4 h-4" />
      </button>
      <input
        ref={nativePickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value);
          }
        }}
        className="sr-only"
      />
    </div>
  );
};
