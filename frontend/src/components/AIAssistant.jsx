import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronDown, Check } from 'lucide-react'
import { getAISuggestions } from '../utils/aiOnboarding'

export default function AIAssistant({ onApply, isOpen, onClose }) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setSuggestions(null)
    // Simulate slight delay for "AI thinking" feel
    setTimeout(() => {
      try {
        const result = getAISuggestions(input.trim())
        if (result) {
          setSuggestions(result)
        } else {
          setError('Please describe your business in a few words (e.g. "I run a dental clinic" or "massage therapy studio")')
        }
      } catch (err) {
        setError('Something went wrong. Try again.')
      }
      setLoading(false)
    }, 600)
  }

  function handleApply() {
    if (suggestions && onApply) {
      onApply(suggestions)
      onClose?.()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="ai-assistant-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="ai-assistant-header">
            <div className="ai-assistant-title">
              <Sparkles size={20} />
              <span>AI Setup Assistant</span>
            </div>
            <button type="button" className="ai-assistant-close" onClick={onClose} aria-label="Close">
              <ChevronDown size={20} style={{ transform: 'rotate(-90deg)' }} />
            </button>
          </div>

          <div className="ai-assistant-body">
            <p className="ai-assistant-prompt">
              Describe your business in a few words. We'll suggest the best setup for you.
            </p>
            <form onSubmit={handleSubmit}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="e.g. I run a dental clinic with cleanings and checkups"
                rows={3}
                className="ai-assistant-input"
                disabled={loading}
              />
              {error && <p className="ai-assistant-error">{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <span className="ai-assistant-spinner" />
                ) : (
                  <>
                    <Sparkles size={16} /> Get suggestions
                  </>
                )}
              </button>
            </form>

            {suggestions && (
              <motion.div
                className="ai-assistant-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="ai-assistant-message">{suggestions.message}</p>
                <div className="ai-assistant-preview">
                  <div>
                    <strong>Workspace:</strong> {suggestions.workspace.name}
                  </div>
                  <div>
                    <strong>Services:</strong>{' '}
                    {suggestions.services.map(s => `${s.name} (${s.duration}min)`).join(', ')}
                  </div>
                  <div>
                    <strong>Intake fields:</strong>{' '}
                    {suggestions.formFields.map(f => f.label).join(', ')}
                  </div>
                </div>
                <button type="button" className="btn btn-primary ai-assistant-apply" onClick={handleApply}>
                  <Check size={16} /> Apply suggestions
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
