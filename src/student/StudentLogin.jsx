import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudentAuth } from '../context/StudentAuthContext'
import { Activity, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function StudentLogin() {
  const [rollNumber, setRollNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const { login } = useStudentAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = login(rollNumber, password)
    if (result.success) navigate('/student')
    else setError('Invalid credentials. Use: 2021EE10492 / student123')
  }

  const fillDemo = () => { setRollNumber('2021EE10492'); setPassword('student123'); setError('') }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#111827] rounded-lg flex items-center justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Student Portal</p>
            <p className="text-[18px] font-bold text-[#111827]">UniVitals</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <svg width="100%" height="100%">
              <defs><pattern id="sg" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#111827" strokeWidth="0.5" /></pattern></defs>
              <rect width="100%" height="100%" fill="url(#sg)" />
            </svg>
          </div>
          <div className="absolute top-4 right-4 opacity-[0.05] pointer-events-none">
            <svg width="80" height="80" viewBox="0 0 200 200">
              {[20,40,60,80].map(r => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#111827" strokeWidth="0.8" />)}
              <line x1="100" y1="0" x2="100" y2="200" stroke="#111827" strokeWidth="0.5" />
              <line x1="0" y1="100" x2="200" y2="100" stroke="#111827" strokeWidth="0.5" />
            </svg>
          </div>
          <div className="relative z-10">
            <h1 className="text-[13px] font-bold uppercase tracking-widest mb-1">Student Login</h1>
            <p className="text-[10px] text-[#9CA3AF] mb-6">Your personal wellness intelligence portal</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Roll Number</label>
                <input type="text" value={rollNumber} onChange={e => setRollNumber(e.target.value)} className="w-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5 text-[12px] focus:outline-none focus:border-[#111827] font-mono" placeholder="e.g. 2021EE10492" />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5 text-[12px] focus:outline-none focus:border-[#111827] font-mono pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              {error && <p className="text-[10px] text-[#ef4444] font-bold">{error}</p>}
              <button type="submit" className="w-full bg-[#111827] text-white py-3 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#1f2937] transition-all">
                Sign In <ArrowRight size={13} />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-3 border border-[#E5E7EB] bg-white p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Demo Account</p>
          <button onClick={fillDemo} className="w-full flex items-center justify-between px-3 py-2 border border-[#E5E7EB] hover:border-[#111827] transition-all text-left group">
            <div>
              <p className="text-[11px] font-bold text-[#111827]">Radhika Goel — GH-1, EE Y3</p>
              <p className="text-[9px] text-[#9CA3AF]">Roll: 2021EE10492 · Pass: student123</p>
            </div>
            <ArrowRight size={11} className="text-[#E5E7EB] group-hover:text-[#111827]" />
          </button>
        </div>
        <p className="text-center text-[9px] text-[#9CA3AF] mt-4">UniVitals v1.0 · Your data stays private</p>
      </div>
    </div>
  )
}
