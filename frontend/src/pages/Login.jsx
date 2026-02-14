import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/app')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ') : err.message || 'Login failed. Is the backend running?')
    }
  }

  return (
    <div className="auth-page">
      {/* Background handled by auth-page gradient; no 3D objects */}
      <motion.div className="auth-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Link to="/" style={{ display: 'block', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>← Back to home</Link>
        <h1>CareOps</h1>
        <p className="auth-subtitle">Sign in to your account</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={1} autoComplete="current-password" />
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>Sign in</button>
        </form>
        <p className="auth-footer">Don't have an account? <Link to="/register">Sign up for free</Link></p>
      </motion.div>
    </div>
  )
}
