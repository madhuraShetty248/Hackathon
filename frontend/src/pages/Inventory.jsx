import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWorkspace } from '../context/WorkspaceContext'
import api from '../api'

export default function Inventory() {
  const { workspace } = useWorkspace()
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(10)
  const [threshold, setThreshold] = useState(2)

  useEffect(() => {
    if (!workspace?.id) return
    load()
  }, [workspace?.id])

  function load() {
    api.get(`/workspaces/${workspace.id}/inventory`).then(r => setItems(r.data))
  }

  async function add() {
    if (!name) return
    try {
      await api.post(`/workspaces/${workspace.id}/inventory`, { name, quantity, low_stock_threshold: threshold })
      setName('')
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed')
    }
  }

  async function updateQty(id, qty) {
    try {
      await api.patch(`/workspaces/${workspace.id}/inventory/${id}`, { quantity: qty })
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed')
    }
  }

  if (!workspace) return <div>Select a workspace</div>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Inventory</h1>
      <div className="card">
        <h3>Add Item</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" />
          </div>
          <div>
            <label>Quantity</label>
            <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
          </div>
          <div>
            <label>Low threshold</label>
            <input type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
          </div>
          <button className="btn btn-primary" onClick={add}>Add</button>
        </div>
      </div>
      <div className="card">
        <h3>Items</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Name</th><th>Quantity</th><th>Threshold</th><th>Status</th><th>Update</th></tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>{i.quantity} {i.unit}</td>
                  <td>{i.low_stock_threshold}</td>
                  <td>{i.is_low ? <span className="badge badge-error">Low stock</span> : <span className="badge badge-success">OK</span>}</td>
                  <td>
                    <input type="number" style={{ width: 80, margin: 0 }} defaultValue={i.quantity}
                      onBlur={e => updateQty(i.id, Number(e.target.value))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!items.length && <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No items yet</p>}
      </div>
    </motion.div>
  )
}
