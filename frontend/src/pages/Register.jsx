import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

export default function Register() {
  const [searchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('ai') === '1') sessionStorage.setItem('openAIAssistant', '1')
  }, [searchParams])
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await register(email, password, fullName)
      navigate(searchParams.get('ai') === '1' ? '/app/onboarding' : '/app')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ') : err.message || 'Registration failed. Is the backend running?')
    }
  }

  return (
    <div className="auth-page">
      {/* Background handled by auth-page gradient; no 3D objects */}
      <motion.div className="auth-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Link to="/" style={{ display: 'block', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>← Back to home</Link>
        <h1>CareOps</h1>
        <p className="auth-subtitle">Get started — it's free</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <input type="text" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name" />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>Create account</button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Log in</Link></p>
      </motion.div>
    </div>
  )
}
