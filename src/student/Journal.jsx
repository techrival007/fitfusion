import { useState, useEffect } from 'react'
import { Lock, Check, Shield, Trash2, Eye, X, Pencil, Plus } from 'lucide-react'
import { saveJournalEntry, updateJournalEntry, listJournalEntries, getJournalEntry, deleteJournalEntry } from '../api/student'

const PROMPTS = [
  'What made you smile today?',
  'What was the most challenging part of your day?',
  'What are three things you are grateful for right now?',
  'How did your energy levels feel throughout the day?',
  'What would you do differently tomorrow?',
]

export default function Journal() {
  const [entry, setEntry]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [entries, setEntries]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [viewing, setViewing]         = useState(null)   // { id, date, word_count }
  const [viewText, setViewText]       = useState('')
  const [viewLoading, setViewLoading] = useState(false)
  const [editing, setEditing]         = useState(null)   // entry id being edited
  const [editText, setEditText]       = useState('')
  const [error, setError]             = useState('')

  useEffect(() => { fetchList() }, [])

  const fetchList = () => {
    setLoading(true)
    listJournalEntries()
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }

  const handleSave = async () => {
    if (!entry.trim()) return
    setSaving(true)
    setError('')
    try {
      await saveJournalEntry(entry.trim())
      setSaved(true)
      setEntry('')
      fetchList()
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleView = async (e) => {
    if (viewing?.id === e.id) { setViewing(null); return }
    setViewing(e)
    setViewText('')
    setViewLoading(true)
    setEditing(null)
    try {
      const data = await getJournalEntry(e.id)
      setViewText(data.text)
    } catch {
      setViewText('Could not decrypt entry.')
    } finally {
      setViewLoading(false)
    }
  }

  const handleEditStart = async (e) => {
    setEditing(e.id)
    setEditText('')
    setViewing(null)
    setViewLoading(true)
    try {
      const data = await getJournalEntry(e.id)
      setEditText(data.text)
    } catch {
      setError('Could not load entry for editing.')
      setEditing(null)
    } finally {
      setViewLoading(false)
    }
  }

  const handleEditSave = async (id) => {
    if (!editText.trim()) return
    setSaving(true)
    try {
      await updateJournalEntry(id, editText.trim())
      setEditing(null)
      setEditText('')
      fetchList()
    } catch {
      setError('Failed to update entry.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteJournalEntry(id)
      if (viewing?.id === id) setViewing(null)
      if (editing === id) setEditing(null)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch {
      setError('Failed to delete entry.')
    }
  }

  const grouped = entries.reduce((acc, e) => {
    acc[e.date] = acc[e.date] || []
    acc[e.date].push(e)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-5">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Private · AES-256-GCM Encrypted</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Personal Journal</h1>
      </div>

      <div className="border border-[#bbf7d0] bg-[#f0fdf4] p-4 flex gap-3">
        <Shield size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#22c55e] mb-1">AES-256-GCM Encrypted at Rest</p>
          <p className="text-[11px] text-[#166534] leading-relaxed">
            Every entry is encrypted with AES-256-GCM before touching the database. The server never stores plaintext. No admin, warden, or staff can read your entries.
          </p>
        </div>
      </div>

      {error && (
        <div className="border border-[#fecaca] bg-[#fef2f2] p-3 flex items-center justify-between">
          <p className="text-[11px] text-[#ef4444]">{error}</p>
          <button onClick={() => setError('')}><X size={13} className="text-[#ef4444]" /></button>
        </div>
      )}

      {/* New entry composer */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plus size={13} className="text-[#111827]" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">New Entry</p>
          </div>
          <div className="flex items-center gap-1.5 text-[#9CA3AF]">
            <Lock size={10} />
            <span className="text-[9px]">AES-256-GCM</span>
          </div>
        </div>

        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">Prompt</p>
        <p className="text-[12px] text-[#6B7280] italic mb-3">{PROMPTS[new Date().getDay() % PROMPTS.length]}</p>

        <textarea
          value={entry}
          onChange={e => setEntry(e.target.value)}
          className="w-full border border-[#E5E7EB] px-4 py-3 text-[12px] font-mono focus:outline-none focus:border-[#111827] bg-[#FAFAFA] resize-none leading-relaxed"
          rows={7}
          placeholder="Write freely — you can write multiple entries throughout the day..."
        />

        <div className="flex items-center justify-between mt-3">
          <p className="text-[9px] text-[#9CA3AF]">{entry.trim() ? entry.trim().split(/\s+/).length : 0} words</p>
          <button
            onClick={handleSave}
            disabled={!entry.trim() || saving}
            className={`flex items-center gap-2 px-6 py-2 text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-40 ${saved ? 'bg-[#22c55e] text-white' : 'bg-[#111827] text-white hover:bg-[#1f2937]'}`}
          >
            {saved ? <><Check size={12} /> Saved & Encrypted</> : saving ? 'Encrypting...' : <><Lock size={12} /> Save Entry</>}
          </button>
        </div>
      </div>

      {/* Inline read panel */}
      {viewing && (
        <div className="bg-white border border-[#111827] p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{viewing.date} · {viewing.word_count} words</p>
              <p className="text-[10px] text-[#22c55e] font-bold">Decrypted in memory only</p>
            </div>
            <button onClick={() => setViewing(null)} className="text-[#9CA3AF] hover:text-[#111827]"><X size={14} /></button>
          </div>
          {viewLoading
            ? <p className="text-[11px] text-[#9CA3AF] font-mono">Decrypting...</p>
            : <p className="text-[12px] font-mono text-[#111827] leading-relaxed whitespace-pre-wrap">{viewText}</p>
          }
        </div>
      )}

      {/* Inline edit panel */}
      {editing && (
        <div className="bg-white border border-[#f59e0b] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#f59e0b]">Editing Entry</p>
            <button onClick={() => { setEditing(null); setEditText('') }} className="text-[#9CA3AF] hover:text-[#111827]"><X size={14} /></button>
          </div>
          {viewLoading
            ? <p className="text-[11px] text-[#9CA3AF] font-mono">Loading...</p>
            : <>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="w-full border border-[#E5E7EB] px-4 py-3 text-[12px] font-mono focus:outline-none focus:border-[#f59e0b] bg-[#FAFAFA] resize-none leading-relaxed"
                  rows={6}
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[9px] text-[#9CA3AF]">{editText.trim() ? editText.trim().split(/\s+/).length : 0} words</p>
                  <button
                    onClick={() => handleEditSave(editing)}
                    disabled={!editText.trim() || saving}
                    className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold uppercase tracking-widest bg-[#f59e0b] text-white hover:bg-[#d97706] disabled:opacity-40 transition-all"
                  >
                    <Lock size={12} /> Re-encrypt & Save
                  </button>
                </div>
              </>
          }
        </div>
      )}

      {/* Past entries grouped by date */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">All Entries</p>
        {loading ? (
          <p className="text-[11px] text-[#9CA3AF] text-center py-4">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-[11px] text-[#9CA3AF] text-center py-4">No entries yet. Write your first one above.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([day, dayEntries]) => (
              <div key={day}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2 border-b border-[#E5E7EB] pb-1">
                  {day} · {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
                </p>
                <div className="space-y-0">
                  {dayEntries.map((e, idx) => (
                    <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] last:border-0">
                      <div className="flex items-center gap-3">
                        <Lock size={10} className="text-[#9CA3AF] shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-[#111827]">Entry {idx + 1}</p>
                          <p className="text-[9px] text-[#9CA3AF]">{e.word_count} words · AES-256-GCM</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(e)}
                          className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest border px-2 py-1 transition-all ${viewing?.id === e.id ? 'bg-[#111827] text-white border-[#111827]' : 'text-[#6B7280] border-[#E5E7EB] hover:border-[#111827] hover:text-[#111827]'}`}
                        >
                          <Eye size={10} /> {viewing?.id === e.id ? 'Close' : 'Read'}
                        </button>
                        <button
                          onClick={() => editing === e.id ? (setEditing(null), setEditText('')) : handleEditStart(e)}
                          className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest border px-2 py-1 transition-all ${editing === e.id ? 'bg-[#f59e0b] text-white border-[#f59e0b]' : 'text-[#6B7280] border-[#E5E7EB] hover:border-[#f59e0b] hover:text-[#f59e0b]'}`}
                        >
                          <Pencil size={10} /> Edit
                        </button>
                        <button onClick={() => handleDelete(e.id)} className="text-[#9CA3AF] hover:text-[#ef4444] transition-all p-1">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
