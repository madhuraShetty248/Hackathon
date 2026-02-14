import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function PublicForm() {
  const { submissionId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)
  const [values, setValues] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API}/public/form/${submissionId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Failed to load form')
        setForm(data)
      } catch (e) {
        setError(e.message || 'Failed to load form')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [submissionId])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API}/public/form/${submissionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: values }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to submit form')
      setSubmitted(true)
    } catch (e) {
      setError(e.message || 'Failed to submit form')
    }
  }

  if (loading) {
    return (
      <div className="public-page">
        <div className="public-card">
          <p>Loading form…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="public-page">
        <div className="public-card">
          <h1>Form unavailable</h1>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="public-page">
        <div className="public-card">
          <h1>Thank you!</h1>
          <p>Your information has been submitted.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="public-page">
      <div className="public-card">
        <h1>{form?.form_name || 'Form'}</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {(form?.fields || []).map(field => (
            <div key={field.name} style={{ marginBottom: '0.75rem' }}>
              <label>
                {field.label || field.name}
                {field.required && ' *'}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  rows={4}
                  value={values[field.name] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={values[field.name] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                  required={field.required}
                />
              )}
            </div>
          ))}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}

