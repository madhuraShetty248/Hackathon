import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const DAYS = ['sun','mon','tue','wed','thu','fri','sat']

export default function PublicBooking() {
  const { workspaceId } = useParams()
  const [types, setTypes] = useState([])
  const [selectedType, setSelectedType] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/public/booking/${workspaceId}/types`)
      .then(r => r.json())
      .then(data => {
        // De-duplicate by name + duration so the same
        // service doesn't appear multiple times in the dropdown.
        const byKey = {}
        for (const t of data) {
          const key = `${t.name}|${t.duration_minutes}`
          if (!byKey[key]) byKey[key] = t
        }
        setTypes(Object.values(byKey))
      })
      .catch(console.error)
  }, [workspaceId])

  useEffect(() => {
    if (!selectedType) return
    const t = types.find(x => x.id === selectedType)
    if (!t?.availability) return
    const now = new Date()
    const result = []
    for (let d = 0; d < 14; d++) {
      const date = new Date(now)
      date.setDate(date.getDate() + d)
      const day = DAYS[date.getDay()]
      const hours = t.availability[day] || []
      for (const h of hours) {
        const slot = new Date(date)
        slot.setHours(h, 0, 0, 0)
        if (slot > now) result.push(slot.toISOString())
      }
    }
    setSlots(result)
  }, [selectedType, types])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!selectedSlot || !name || (!email && !phone)) {
      setError('Please fill required fields')
      return
    }
    try {
      const res = await fetch(`${API}/public/booking/${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_type_id: selectedType,
          contact_name: name,
          contact_email: email || undefined,
          contact_phone: phone || undefined,
          scheduled_at: selectedSlot
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed')
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    }
  }

  if (submitted) {
    return (
      <div className="public-page">
        <div className="public-card">
          <h1>Booking confirmed!</h1>
          <p>We've sent a confirmation to your email. See you soon!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="public-page">
      <div className="public-card">
        <h1>Book Now</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <label>Service *</label>
          <select value={selectedType || ''} onChange={e => setSelectedType(Number(e.target.value))} required>
            <option value="">Select...</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.duration_minutes} min)</option>)}
          </select>
          <label>Date & Time *</label>
          <select value={selectedSlot || ''} onChange={e => setSelectedSlot(e.target.value)} required>
            <option value="">Select slot...</option>
            {slots.map(s => (
              <option key={s} value={s}>{new Date(s).toLocaleString()}</option>
            ))}
          </select>
          <label>Your Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <label>Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Book</button>
        </form>
      </div>
    </div>
  )
}
