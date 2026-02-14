import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useWorkspace } from '../context/WorkspaceContext'
import api from '../api'
import AIAssistant from '../components/AIAssistant'
import { Sparkles } from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Create Workspace', desc: 'Business name, address, timezone' },
  { id: 2, title: 'Email & SMS', desc: 'Connect at least one channel' },
  { id: 3, title: 'Contact Form', desc: 'Create public inquiry form' },
  { id: 4, title: 'Bookings', desc: 'Define service types & availability' },
  { id: 5, title: 'Forms', desc: 'Post-booking forms (intake, etc.)' },
  { id: 6, title: 'Inventory', desc: 'Track resources & set alerts' },
  { id: 7, title: 'Staff', desc: 'Invite team members' },
  { id: 8, title: 'Activate', desc: 'Go live!' },
]

export default function Onboarding() {
  const [searchParams] = useSearchParams()
  const { workspace, loadWorkspaces } = useWorkspace()
  const [ws, setWs] = useState(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(
    () => searchParams.get('ai') === '1' || sessionStorage.getItem('openAIAssistant') === '1'
  )
  useEffect(() => {
    if (aiPanelOpen) sessionStorage.removeItem('openAIAssistant')
  }, [aiPanelOpen])
  const [aiSuggestions, setAiSuggestions] = useState(null)

  useEffect(() => {
    if (workspace?.id) {
      api.get(`/workspaces/${workspace.id}`).then(r => {
        setWs(r.data)
        setStep(r.data.onboarding_step || 1)
      })
    }
  }, [workspace?.id])

  async function saveWorkspace(data) {
    if (!workspace?.id) return
    setSaving(true)
    try {
      await api.patch(`/workspaces/${workspace.id}`, data)
      const { data: updated } = await api.get(`/workspaces/${workspace.id}`)
      setWs(updated)
      if (data.onboarding_step) setStep(data.onboarding_step)
      // Keep sidebar and workspace selector in sync with latest name/settings
      await loadWorkspaces()
    } finally {
      setSaving(false)
    }
  }

  async function saveIntegrations(data) {
    if (!workspace?.id) return
    setSaving(true)
    try {
      await api.post(`/workspaces/${workspace.id}/integrations`, data)
      const { data: updated } = await api.get(`/workspaces/${workspace.id}`)
      setWs(updated)
      setStep(3)
    } finally {
      setSaving(false)
    }
  }

  async function activate() {
    if (!workspace?.id) return
    setSaving(true)
    try {
      await api.post(`/workspaces/${workspace.id}/activate`)
      loadWorkspaces()
      const { data: updated } = await api.get(`/workspaces/${workspace.id}`)
      setWs(updated)
    } catch (e) {
      alert(e.response?.data?.detail || 'Activation failed')
    } finally {
      setSaving(false)
    }
  }

  function handleAIApply(suggestions) {
    setAiSuggestions(suggestions)
  }

  if (!workspace) return <div className="loading">Select a workspace</div>

  return (
    <div className="onboarding-page">
      <div className="onboarding-header">
        <h1>Setup</h1>
        <button
          type="button"
          className="btn btn-secondary ai-setup-btn"
          onClick={() => setAiPanelOpen(!aiPanelOpen)}
        >
          <Sparkles size={18} /> {aiPanelOpen ? 'Hide' : 'Get AI help'}
        </button>
      </div>

      <div className="onboarding-ai-wrap">
        <AIAssistant
          isOpen={aiPanelOpen}
          onClose={() => setAiPanelOpen(false)}
          onApply={handleAIApply}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {STEPS.map(s => (
          <button
            key={s.id}
            className={`btn ${step >= s.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem' }}
            onClick={() => setStep(s.id)}
          >{s.id}. {s.title}</button>
        ))}
      </div>

      {step === 1 && (
        <Step1
          ws={ws}
          aiSuggestions={aiSuggestions}
          onSave={saveWorkspace}
          saving={saving}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <Step2 ws={ws} onSave={saveIntegrations} saving={saving} onNext={() => setStep(3)} />
      )}
      {step === 3 && <Step3 workspaceId={workspace.id} onNext={() => setStep(4)} />}
      {step === 4 && (
        <Step4
          workspaceId={workspace.id}
          aiSuggestions={aiSuggestions}
          onNext={() => setStep(5)}
        />
      )}
      {step === 5 && (
        <Step5
          workspaceId={workspace.id}
          aiSuggestions={aiSuggestions}
          onNext={() => setStep(6)}
        />
      )}
      {step === 6 && <Step6 workspaceId={workspace.id} onNext={() => setStep(7)} />}
      {step === 7 && <Step7 workspaceId={workspace.id} onNext={() => setStep(8)} />}
      {step === 8 && (
        <div className="card">
          <h3>Activate Workspace</h3>
          <p style={{ marginBottom: '1rem' }}>Verify: Email or SMS connected, at least one booking type. Then activate.</p>
          <button className="btn btn-primary" onClick={activate} disabled={saving}>
            {saving ? 'Activating...' : 'Activate'}
          </button>
        </div>
      )}
    </div>
  )
}

function Step1({ ws, aiSuggestions, onSave, saving, onNext }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [contactEmail, setContactEmail] = useState('')
  useEffect(() => {
    if (ws) {
      setName(ws.name || '')
      setAddress(ws.address || '')
      setTimezone(ws.timezone || 'UTC')
      setContactEmail(ws.contact_email || '')
    }
  }, [ws])
  useEffect(() => {
    if (aiSuggestions?.workspace) {
      if (aiSuggestions.workspace.name) setName(aiSuggestions.workspace.name)
      if (aiSuggestions.workspace.timezone) setTimezone(aiSuggestions.workspace.timezone)
    }
  }, [aiSuggestions?.workspace?.name, aiSuggestions?.workspace?.timezone])

  return (
    <div className="card">
      <h3>1. Workspace</h3>
      <label>Business Name</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="My Business" />
      <label>Address</label>
      <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" />
      <label>Timezone</label>
      <input value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="UTC" />
      <label>Contact Email</label>
      <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
      <button className="btn btn-primary" onClick={() => onSave({ name, address, timezone, contact_email: contactEmail, onboarding_step: 2 }).then(onNext)} disabled={saving}>
        Save & Next
      </button>
    </div>
  )
}

function Step2({ ws, onSave, saving, onNext }) {
  const [sendgridKey, setSendgridKey] = useState('')
  const [fromEmail, setFromEmail] = useState(ws?.from_email || ws?.contact_email || '')
  const [twilioSid, setTwilioSid] = useState('')
  const [twilioToken, setTwilioToken] = useState('')
  const [twilioPhone, setTwilioPhone] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [googleCalendarId, setGoogleCalendarId] = useState(ws?.google_calendar_id || '')
  const [googleCredsJson, setGoogleCredsJson] = useState('')
  const [s3Bucket, setS3Bucket] = useState(ws?.s3_bucket || '')
  const [s3CredsJson, setS3CredsJson] = useState('')

  return (
    <div className="card">
      <h3>2. Email & SMS</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Connect at least one channel.</p>
      <label>SendGrid API Key (Email)</label>
      <input type="password" value={sendgridKey} onChange={e => setSendgridKey(e.target.value)} placeholder="SG.xxx" />
      <label>From Email</label>
      <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} />
      <label>Twilio Account SID (SMS)</label>
      <input value={twilioSid} onChange={e => setTwilioSid(e.target.value)} placeholder="ACxxx" />
      <label>Twilio Auth Token</label>
      <input type="password" value={twilioToken} onChange={e => setTwilioToken(e.target.value)} />
      <label>Twilio Phone Number</label>
      <input value={twilioPhone} onChange={e => setTwilioPhone(e.target.value)} placeholder="+1234567890" />

      <button type="button" className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setShowAdvanced(!showAdvanced)}>
        {showAdvanced ? '−' : '+'} Calendar & File Storage (optional)
      </button>
      {showAdvanced && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: 8 }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Google Calendar</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Bookings sync to your calendar.</p>
          <label>Calendar ID</label>
          <input value={googleCalendarId} onChange={e => setGoogleCalendarId(e.target.value)} placeholder="primary or xxx@group.calendar.google.com" />
          <label>Service Account JSON</label>
          <textarea value={googleCredsJson} onChange={e => setGoogleCredsJson(e.target.value)} placeholder='{"type":"service_account",...}' rows={3} style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
          <h4 style={{ marginTop: '1rem', marginBottom: '0.75rem' }}>S3 File Storage (optional)</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Without S3, files are stored locally.</p>
          <label>S3 Bucket</label>
          <input value={s3Bucket} onChange={e => setS3Bucket(e.target.value)} placeholder="my-bucket" />
          <label>S3 Credentials JSON</label>
          <textarea value={s3CredsJson} onChange={e => setS3CredsJson(e.target.value)} placeholder='{"access_key_id":"...","secret_access_key":"...","region":"us-east-1"}' rows={2} style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
        </div>
      )}

      <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => onSave({
        sendgrid_api_key: sendgridKey || undefined,
        from_email: fromEmail,
        twilio_account_sid: twilioSid || undefined,
        twilio_auth_token: twilioToken || undefined,
        twilio_phone_number: twilioPhone || undefined,
        google_calendar_id: googleCalendarId || undefined,
        google_credentials_json: googleCredsJson || undefined,
        s3_bucket: s3Bucket || undefined,
        s3_credentials_json: s3CredsJson || undefined,
      }).then(onNext)} disabled={saving || (!sendgridKey && !twilioSid)}>
        Save & Next
      </button>
    </div>
  )
}

function Step3({ workspaceId, onNext }) {
  const [name, setName] = useState('Contact Form')
  const [creating, setCreating] = useState(false)

  async function create() {
    setCreating(true)
    try {
      await api.post(`/workspaces/${workspaceId}/forms`, {
        name,
        is_contact_form: true,
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'email', type: 'email', required: false },
          { name: 'phone', type: 'tel', required: false },
          { name: 'message', type: 'textarea', required: false },
        ]
      })
      onNext()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="card">
      <h3>3. Contact Form</h3>
      <input value={name} onChange={e => setName(e.target.value)} />
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Share: <code style={{ background: 'var(--bg)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>{window.location.origin}/contact/{workspaceId}</code>
      </p>
      <button className="btn btn-primary" onClick={create} disabled={creating}>Create & Next</button>
    </div>
  )
}

function Step4({ workspaceId, aiSuggestions, onNext }) {
  const suggestedServices = aiSuggestions?.services || []
  const [name, setName] = useState(suggestedServices[0]?.name || '')
  const [duration, setDuration] = useState(suggestedServices[0]?.duration ?? 60)
  const [creating, setCreating] = useState(false)
  const [addingAll, setAddingAll] = useState(false)

  async function create(serviceName, serviceDuration) {
    const n = serviceName || name
    const d = serviceDuration ?? duration
    if (!n) return
    setCreating(true)
    try {
      await api.post(`/workspaces/${workspaceId}/booking-types`, {
        name: n,
        duration_minutes: d,
        availability: { mon: [9,10,11,14,15,16], tue: [9,10,11,14,15,16], wed: [9,10,11,14,15,16], thu: [9,10,11,14,15,16], fri: [9,10,11,14,15,16] }
      })
      setName('')
      setDuration(60)
    } finally {
      setCreating(false)
    }
  }

  async function addAllSuggested() {
    if (!suggestedServices.length) return
    setAddingAll(true)
    try {
      for (const s of suggestedServices) {
        await api.post(`/workspaces/${workspaceId}/booking-types`, {
          name: s.name,
          duration_minutes: s.duration,
          availability: { mon: [9,10,11,14,15,16], tue: [9,10,11,14,15,16], wed: [9,10,11,14,15,16], thu: [9,10,11,14,15,16], fri: [9,10,11,14,15,16] }
        })
      }
      onNext()
    } finally {
      setAddingAll(false)
    }
  }

  return (
    <div className="card">
      <h3>4. Booking Type</h3>
      {suggestedServices.length > 0 && (
        <div className="ai-suggested-block" style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            AI suggested: {suggestedServices.map(s => `${s.name} (${s.duration}min)`).join(', ')}
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={addAllSuggested}
            disabled={addingAll || creating}
          >
            {addingAll ? 'Adding...' : `Add all ${suggestedServices.length} services`}
          </button>
        </div>
      )}
      <label>Or add manually: Service Name</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Consultation" />
      <label>Duration (minutes)</label>
      <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} />
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Share: <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>{window.location.origin}/book/{workspaceId}</code>
      </p>
      <button className="btn btn-primary" onClick={() => create().then(() => {})} disabled={creating || !name}>
        Add & {suggestedServices.length ? 'Continue' : 'Next'}
      </button>
      {suggestedServices.length > 0 && (
        <button className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={onNext}>Skip to next</button>
      )}
    </div>
  )
}

function Step5({ workspaceId, aiSuggestions, onNext }) {
  const suggestedFields = aiSuggestions?.formFields || [
    { name: 'reason', label: 'Reason for visit', type: 'textarea', required: true },
    { name: 'medical_history', label: 'Do you have any past medical history?', type: 'textarea', required: false },
    { name: 'document_upload', label: 'Would you like to upload the respective documents? (Paste links or describe documents to share)', type: 'textarea', required: false },
    { name: 'notes', label: 'Additional notes', type: 'textarea', required: false },
  ]
  const [name, setName] = useState('Intake Form')
  const [creating, setCreating] = useState(false)

  async function create() {
    if (!name) return
    setCreating(true)
    try {
      await api.post(`/workspaces/${workspaceId}/forms`, {
        name,
        is_contact_form: false,
        fields: suggestedFields,
      })
      setName('')
      onNext()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="card">
      <h3>5. Post-Booking Form</h3>
      {aiSuggestions?.formFields?.length > 0 && (
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          AI suggested fields: {suggestedFields.map(f => f.label).join(', ')}
        </p>
      )}
      <label>Form Name (e.g. Intake)</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Intake Form" />
      <button className="btn btn-primary" onClick={create} disabled={creating || !name}>Add & Next</button>
    </div>
  )
}

function Step6({ workspaceId, onNext }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(10)
  const [threshold, setThreshold] = useState(2)
  const [creating, setCreating] = useState(false)

  async function create() {
    if (!name) return
    setCreating(true)
    try {
      await api.post(`/workspaces/${workspaceId}/inventory`, { name, quantity, low_stock_threshold: threshold })
      setName('')
      onNext()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="card">
      <h3>6. Inventory</h3>
      <label>Item Name</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Supplies" />
      <label>Quantity</label>
      <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
      <label>Low Stock Threshold</label>
      <input type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
      <button className="btn btn-primary" onClick={create} disabled={creating || !name}>Add & Next</button>
    </div>
  )
}

function Step7({ workspaceId, onNext }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [inviting, setInviting] = useState(false)

  async function invite() {
    if (!email || !fullName) return
    setInviting(true)
    try {
      await api.post(`/workspaces/${workspaceId}/staff/invite`, {
        email, full_name: fullName,
        permissions: ['inbox', 'bookings', 'forms', 'inventory']
      })
      setEmail('')
      setFullName('')
      onNext()
    } catch (e) {
      alert(e.response?.data?.detail || 'Invite failed')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="card">
      <h3>7. Staff</h3>
      <label>Email</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <label>Full Name</label>
      <input value={fullName} onChange={e => setFullName(e.target.value)} />
      <button className="btn btn-primary" onClick={invite} disabled={inviting || !email || !fullName}>Invite & Next</button>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Skip to activate without staff.</p>
      <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={onNext}>Skip</button>
    </div>
  )
}
