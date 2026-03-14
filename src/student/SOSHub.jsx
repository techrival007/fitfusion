import { Phone, Heart, AlertCircle, MessageCircle, ExternalLink } from 'lucide-react'

const EMERGENCY_CONTACTS = [
  { category: 'Campus Emergency', name: 'Campus Security', number: '0132-284-0000', type: 'emergency', desc: '24/7 campus security and emergency response' },
  { category: 'Mental Health', name: 'University Psychologist', number: '0132-284-1100', type: 'mental', desc: 'Mon–Fri 9am–5pm · Walk-ins welcome at Student Services' },
  { category: 'Mental Health', name: 'Student Wellness Cell', number: '0132-284-1234', type: 'mental', desc: 'Peer-support and counseling referrals' },
  { category: 'Medical', name: 'Campus Medical Center', number: '0132-284-2200', type: 'medical', desc: '24/7 first aid · Emergency medical response' },
  { category: 'Crisis Hotline', name: 'iCall — TISS (National)', number: '9152987821', type: 'crisis', desc: 'Mon–Sat 8am–10pm · Free counseling helpline' },
  { category: 'Crisis Hotline', name: 'Vandrevala Foundation', number: '1860-2662-345', type: 'crisis', desc: '24/7 free mental health support' },
  { category: 'Crisis Hotline', name: 'NIMHANS Helpline', number: '080-46110007', type: 'crisis', desc: 'Mental health information and support' },
]

const TYPE_CONFIG = {
  emergency: { color: '#ef4444', label: 'EMERGENCY' },
  mental: { color: '#3b82f6', label: 'MENTAL HEALTH' },
  medical: { color: '#f59e0b', label: 'MEDICAL' },
  crisis: { color: '#8b5cf6', label: 'CRISIS LINE' },
}

const SELF_HELP = [
  { title: '4-7-8 Breathing', desc: 'Inhale 4s → Hold 7s → Exhale 8s. Repeat 3–4 times.', emoji: '🌬️' },
  { title: '5-4-3-2-1 Grounding', desc: 'Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.', emoji: '🧘' },
  { title: 'Cold Water Reset', desc: 'Splash cold water on your face or hold ice cubes to regulate your nervous system.', emoji: '💧' },
  { title: 'Body Scan', desc: 'Close your eyes and slowly scan from head to toe, releasing tension in each area.', emoji: '🔍' },
]

export default function SOSHub() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Support & Safety</p>
        <h1 className="text-[20px] font-bold text-[#111827]">SOS Hub</h1>
        <p className="text-[11px] text-[#6B7280]">Emergency contacts, mental health resources, and crisis support</p>
      </div>

      {/* Emergency CTA */}
      <div className="bg-[#111827] p-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 200 200">
            {[30,60,90,120].map(r => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="white" strokeWidth="0.5" />)}
          </svg>
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">One-Tap Emergency</p>
            <p className="text-[16px] font-bold text-white mb-0.5">Campus Security</p>
            <p className="text-[11px] text-[#9CA3AF]">0132-284-0000 · Available 24/7</p>
          </div>
          <a
            href="tel:01322840000"
            className="flex items-center gap-2 px-5 py-3 bg-[#ef4444] text-white text-[12px] font-bold uppercase tracking-widest hover:bg-[#dc2626] transition-all"
          >
            <Phone size={14} />
            Call Now
          </a>
        </div>
      </div>

      {/* All contacts */}
      <div className="bg-[var(--surface-bg)] border border-[var(--border-main)] p-5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-4">All Contacts</p>
        <div className="space-y-3">
          {EMERGENCY_CONTACTS.map((c, i) => {
            const cfg = TYPE_CONFIG[c.type]
            return (
              <div key={i} className="sos-contact-card flex items-center gap-4 p-4 border transition-all hover:border-[#111827]" data-contact-type={c.type}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <p className="text-[12px] font-bold text-[#111827]">{c.name}</p>
                  <p className="text-[10px] text-[#6B7280]">{c.desc}</p>
                </div>
                <a
                  href={`tel:${c.number.replace(/[^0-9]/g, '')}`}
                  className="ml-auto flex items-center gap-2 px-4 py-2 border text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-[#111827] hover:text-white hover:border-[#111827] shrink-0"
                  style={{ borderColor: cfg.color, color: cfg.color }}
                >
                  <Phone size={11} />
                  {c.number}
                </a>
              </div>
            )
          })}
        </div>
      </div>

      {/* Immediate self-help */}
      <div className="bg-[var(--surface-bg)] border border-[var(--border-main)] p-5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-4">Immediate Self-Help Techniques</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SELF_HELP.map(s => (
            <div key={s.title} className="border border-[var(--border-main)] bg-[var(--surface-bg)] p-4 hover:border-[#111827] transition-all">
              <span className="text-[24px] block mb-2">{s.emoji}</span>
              <p className="text-[12px] font-bold text-[#111827] mb-1">{s.title}</p>
              <p className="text-[10px] text-[#6B7280] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[9px] text-[#9CA3AF]">You are never alone. Reaching out is a sign of strength.</p>
    </div>
  )
}
