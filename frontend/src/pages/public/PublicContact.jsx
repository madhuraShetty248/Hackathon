import { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function PublicContact() {
  const { workspaceId } = useParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email && !phone) {
      setError('Please provide email or phone')
      return
    }
    try {
      const res = await fetch(`${API}/public/contact/${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email || undefined, phone: phone || undefined, message: message || undefined })
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
          <h1>Thank you!</h1>
          <p>We've received your message and will get back to you shortly.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="public-page" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)' }}>
      <motion.div className="public-card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1>Contact Us</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <label>Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <label>Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          <label>Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send</button>
        </form>
      </motion.div>
    </div>
  )
}
