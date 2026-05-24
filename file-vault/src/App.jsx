import { useState } from 'react'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import FileList from './components/FileList'
import MetricsBar from './components/MetricsBar'
import { deleteFile, getMetrics, listFiles } from './api/files'
import { useToast } from './context/ToastContext'

export default function App() {
  const { addToast } = useToast()
  const [connected, setConnected] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const [files, setFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)

  const handleConnect = (metricsData) => {
    setMetrics(metricsData)
    setConnected(true)
    fetchFiles()
  }

  const handleDisconnect = () => {
    setConnected(false)
    setMetrics(null)
    setFiles([])
  }

  const fetchFiles = async () => {
    setLoadingFiles(true)

    try {
      const res = await listFiles()
      setFiles(res.data)
    } catch {
      addToast('Failed to load files', 'error')
    } finally {
      setLoadingFiles(false)
    }
  }

  const refreshAll = async () => {
    try {
      const [filesRes, metricsRes] = await Promise.all([
        listFiles(),
        getMetrics(),
      ])
      setFiles(filesRes.data)
      setMetrics(metricsRes.data)
    } catch {
      addToast('Failed to refresh', 'error')
    }
  }

  const handleDelete = async (fileId) => {
    try {
      await deleteFile(fileId)
      addToast('File deleted', 'success')
      refreshAll()
    } catch {
      addToast('Could not delete file', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header
        connected={connected}
        tenantName={metrics?.tenantName}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {connected && (
        <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          <MetricsBar metrics={metrics} />
          <UploadZone onUploadComplete={refreshAll} />
          {loadingFiles ? (
            <p className="py-8 text-center text-gray-500">Loading files...</p>
          ) : (
            <FileList files={files} onDelete={handleDelete} />
          )}
        </main>
      )}

      {!connected && (
        <div className="flex h-96 flex-col items-center justify-center space-y-2 text-gray-500">
          <p className="text-lg">Enter your API key to get started</p>
          <p className="text-sm">Use the input in the top right corner</p>
        </div>
      )}
    </div>
  )
}
