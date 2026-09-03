import type { IELTSSection } from '../types/question';

interface IELTSSectionSelectProps {
  value?: IELTSSection | '';
  onChange: (value: IELTSSection | '') => void;
  disabled?: boolean;
}

const sections: IELTSSection[] = ['Listening', 'Reading', 'Writing', 'Speaking'];
export function IELTSSectionSelect({ value, onChange, disabled }: IELTSSectionSelectProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">IELTS Section (optional)</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value as IELTSSection | '')}
        disabled={disabled}
        className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
      >
        <option value="">None</option>
        {sections.map((section) => (
          <option key={section} value={section}>
            {section}
          </option>
        ))}
      </select>
      {value && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
          <span>Section: {value}</span>
        </div>
      )}
    </div>
  );
}
