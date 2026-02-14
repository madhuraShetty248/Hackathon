import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWorkspace } from '../context/WorkspaceContext'
import api from '../api'

export default function Staff() {
  const { workspace } = useWorkspace()
  const [staff, setStaff] = useState([])
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    if (!workspace?.id) return
    api.get(`/workspaces/${workspace.id}/staff`).then(r => setStaff(r.data)).catch(console.error)
  }, [workspace?.id])

  async function invite() {
    if (!email || !fullName) return
    try {
      await api.post(`/workspaces/${workspace.id}/staff/invite`, {
        email, full_name: fullName,
        permissions: ['inbox', 'bookings', 'forms', 'inventory']
      })
      setEmail('')
      setFullName('')
      api.get(`/workspaces/${workspace.id}/staff`).then(r => setStaff(r.data))
    } catch (e) {
      alert(e.response?.data?.detail || 'Invite failed')
    }
  }

  if (!workspace) return <div>Select a workspace</div>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Staff</h1>
      <div className="card">
        <h3>Invite Staff</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label>Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={invite}>Invite</button>
        </div>
      </div>
      <div className="card">
        <h3>Team Members</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th></tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td>{s.full_name}</td>
                  <td>{s.email}</td>
                  <td><span className="badge">{s.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
