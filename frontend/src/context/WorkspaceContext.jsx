import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([])
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadWorkspaces() {
    try {
      const { data } = await api.get('/workspaces')
      setWorkspaces(data)
      setWorkspace(prev => {
        if (data.length === 0) return null
        if (prev && data.find(w => w.id === prev.id)) return data.find(w => w.id === prev.id)
        return data[0]
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkspaces()
  }, [])

  function selectWorkspace(ws) {
    setWorkspace(ws)
  }

  return (
    <WorkspaceContext.Provider value={{ workspaces, workspace, selectWorkspace, loadWorkspaces, loading }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  return ctx || { workspace: null, workspaces: [] }
}
