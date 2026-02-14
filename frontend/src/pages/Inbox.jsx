import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWorkspace } from '../context/WorkspaceContext'
import api from '../api'
import { Send, MessageCircle, Clock, Zap, Search } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const DUMMY_MESSAGES_WEEK = [24, 18, 31, 22, 28, 15, 19]

function getMessagesChartData() {
  const data = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    data.push({
      date: d.toISOString().split('T')[0],
      label: format(d, 'EEE'),
      count: DUMMY_MESSAGES_WEEK[6 - i] ?? 20
    })
  }
  return data
}

export default function Inbox() {
  const { workspace } = useWorkspace()
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const chartData = getMessagesChartData()
  const maxChart = Math.max(...chartData.map(d => d.count))

  const totalConvos = conversations.length
  const unanswered = conversations.filter(c => c.unanswered).length
  const filteredConvos = search.trim()
    ? conversations.filter(c =>
        (c.contact_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.last_message || '').toLowerCase().includes(search.toLowerCase())
      )
    : conversations

  useEffect(() => {
    if (!workspace?.id) return
    api.get(`/workspaces/${workspace.id}/conversations`).then(r => setConversations(r.data || []))
  }, [workspace?.id])

  useEffect(() => {
    if (!workspace?.id || !selected) return
    api.get(`/workspaces/${workspace.id}/conversations/${selected.id}/messages`).then(r => setMessages(r.data))
  }, [workspace?.id, selected?.id])

  async function sendReply() {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      await api.post(`/workspaces/${workspace.id}/conversations/${selected.id}/reply`, {
        content: reply,
        channel: messages?.contact?.email ? 'email' : 'sms'
      })
      setReply('')
      api.get(`/workspaces/${workspace.id}/conversations/${selected.id}/messages`).then(r => setMessages(r.data))
      api.get(`/workspaces/${workspace.id}/conversations`).then(r => setConversations(r.data || []))
    } finally {
      setSending(false)
    }
  }

  function getInitials(name) {
    return (name || '?').split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  if (!workspace) return <div className="loading">Select a workspace</div>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="inbox-page">
      <div className="inbox-header">
        <h1>Inbox</h1>
        <p className="inbox-subtitle">Manage conversations and stay on top of messages</p>
      </div>

      {/* Stats + chart row */}
      <div className="inbox-stats-row">
        <div className="inbox-stat-card">
          <div className="inbox-stat-icon"><MessageCircle size={20} /></div>
          <div>
            <span className="inbox-stat-value">{totalConvos}</span>
            <span className="inbox-stat-label">Total conversations</span>
          </div>
        </div>
        <div className="inbox-stat-card">
          <div className="inbox-stat-icon warning"><Clock size={20} /></div>
          <div>
            <span className="inbox-stat-value">{unanswered}</span>
            <span className="inbox-stat-label">Unanswered</span>
          </div>
        </div>
        <div className="inbox-stat-card">
          <div className="inbox-stat-icon success"><Zap size={20} /></div>
          <div>
            <span className="inbox-stat-value">~2.4h</span>
            <span className="inbox-stat-label">Avg response time</span>
          </div>
        </div>
      </div>

      <div className="inbox-chart-card card">
        <h3>Messages this week</h3>
        <div className="inbox-chart-bars">
          {chartData.map(d => (
            <div key={d.date} className="inbox-chart-bar">
              <div className="inbox-chart-track">
                <div
                  className="inbox-chart-fill"
                  style={{
                    height: `${(d.count / Math.max(1, maxChart)) * 100}%`,
                    background: 'linear-gradient(180deg, var(--accent), var(--accent-violet))'
                  }}
                />
              </div>
              <span className="inbox-chart-label">{d.label}</span>
              <span className="inbox-chart-value">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main layout: conversations + thread */}
      <div className="inbox-main">
        <div className="inbox-sidebar card">
          <div className="inbox-sidebar-header">
            <div className="inbox-search-wrap">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="inbox-search"
              />
            </div>
          </div>
          <div className="inbox-convo-list">
            {filteredConvos.map(c => (
              <div
                key={c.id}
                className={`inbox-convo-item ${selected?.id === c.id ? 'active' : ''}`}
                onClick={() => setSelected(c)}
              >
                <div className="inbox-convo-avatar">{getInitials(c.contact_name)}</div>
                <div className="inbox-convo-content">
                  <div className="inbox-convo-row">
                    <span className="inbox-convo-name">{c.contact_name || 'Unknown'}</span>
                    {c.unanswered && <span className="badge badge-warning">New</span>}
                  </div>
                  <div className="inbox-convo-preview">
                    {c.last_message || 'No messages yet'}
                  </div>
                </div>
              </div>
            ))}
            {!filteredConvos.length && (
              <div className="inbox-empty">No conversations{search ? ' match your search' : ''}</div>
            )}
          </div>
        </div>

        <div className="inbox-thread card">
          {selected ? (
            <>
              <div className="inbox-thread-header">
                <div className="inbox-thread-contact">
                  <div className="inbox-convo-avatar large">{getInitials(messages?.contact?.name || selected.contact_name)}</div>
                  <div>
                    <strong>{messages?.contact?.name || selected.contact_name}</strong>
                    <span className="inbox-thread-meta">
                      {messages?.contact?.email} {messages?.contact?.phone}
                    </span>
                  </div>
                </div>
              </div>
              <div className="inbox-thread-messages">
                {messages?.messages?.map(m => (
                  <div
                    key={m.id}
                    className={`inbox-msg ${m.direction === 'outbound' ? 'outbound' : 'inbound'}`}
                  >
                    <div className="inbox-msg-bubble">
                      {m.content}
                      {m.is_automated && <span className="inbox-msg-auto">auto</span>}
                    </div>
                    <span className="inbox-msg-time">
                      {formatDistanceToNow(new Date(m.sent_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="inbox-thread-reply">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                />
                <button className="btn btn-primary" onClick={sendReply} disabled={sending}>
                  <Send size={16} /> Send
                </button>
              </div>
            </>
          ) : (
            <div className="inbox-thread-empty">
              <MessageCircle size={48} />
              <p>Select a conversation</p>
              <span>Choose from the list to view and reply to messages</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
