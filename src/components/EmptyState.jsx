export default function EmptyState({ title = "No data yet", message = "Data will appear here once enough responses are collected.", action = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border border-[#E5E7EB] bg-[#FAFAFA]">
      <div className="w-10 h-10 border-2 border-[#E5E7EB] flex items-center justify-center mb-4">
        <div className="w-4 h-4 border border-[#9CA3AF]" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#111827] mb-1">{title}</p>
      <p className="text-[10px] text-[#9CA3AF] max-w-xs text-center">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-[9px] font-bold uppercase tracking-widest bg-[#111827] text-white hover:bg-[#1f2937] transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
