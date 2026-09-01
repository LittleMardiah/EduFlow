import type { Option, QuestionType } from '../../types/question';

interface AnswerInputProps {
  questionType: QuestionType;
  options?: Option[];
  value: string | string[] | undefined;
  onChange: (answer: string | string[]) => void;
}

export function AnswerInput({ questionType, options, value, onChange }: AnswerInputProps) {
  switch (questionType) {
    case 'mcq':
      return (
        <div className="space-y-2">
          {(options ?? []).map((opt, idx) => (
            <label
              key={opt.id ?? idx}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                value === opt.option_text
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="mcq-answer"
                checked={value === opt.option_text}
                onChange={() => onChange(opt.option_text)}
                className="text-indigo-600"
              />
              <span className="font-medium text-sm">{String.fromCharCode(65 + idx)}.</span>
              <span className="text-sm">{opt.option_text}</span>
            </label>
          ))}
        </div>
      );

    case 'true_false':
      return (
        <div className="flex gap-4">
          {(['True', 'False'] as const).map((val) => (
            <label
              key={val}
              className={`flex items-center gap-2 p-4 rounded-lg border cursor-pointer flex-1 justify-center transition ${
                value === val.toLowerCase()
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="tf-answer"
                checked={value === val.toLowerCase()}
                onChange={() => onChange(val.toLowerCase())}
                className="text-indigo-600"
              />
              <span className="font-medium">{val}</span>
            </label>
          ))}
        </div>
      );

    case 'short_answer':
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="Type your answer..."
        />
      );

    case 'essay':
      return (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          rows={6}
          placeholder="Write your response..."
        />
      );

    default:
      return <div className="text-gray-500 text-sm">Unsupported question type.</div>;
  }
}
