import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useWorkspace } from '../context/WorkspaceContext'
import api from '../api'

export default function Forms() {
  const { workspace } = useWorkspace()
  const [forms, setForms] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [subpath, setSubpath] = useState('forms')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!workspace?.id) return
    api.get(`/workspaces/${workspace.id}/forms`).then(r => {
      // De-duplicate forms by name + type so running onboarding
      // multiple times doesn't show the same Contact/Intake form
      // more than once in the UI.
      const byKey = {}
      for (const f of r.data) {
        const key = `${f.name}|${f.is_contact_form ? 'contact' : 'post'}`
        if (!byKey[key]) byKey[key] = f
      }
      setForms(Object.values(byKey))
    })
    api.get(`/workspaces/${workspace.id}/form-submissions`).then(r => setSubmissions(r.data))
    api.get(`/workspaces/${workspace.id}/files`).then(r => setFiles(r.data)).catch(() => setFiles([]))
  }, [workspace?.id])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !workspace?.id) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post(`/workspaces/${workspace.id}/files/upload?subpath=${subpath}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setFiles(prev => [{ ...data, created_at: new Date().toISOString() }, ...prev])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      alert(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (!workspace) return <div>Select a workspace</div>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Forms</h1>
      <div className="card">
        <h3>Form Submissions</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Form</th><th>Status</th><th>Data</th><th>Completed</th></tr>
            </thead>
            <tbody>
              {submissions.map(s => {
                const entries = Object.entries(s.data || {})
                const summary = entries.length
                  ? entries.map(([key, value]) => `${key}: ${String(value)}`).join(' · ')
                  : 'No details provided'
                return (
                  <tr key={s.id}>
                    <td>{s.form_name}</td>
                    <td>
                      <span className={`badge badge-${s.status === 'completed' ? 'success' : s.status === 'overdue' ? 'error' : 'warning'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {summary.length > 80 ? `${summary.slice(0, 80)}…` : summary}
                      </span>
                    </td>
                    <td>{s.completed_at ? new Date(s.completed_at).toLocaleDateString() : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!submissions.length && <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No submissions yet</p>}
      </div>
      <div className="card">
        <h3>Forms</h3>
        {forms.map(f => (
          <div key={f.id} style={{ padding: '0.5rem 0' }}>{f.name} {f.is_contact_form && <span className="badge">Contact</span>}</div>
        ))}
      </div>

      <div className="card">
        <h3>File Storage</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Upload forms, agreements, or documents. Files are stored locally by default.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.csv" onChange={handleUpload} style={{ display: 'none' }} />
          <select value={subpath} onChange={e => setSubpath(e.target.value)} style={{ padding: '0.5rem' }}>
            <option value="forms">Forms</option>
            <option value="agreements">Agreements</option>
            <option value="general">General</option>
          </select>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
        {files.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>File</th><th>Category</th><th>Uploaded</th></tr></thead>
              <tbody>
                {files.map(f => (
                  <tr key={f.id}>
                    <td>{f.filename}</td>
                    <td>{f.subpath}</td>
                    <td>{f.created_at ? new Date(f.created_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}
