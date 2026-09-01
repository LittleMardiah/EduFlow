interface IELTSSectionSelectProps {
  value?: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | '';
  onChange: (value: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | '') => void;
  disabled?: boolean;
}

const sections = ['Listening', 'Reading', 'Writing', 'Speaking'] as const;
// TODO: [TECH DEBT] Refactor IELTS section type to shared enum (day 3-4)
export function IELTSSectionSelect({ value, onChange, disabled }: IELTSSectionSelectProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">IELTS Section (optional)</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value as NonNullable<IELTSSectionSelectProps['value']>)}
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
