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
    <div className="min-h-screen bg-[#060816] text-white">
      <div className="app-backdrop" />
      <Header
        connected={connected}
        tenantName={metrics?.tenantName}
        provider={metrics?.provider}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {connected && (
        <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <section className="mb-8 max-w-3xl space-y-3">
            <p className="eyebrow">Storage workspace</p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Manage files across your cloud storage from one clean view.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                Upload supported files, monitor usage, and keep your demo
                tenant organized without jumping between storage dashboards.
              </p>
            </div>
          </section>

          <MetricsBar metrics={metrics} />

          <section className="mt-8 max-w-4xl">
            <UploadZone onUploadComplete={refreshAll} />
          </section>

          <section className="panel-surface mt-6 overflow-hidden">
            <div className="border-b border-white/8 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">Library</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Uploaded files
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Browse recent uploads and take quick actions without
                    compressing the rest of the dashboard.
                  </p>
                </div>
                <span className="inline-flex w-fit min-w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
                  {files.length}
                </span>
              </div>
            </div>

            <FileList
              files={files}
              loading={loadingFiles}
              onDelete={handleDelete}
            />
          </section>
        </main>
      )}

      {!connected && (
        <main className="relative mx-auto flex min-h-[calc(100vh-96px)] max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <section className="panel-surface w-full overflow-hidden p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-4">
                <p className="eyebrow">Cloud-agnostic storage</p>
                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                  Upload once, manage anywhere, and keep the tenant workflow
                  fast.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                  Connect with an API key or create a demo tenant from the top
                  right to see the upload flow, metrics, and file lifecycle in
                  one place.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-medium text-white">
                  What you can do here
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                    <p className="text-sm text-slate-200">Direct uploads</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Drop supported documents and images into a clean upload
                      queue.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                    <p className="text-sm text-slate-200">Tenant metrics</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Track file count, storage usage, and the active provider
                      at a glance.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                    <p className="text-sm text-slate-200">Quick file actions</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Open downloads and remove files without leaving the app.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  )
}
