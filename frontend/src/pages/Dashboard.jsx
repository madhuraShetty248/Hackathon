import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../context/WorkspaceContext'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { motion } from 'framer-motion'
import { Calendar, MessageCircle, FileText, Package, AlertTriangle, Inbox, PlusCircle, ClipboardList, BarChart3, Lightbulb } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const DUMMY_ACTIVITY = [
  { type: 'booking', name: 'Raju', time: -15 },
  { type: 'form', form: 'Intake Form', time: -45 },
  { type: 'message', time: -90 },
]

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

function getNext7Dates() {
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

const DUMMY_BOOKINGS = [12, 8, 15, 11, 19, 14, 9]
const DUMMY_FORMS = [5, 7, 4, 9, 6, 8, 11]

function getDummyAnalytics(bookingsLast7, formsLast7) {
  const dates = getNext7Dates()
  const hasRealBookings = bookingsLast7?.length && Math.max(...bookingsLast7.map(d => d.total || 0)) > 0
  const hasRealForms = formsLast7?.length && Math.max(...formsLast7.map(d => d.completed || 0)) > 0
  const bookings = hasRealBookings
    ? bookingsLast7
    : dates.map((date, i) => ({ date, total: DUMMY_BOOKINGS[i] ?? 10 }))
  const forms = hasRealForms
    ? formsLast7
    : dates.map((date, i) => ({ date, completed: DUMMY_FORMS[i] ?? 6 }))
  return { bookings, forms }
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { workspace } = useWorkspace()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!workspace?.id) return
    api.get(`/workspaces/${workspace.id}/dashboard`).then(r => setData(r.data)).catch(console.error)
  }, [workspace?.id])

  if (!workspace) return <div className="loading">Select a workspace</div>
  if (!data) return <div className="loading"><div className="loader" /></div>

  const { bookings, conversations, forms, inventory_alerts, alerts, analytics } = data
  const { bookings: bookingsLast7, forms: formsLast7 } = getDummyAnalytics(
    analytics?.bookings_last_7,
    analytics?.forms_last_7
  )
  const maxBookings = Math.max(1, ...bookingsLast7.map(d => d.total))
  const maxForms = Math.max(1, ...formsLast7.map(d => d.completed))

  const activityItems = DUMMY_ACTIVITY.map((a, i) => ({
    ...a,
    ts: new Date(Date.now() + a.time * 60000),
    key: i,
  }))

  return (
    <motion.div initial="hidden" animate="show" variants={container}>
      <motion.h1 variants={item} style={{ marginBottom: '0.25rem' }}>{t('dashboard.title')}</motion.h1>
      <motion.p variants={item} className="dashboard-welcome">
        {t('dashboard.welcome')} — {t('dashboard.subtitle')}
      </motion.p>

      <motion.div variants={item} className="dashboard-quick-actions">
        <Link to="/app/inbox" className="quick-action-btn">
          <Inbox size={20} />
          <span>{t('dashboard.viewInbox')}</span>
        </Link>
        <Link to="/app/bookings" className="quick-action-btn">
          <PlusCircle size={20} />
          <span>{t('dashboard.addBooking')}</span>
        </Link>
        <Link to="/app/forms" className="quick-action-btn">
          <ClipboardList size={20} />
          <span>{t('dashboard.createForm')}</span>
        </Link>
        <Link to="/app/inventory" className="quick-action-btn">
          <BarChart3 size={20} />
          <span>{t('dashboard.checkInventory')}</span>
        </Link>
      </motion.div>

      {alerts?.length > 0 && (
        <motion.div variants={item} className="card" style={{ borderLeft: '4px solid var(--warning)', marginBottom: '1.5rem' }}>
          <h3><AlertTriangle size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> {t('dashboard.alerts')}</h3>
          {alerts.map((a, i) => (
            <Link key={i} to={`/app${a.link}`} style={{ display: 'block', marginBottom: '0.5rem' }}>
              {a.type === 'unanswered_messages' && `${a.count} ${t('dashboard.unansweredMessages')}`}
              {a.type === 'unconfirmed_bookings' && `${a.count} ${t('dashboard.unconfirmedBookings')}`}
              {a.type === 'overdue_forms' && `${a.count} ${t('dashboard.overdueForms')}`}
              {a.type === 'low_inventory' && `${a.count} ${t('dashboard.lowStock')}`}
            </Link>
          ))}
        </motion.div>
      )}

      <motion.div variants={item} className="dashboard-cards-row">
        <div className="stat-card">
          <h3><Calendar size={18} /> {t('dashboard.bookings')}</h3>
          <div className="stat-value">{bookings?.today || 0}</div>
          <div className="stat-label">
            {t('dashboard.completed')}: {bookings?.today_completed || 0} · {t('dashboard.noShow')}: {bookings?.today_no_show || 0} · {t('dashboard.upcoming')}: {bookings?.today_upcoming || 0}
          </div>
        </div>
        <div className="stat-card">
          <h3><MessageCircle size={18} /> {t('dashboard.conversations')}</h3>
          <div className="stat-value">{conversations?.unanswered || 0}</div>
          <div className="stat-label">{t('dashboard.unanswered')}</div>
        </div>
        <div className="stat-card">
          <h3><FileText size={18} /> {t('dashboard.forms')}</h3>
          <div className="stat-value">{forms?.pending || 0}</div>
          <div className="stat-label">{t('dashboard.pending')} · {forms?.overdue || 0} {t('dashboard.overdue')}</div>
        </div>
        <div className="stat-card">
          <h3><Package size={18} /> {t('dashboard.inventory')}</h3>
          <div className="stat-value">{inventory_alerts?.length || 0}</div>
          <div className="stat-label">{t('dashboard.lowStockItems')}</div>
        </div>
      </motion.div>

      <motion.div variants={item} className="dashboard-extra-row">
        <div className="card dashboard-activity-card">
          <h3>{t('dashboard.activity')}</h3>
          <div className="activity-list">
            {activityItems.map(a => (
              <div key={a.key} className="activity-item">
                <span className="activity-icon">
                  {a.type === 'booking' && <Calendar size={16} />}
                  {a.type === 'form' && <FileText size={16} />}
                  {a.type === 'message' && <MessageCircle size={16} />}
                </span>
                <span className="activity-text">
                  {a.type === 'booking' && t('dashboard.activityNewBooking', { name: a.name })}
                  {a.type === 'form' && t('dashboard.activityFormSubmitted', { form: a.form })}
                  {a.type === 'message' && t('dashboard.activityMsgReceived')}
                </span>
                <span className="activity-time">{formatDistanceToNow(a.ts, { addSuffix: true })}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card dashboard-tip-card">
          <h3><Lightbulb size={18} /> {t('dashboard.tip')}</h3>
          <p>{t('dashboard.tipText')}</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="card">
        <h3>{t('dashboard.upcomingBookings')}</h3>
        {bookings?.upcoming_list?.length ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>{t('dashboard.contact')}</th><th>{t('dashboard.dateTime')}</th><th>{t('dashboard.status')}</th></tr>
              </thead>
              <tbody>
                {bookings.upcoming_list.map(b => (
                  <tr key={b.id}>
                    <td>{b.contact}</td>
                    <td>{b.scheduled_at ? format(new Date(b.scheduled_at), 'PPp') : '-'}</td>
                    <td><span className="badge badge-success">{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>{t('dashboard.noUpcoming')}</p>
        )}
      </motion.div>

      <motion.div variants={item} className="analytics-grid">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>{t('dashboard.bookingsNext7')}</h3>
          <div className="analytics-bars">
            {bookingsLast7.map(d => (
              <div key={d.date} className="analytics-bar">
                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar-fill"
                    style={{
                      height: `${(d.total / maxBookings) * 100 || 0}%`,
                      background: 'linear-gradient(135deg, #006bff, #8b5cf6)',
                    }}
                  >
                    {d.total > 0 && <span className="analytics-bar-value">{d.total}</span>}
                  </div>
                </div>
                <div className="analytics-bar-label">
                  {new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>{t('dashboard.formsNext7')}</h3>
          <div className="analytics-bars">
            {formsLast7.map(d => (
              <div key={d.date} className="analytics-bar">
                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar-fill"
                    style={{
                      height: `${(d.completed / maxForms) * 100 || 0}%`,
                      background: 'linear-gradient(135deg, #10b981, #22c55e)',
                    }}
                  >
                    {d.completed > 0 && <span className="analytics-bar-value">{d.completed}</span>}
                  </div>
                </div>
                <div className="analytics-bar-label">
                  {new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {!workspace.is_active && (
        <motion.div variants={item} className="alert alert-warning">
          {t('dashboard.completeSetup')} <Link to="/app/onboarding">Setup</Link> {t('dashboard.goLive')}.
        </motion.div>
      )}
    </motion.div>
  )
}
