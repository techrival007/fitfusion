import { achievements } from '../data/mockData'
import { useStudentAuth } from '../context/StudentAuthContext'
import { Award, Lock } from 'lucide-react'

export default function Achievements() {
  const { user } = useStudentAuth()
  const earned = achievements.filter(a => a.earned)
  const totalPoints = earned.reduce((s, a) => s + a.points, 0)

  return (
    <div className="p-6 space-y-5">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">My Progress</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Achievements</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E7EB] p-4 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">Total Points</p>
          <p className="text-[28px] font-bold text-[#111827]">{user?.totalPoints?.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] p-4 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">Streak</p>
          <p className="text-[28px] font-bold text-[#111827]">🔥 {user?.streakDays}d</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] p-4 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">Badges Earned</p>
          <p className="text-[28px] font-bold text-[#111827]">{earned.length}/{achievements.length}</p>
        </div>
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {achievements.map(a => (
          <div
            key={a.id}
            className={`bg-white border p-5 relative overflow-hidden ${a.earned ? 'border-[#E5E7EB]' : 'border-[#E5E7EB] opacity-50'}`}
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <svg width="100%" height="100%">
                <defs><pattern id={`ach-${a.id}`} width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#111827" strokeWidth="0.5" /></pattern></defs>
                <rect width="100%" height="100%" fill={`url(#ach-${a.id})`} />
              </svg>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 border flex items-center justify-center shrink-0 ${a.earned ? 'bg-[#111827] border-[#111827]' : 'bg-[#F3F4F6] border-[#E5E7EB]'}`}>
                {a.earned ? <Award size={18} className="text-white" /> : <Lock size={14} className="text-[#9CA3AF]" />}
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#111827]">{a.title}</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">{a.description}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest mt-2" style={{ color: a.earned ? '#22c55e' : '#9CA3AF' }}>
                  {a.earned ? `+${a.points} pts earned` : `${a.points} pts — locked`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
