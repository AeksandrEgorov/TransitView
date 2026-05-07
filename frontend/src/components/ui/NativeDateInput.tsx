interface Props {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
}

function NativeDateInput({
  value,
  onChange,
  min,
  max,
  required = false,
}: Props) {
  return (
    <input
      type="date"
      lang="et-EE"
      value={value}
      min={min}
      max={max}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      required={required}
    />
  );
}

export default NativeDateInput;