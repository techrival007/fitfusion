import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import { Activity, Eye, EyeOff, ArrowRight } from 'lucide-react'

const DEMO_CREDS = [
  { email: 'warden.bh3@iitd.ac.in', password: 'admin123', role: 'Warden', hostel: 'BH-3' },
  { email: 'mess@iitd.ac.in',        password: 'admin123', role: 'Mess Manager', hostel: 'Campus' },
  { email: 'dean@iitd.ac.in',        password: 'admin123', role: 'Dean of Students', hostel: 'All Hostels' },
]

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAdminAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result.success) {
      const roleRoutes = { warden: '/admin/warden', mess_manager: '/admin/mess', dean: '/admin/dean' }
      navigate(roleRoutes[result.role])
    } else {
      setError(result.error || 'Invalid credentials. Use the demo accounts below.')
    }
  }

  const fillCreds = (cred) => {
    setEmail(cred.email)
    setPassword(cred.password)
    setError('')
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#111827] flex items-center justify-center rounded-lg">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Admin Access</p>
            <p className="text-[18px] font-bold text-[#111827]">UniVitals</p>
          </div>
        </div>

        {/* SVG decoration */}
        <div className="bg-white border border-[#E5E7EB] p-8 mb-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="login-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#111827" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#login-grid)" />
            </svg>
          </div>
          <div className="absolute top-4 right-4 opacity-[0.06] pointer-events-none">
            <svg width="80" height="80" viewBox="0 0 200 200">
              {[20,40,60,80].map(r => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#111827" strokeWidth="0.8" />)}
              <line x1="100" y1="0" x2="100" y2="200" stroke="#111827" strokeWidth="0.5" />
              <line x1="0" y1="100" x2="200" y2="100" stroke="#111827" strokeWidth="0.5" />
            </svg>
          </div>
          <div className="relative z-10">
            <h1 className="text-[13px] font-bold uppercase tracking-widest text-[#111827] mb-1">Administrator Login</h1>
            <p className="text-[10px] text-[#9CA3AF] mb-6">Campus Wellness Intelligence Platform</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5 text-[12px] text-[#111827] focus:outline-none focus:border-[#111827] transition-all font-mono"
                  placeholder="admin@university.edu"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5 text-[12px] text-[#111827] focus:outline-none focus:border-[#111827] transition-all font-mono pr-10"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              {error && <p className="text-[10px] text-[#ef4444] font-bold">{error}</p>}
              <button
                type="submit"
                className="w-full bg-[#111827] text-white py-3 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#1f2937] transition-all duration-150"
              >
                Sign In
                <ArrowRight size={13} />
              </button>
            </form>
          </div>
        </div>

        {/* Demo accounts */}
        <div className="border border-[#E5E7EB] bg-white p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">Demo Accounts — Click to Fill</p>
          <div className="space-y-2">
            {DEMO_CREDS.map(cred => (
              <button
                key={cred.email}
                onClick={() => fillCreds(cred)}
                className="w-full flex items-center justify-between px-3 py-2 border border-[#E5E7EB] hover:border-[#111827] transition-all duration-150 text-left group"
              >
                <div>
                  <p className="text-[11px] font-bold text-[#111827]">{cred.role}</p>
                  <p className="text-[9px] text-[#9CA3AF]">{cred.hostel} · {cred.email}</p>
                </div>
                <ArrowRight size={11} className="text-[#E5E7EB] group-hover:text-[#111827] transition-colors" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[9px] text-[#9CA3AF] mt-4">
          UniVitals v1.0 · FitFusion 2026 · IIT Roorkee
        </p>
      </div>
    </div>
  )
}
