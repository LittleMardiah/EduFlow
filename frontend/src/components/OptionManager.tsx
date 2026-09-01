import { useState } from 'react';
import type { Option } from '../types/question';

interface OptionManagerProps {
  options: Option[];
  onChange: (options: Option[]) => void;
  maxOptions?: number;
}

export function OptionManager({ options, onChange, maxOptions = 10 }: OptionManagerProps) {
  const [newOptionText, setNewOptionText] = useState('');

  const addOption = () => {
    if (!newOptionText.trim()) return;
    if (options.length >= maxOptions) {
      alert(`Maximum ${maxOptions} options allowed`);
      return;
    }
    const newOption: Option = {
      option_text: newOptionText.trim(),
      is_correct: false,
      order_in_question: options.length + 1,
    };
    onChange([...options, newOption]);
    setNewOptionText('');
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      alert('MCQ must have at least 2 options');
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    onChange(newOptions);
  };

  const toggleCorrect = (index: number) => {
    const newOptions = options.map((opt, i) => ({
      ...opt,
      is_correct: i === index ? !opt.is_correct : false,
    }));
    onChange(newOptions);
  };

  const updateText = (index: number, text: string) => {
    const newOptions = options.map((opt, i) =>
      i === index ? { ...opt, option_text: text } : opt
    );
    onChange(newOptions);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-6 text-sm font-medium">{String.fromCharCode(65 + idx)}.</span>
            <input
              type="text"
              value={opt.option_text}
              onChange={(e) => updateText(idx, e.target.value)}
              className="flex-1 px-3 py-1 border rounded-md"
              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
            />
            <button
              type="button"
              onClick={() => toggleCorrect(idx)}
              className={`px-3 py-1 rounded-md text-sm ${
                opt.is_correct
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {opt.is_correct ? '✓ Correct' : 'Mark Correct'}
            </button>
            <button
              type="button"
              onClick={() => removeOption(idx)}
              className="px-2 py-1 text-red-500 hover:text-red-700"
              disabled={options.length <= 2}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newOptionText}
          onChange={(e) => setNewOptionText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addOption()}
          placeholder="Add option..."
          className="flex-1 px-3 py-1 border rounded-md"
          disabled={options.length >= maxOptions}
        />
        <button
          type="button"
          onClick={addOption}
          disabled={options.length >= maxOptions}
          className="px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-gray-500">
        {options.length} / {maxOptions} options (MCQ must have at least 2 options)
      </p>
    </div>
  );
}
