const TONE_STYLES = {
  thriving:   { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  good:       { bg: "#f7fee7", border: "#d9f99d", text: "#4d7c0f" },
  fair:       { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
  attention:  { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
  default:    { bg: "#F9FAFB", border: "#E5E7EB", text: "#6B7280" },
};

function toneFor(score) {
  if (score >= 80) return "thriving";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  if (score > 0)   return "attention";
  return "default";
}

export default function HostelHeatmapGrid({ hostels = [], onHover, hoveredHostel }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {hostels.map((h) => {
        const tone   = toneFor(h.avg_score || h.score || 0);
        const styles = TONE_STYLES[tone];
        const isHov  = hoveredHostel === h.hostel || hoveredHostel === h.name;
        return (
          <div
            key={h.hostel || h.name}
            onMouseEnter={() => onHover?.(h.hostel || h.name)}
            onMouseLeave={() => onHover?.(null)}
            style={{ backgroundColor: styles.bg, borderColor: isHov ? "#111827" : styles.border }}
            className="border p-3 cursor-default transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#111827]">{h.hostel || h.name}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: styles.text }}>{h.label || tone}</span>
            </div>
            <p className="text-[18px] font-bold text-[#111827]">
              {(h.avg_score || h.score || 0).toFixed(1)}
            </p>
            {h.active_today != null && (
              <p className="text-[9px] text-[#9CA3AF] mt-0.5">{h.active_today} active today</p>
            )}
            {h.top_alert && (
              <p className="text-[9px] text-[#ef4444] mt-0.5 truncate">{h.top_alert}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
