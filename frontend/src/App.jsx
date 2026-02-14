import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { WorkspaceProvider } from './context/WorkspaceContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import Inbox from './pages/Inbox'
import Bookings from './pages/Bookings'
import Forms from './pages/Forms'
import Inventory from './pages/Inventory'
import Staff from './pages/Staff'
import PublicContact from './pages/public/PublicContact'
import PublicBooking from './pages/public/PublicBooking'
import PublicForm from './pages/public/PublicForm'
import Landing from './pages/Landing'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Loading...</div>
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/contact/:workspaceId" element={<PublicContact />} />
      <Route path="/book/:workspaceId" element={<PublicBooking />} />
      <Route path="/form/:submissionId" element={<PublicForm />} />
      <Route path="/app" element={
        <ProtectedRoute>
          <WorkspaceProvider>
            <Layout />
          </WorkspaceProvider>
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="forms" element={<Forms />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="staff" element={<Staff />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
