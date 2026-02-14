/**
 * AI onboarding suggestion engine.
 * Parses natural language business descriptions and returns structured setup suggestions.
 */

const INDUSTRY_PRESETS = {
  dental: {
    businessType: 'dental',
    services: [
      { name: 'Dental Checkup', duration: 30 },
      { name: 'Teeth Cleaning', duration: 45 },
      { name: 'Consultation', duration: 15 },
    ],
    formFields: [
      { name: 'medical_history', label: 'Do you have any past medical history?', type: 'textarea', required: false },
      { name: 'document_upload', label: 'Would you like to upload the respective documents? (Paste links or describe documents to share)', type: 'textarea', required: false },
      { name: 'allergies', label: 'Allergies or sensitivities', type: 'textarea', required: false },
      { name: 'current_medications', label: 'Current medications', type: 'textarea', required: false },
    ],
  },
  therapy: {
    businessType: 'therapy',
    services: [
      { name: 'Initial Session', duration: 60 },
      { name: 'Follow-up Session', duration: 50 },
      { name: 'Consultation', duration: 30 },
    ],
    formFields: [
      { name: 'reason', label: 'Reason for visit', type: 'textarea', required: true },
      { name: 'medical_history', label: 'Do you have any past medical history?', type: 'textarea', required: false },
      { name: 'document_upload', label: 'Would you like to upload the respective documents? (Paste links or describe documents to share)', type: 'textarea', required: false },
      { name: 'goals', label: 'Goals for therapy', type: 'textarea', required: false },
    ],
  },
  massage: {
    businessType: 'massage',
    services: [
      { name: '60-min Massage', duration: 60 },
      { name: '90-min Massage', duration: 90 },
      { name: '30-min Chair Massage', duration: 30 },
    ],
    formFields: [
      { name: 'medical_history', label: 'Do you have any past medical history?', type: 'textarea', required: false },
      { name: 'document_upload', label: 'Would you like to upload the respective documents? (Paste links or describe documents to share)', type: 'textarea', required: false },
      { name: 'areas_of_focus', label: 'Areas you\'d like to focus on', type: 'textarea', required: false },
      { name: 'injuries', label: 'Injuries or conditions to be aware of', type: 'textarea', required: true },
    ],
  },
  salon: {
    businessType: 'salon',
    services: [
      { name: 'Haircut', duration: 45 },
      { name: 'Color & Cut', duration: 90 },
      { name: 'Styling', duration: 30 },
    ],
    formFields: [
      { name: 'hair_type', label: 'Hair type / texture', type: 'text', required: false },
      { name: 'preferences', label: 'Styling preferences', type: 'textarea', required: false },
    ],
  },
  spa: {
    businessType: 'spa',
    services: [
      { name: 'Facial', duration: 60 },
      { name: 'Body Treatment', duration: 90 },
      { name: 'Consultation', duration: 30 },
    ],
    formFields: [
      { name: 'skin_type', label: 'Skin type', type: 'text', required: false },
      { name: 'concerns', label: 'Skin concerns or goals', type: 'textarea', required: false },
    ],
  },
  fitness: {
    businessType: 'fitness',
    services: [
      { name: 'Personal Training', duration: 60 },
      { name: 'Group Class', duration: 45 },
      { name: 'Consultation', duration: 30 },
    ],
    formFields: [
      { name: 'fitness_level', label: 'Current fitness level', type: 'text', required: false },
      { name: 'goals', label: 'Fitness goals', type: 'textarea', required: false },
    ],
  },
  consulting: {
    businessType: 'consulting',
    services: [
      { name: 'Strategy Call', duration: 60 },
      { name: 'Consultation', duration: 30 },
      { name: 'Discovery Session', duration: 90 },
    ],
    formFields: [
      { name: 'challenge', label: 'What challenge can we help with?', type: 'textarea', required: true },
      { name: 'company', label: 'Company / role', type: 'text', required: false },
    ],
  },
  coaching: {
    businessType: 'coaching',
    services: [
      { name: 'Coaching Session', duration: 60 },
      { name: 'Intro Call', duration: 30 },
      { name: 'Group Session', duration: 90 },
    ],
    formFields: [
      { name: 'goals', label: 'What would you like to achieve?', type: 'textarea', required: true },
      { name: 'current_situation', label: 'Where are you today?', type: 'textarea', required: false },
    ],
  },
  tutoring: {
    businessType: 'tutoring',
    services: [
      { name: '1-hour Session', duration: 60 },
      { name: '30-min Session', duration: 30 },
      { name: 'Assessment', duration: 45 },
    ],
    formFields: [
      { name: 'subject', label: 'Subject / topic', type: 'text', required: true },
      { name: 'level', label: 'Current level (e.g. grade, exam prep)', type: 'text', required: false },
    ],
  },
  default: {
    businessType: 'general',
    services: [
      { name: 'Consultation', duration: 60 },
      { name: 'Session', duration: 45 },
      { name: 'Meeting', duration: 30 },
    ],
    formFields: [
      { name: 'reason', label: 'Reason for visit', type: 'textarea', required: true },
      { name: 'medical_history', label: 'Do you have any past medical history?', type: 'textarea', required: false },
      { name: 'document_upload', label: 'Would you like to upload the respective documents? (Paste links or describe documents to share)', type: 'textarea', required: false },
      { name: 'notes', label: 'Additional notes', type: 'textarea', required: false },
    ],
  },
}

const KEYWORDS = {
  dental: ['dental', 'dentist', 'teeth', 'oral'],
  therapy: ['therapy', 'therapist', 'counseling', 'mental health', 'psych'],
  massage: ['massage', 'massage therapist', 'bodywork'],
  salon: ['salon', 'hair', 'hairstylist', 'barber', 'beauty'],
  spa: ['spa', 'facial', 'skin care', 'esthetician'],
  fitness: ['fitness', 'gym', 'personal trainer', 'yoga', 'pilates'],
  consulting: ['consulting', 'consultant', 'strategy', 'business advisory'],
  coaching: ['coaching', 'coach', 'life coach', 'executive coach'],
  tutoring: ['tutoring', 'tutor', 'teaching', 'education'],
}

function extractBusinessName(text) {
  const lower = text.toLowerCase()
  const patterns = [
    /^(?:i run|i own|we run|we own|my business is|our business is)\s+(?:a |an )?([^.?!,]+)/i,
    /^(?:i'm|i am)\s+(?:a |an )?([^.?!,]+)/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:clinic|studio|practice|salon|spa|agency|services)/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m && m[1]) return m[1].trim()
  }
  const words = text.split(/\s+/).filter(w => w.length > 2)
  if (words.length >= 1) {
    const first = words.slice(0, 2).join(' ')
    if (first.length >= 3) return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  }
  return ''
}

function detectIndustry(text) {
  const lower = text.toLowerCase()
  let best = 'default'
  let maxScore = 0
  for (const [industry, keywords] of Object.entries(KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw)).length
    if (score > maxScore) {
      maxScore = score
      best = industry
    }
  }
  return best
}

export function getAISuggestions(description) {
  if (!description || typeof description !== 'string' || description.trim().length < 3) {
    return null
  }
  const industry = detectIndustry(description)
  const preset = INDUSTRY_PRESETS[industry] || INDUSTRY_PRESETS.default
  const businessName = extractBusinessName(description) || 'My Business'
  return {
    workspace: {
      name: businessName,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
    services: preset.services,
    formFields: preset.formFields,
    industry: preset.businessType,
    message: `Based on your "${industry}" business, I've suggested ${preset.services.length} service types and ${preset.formFields.length} intake form fields. Review and adjust as needed.`,
  }
}
