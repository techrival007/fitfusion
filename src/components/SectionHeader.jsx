export default function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-[#111827]">{title}</h2>
        {subtitle && <p className="text-[10px] text-[#9CA3AF] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
