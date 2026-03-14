const PRESETS = [
  { label: "7D",  value: "7d"  },
  { label: "14D", value: "14d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
];

export default function DateRangeFilter({ value, onChange, presets = PRESETS }) {
  return (
    <div className="flex gap-1">
      {presets.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all ${
            value === p.value
              ? "bg-[#111827] text-white border-[#111827]"
              : "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#111827]"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
