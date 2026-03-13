import { Shield } from 'lucide-react'

export default function PrivacyBanner() {
  return (
    <div className="bg-[#F3F4F6] border-b border-[#E5E7EB] px-6 py-2 flex items-center gap-2">
      <Shield size={11} className="text-[#9CA3AF] shrink-0" />
      <p className="text-[10px] text-[#9CA3AF] font-medium">
        All data is <span className="font-bold text-[#6B7280]">anonymized and aggregated</span>. Individual student data is never displayed.
        Minimum group size for any metric: <span className="font-bold text-[#6B7280]">30 students</span>.
      </p>
    </div>
  )
}
