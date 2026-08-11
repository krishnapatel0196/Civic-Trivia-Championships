interface ReasonChipProps {
  label: string;
  value: string;
  selected: boolean;
  onToggle: (value: string) => void;
}

export function ReasonChip({ label, value, selected, onToggle }: ReasonChipProps) {
  const handleClick = () => {
    onToggle(value);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selected}
      aria-label={`${selected ? 'Deselect' : 'Select'} ${label}`}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? 'bg-amber-500 text-white'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      }`}
    >
      {label}
    </button>
  );
}
