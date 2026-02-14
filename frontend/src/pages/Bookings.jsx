import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWorkspace } from '../context/WorkspaceContext'
import api from '../api'
import { format } from 'date-fns'

export default function Bookings() {
  const { workspace } = useWorkspace()
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    if (!workspace?.id) return
    api.get(`/workspaces/${workspace.id}/bookings`).then(r => setBookings(r.data))
  }, [workspace?.id])

  async function updateStatus(id, status) {
    try {
      await api.post(`/workspaces/${workspace.id}/bookings/${id}/status`, { status })
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed')
    }
  }

  if (!workspace) return <div>Select a workspace</div>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Bookings</h1>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Contact</th>
                <th>Type</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td>{b.contact_name}<br /><small style={{ color: 'var(--text-muted)' }}>{b.contact_email}</small></td>
                  <td>{b.booking_type}</td>
                  <td>{b.scheduled_at ? format(new Date(b.scheduled_at), 'PPp') : '-'}</td>
                  <td>
                    <span className={`badge badge-${b.status === 'completed' ? 'success' : b.status === 'no_show' ? 'error' : 'warning'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    {b.status === 'confirmed' && (
                      <>
                        <button className="btn btn-secondary" style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          onClick={() => updateStatus(b.id, 'completed')}>Complete</button>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          onClick={() => updateStatus(b.id, 'no_show')}>No-show</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!bookings.length && <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No bookings yet</p>}
      </div>
    </motion.div>
  )
}
