import axios from 'axios'

// In dev, use '' so Vite proxy forwards /auth, /workspaces to backend (avoids CORS)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:8000'),
  headers: { 'Content-Type': 'application/json' },
})

const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export default api
