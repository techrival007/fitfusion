import { Shield } from 'lucide-react'

export default function PrivacyBanner() {
  return (
    <div className="bg-[var(--app-bg)] border-b border-[var(--border-main)] px-6 py-2 flex items-center gap-2">
      <Shield size={11} className="text-[var(--text-muted)] shrink-0" />
      <p className="text-[10px] text-[var(--text-muted)] font-medium">
        All data is <span className="font-bold text-[var(--text-subtle)]">anonymized and aggregated</span>. Individual student data is never displayed.
        Minimum group size for any metric: <span className="font-bold text-[var(--text-subtle)]">30 students</span>.
      </p>
    </div>
  )
}
