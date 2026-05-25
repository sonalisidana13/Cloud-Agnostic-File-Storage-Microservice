import { useState } from 'react'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import FileList from './components/FileList'
import MetricsBar from './components/MetricsBar'
import { deleteFile, getMetrics, listFiles } from './api/files'
import {
  createDemoTenant,
  listDemoTenantMetrics,
  listDemoTenants,
} from './api/tenants'
import TenantWorkspace from './components/TenantWorkspace'
import { useToast } from './context/ToastContext'

export default function App() {
  const { addToast } = useToast()
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('files')
  const [connected, setConnected] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const [files, setFiles] = useState([])
  const [demoTenants, setDemoTenants] = useState([])
  const [tenantOverview, setTenantOverview] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [loadingTenantOverview, setLoadingTenantOverview] = useState(false)
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [creatingTenant, setCreatingTenant] = useState(false)
  const [switchingTenantId, setSwitchingTenantId] = useState(null)
  const [connectionError, setConnectionError] = useState('')

  const handleDisconnect = () => {
    setActiveWorkspaceTab('files')
    setConnected(false)
    setMetrics(null)
    setFiles([])
    setDemoTenants([])
    setTenantOverview([])
    setConnectionError('')
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

  const loadDemoTenants = async () => {
    setLoadingTenants(true)

    try {
      const res = await listDemoTenants()
      setDemoTenants(res.data)
    } catch {
      addToast('Failed to load tenants', 'error')
    } finally {
      setLoadingTenants(false)
    }
  }

  const loadTenantOverview = async () => {
    setLoadingTenantOverview(true)

    try {
      const res = await listDemoTenantMetrics()
      setTenantOverview(res.data)
    } catch {
      addToast('Failed to load tenant metrics', 'error')
    } finally {
      setLoadingTenantOverview(false)
    }
  }

  const connectWithApiKey = async (nextApiKey, options = {}) => {
    const normalizedApiKey = nextApiKey.trim()

    if (!normalizedApiKey) {
      setConnectionError('Enter an API key')
      return false
    }

    const previousApiKey = localStorage.getItem('apiKey')
    setConnectionError('')
    setConnectionLoading(true)

    if (options.switchTenantId) {
      setSwitchingTenantId(options.switchTenantId)
    }

    localStorage.setItem('apiKey', normalizedApiKey)

    try {
      const res = await getMetrics()
      setActiveWorkspaceTab('files')
      setMetrics(res.data)
      setConnected(true)

      await Promise.all([
        fetchFiles(),
        loadDemoTenants(),
        loadTenantOverview(),
      ])

      if (options.successMessage) {
        addToast(options.successMessage, 'success')
      }

      return true
    } catch (err) {
      if (previousApiKey) {
        localStorage.setItem('apiKey', previousApiKey)
      } else {
        localStorage.removeItem('apiKey')
      }

      if (err.response?.status === 401) {
        setConnectionError('Invalid API key')
      } else {
        setConnectionError('Cannot reach server')
      }
      return false
    } finally {
      setConnectionLoading(false)
      setSwitchingTenantId(null)
    }
  }

  const createAndConnectTenant = async (tenantName = '') => {
    setCreatingTenant(true)
    setConnectionError('')

    try {
      const normalizedTenantName = tenantName.trim()
      const res = await createDemoTenant(normalizedTenantName || undefined)
      const connected = await connectWithApiKey(res.data.apiKey, {
        successMessage: `${res.data.tenantName} created`,
      })
      return connected
    } catch (err) {
      setConnectionError(err.response?.data?.error || 'Could not create demo tenant')
      return false
    } finally {
      setCreatingTenant(false)
    }
  }

  const handleSwitchTenant = async (tenant) => {
    await connectWithApiKey(tenant.apiKey, {
      switchTenantId: tenant.tenantId,
      successMessage: `Switched to ${tenant.tenantName}`,
    })
  }

  const refreshAll = async () => {
    setLoadingFiles(true)
    setLoadingTenantOverview(true)

    try {
      const [filesRes, metricsRes, overviewRes] = await Promise.all([
        listFiles(),
        getMetrics(),
        listDemoTenantMetrics(),
      ])
      setFiles(filesRes.data)
      setMetrics(metricsRes.data)
      setTenantOverview(overviewRes.data)
    } catch {
      addToast('Failed to refresh', 'error')
    } finally {
      setLoadingFiles(false)
      setLoadingTenantOverview(false)
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
        loading={connectionLoading}
        creatingTenant={creatingTenant}
        error={connectionError}
        onConnectWithApiKey={connectWithApiKey}
        onCreateTenant={createAndConnectTenant}
        onClearError={() => setConnectionError('')}
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

          <section className="mt-8 space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="eyebrow">Workspace navigation</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {activeWorkspaceTab === 'files'
                    ? `Working in ${metrics?.tenantName}`
                    : 'Manage demo tenants'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {activeWorkspaceTab === 'files'
                    ? 'Upload files, browse attachments, and manage content only for the currently connected tenant.'
                    : 'Create named tenants, switch the active workspace, and compare tenant-level storage metrics.'}
                </p>
              </div>

              <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 p-1">
                {[
                  { id: 'files', label: 'Files' },
                  { id: 'tenants', label: 'Tenants' },
                ].map((tab) => {
                  const isActive = activeWorkspaceTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveWorkspaceTab(tab.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-cyan-400 text-slate-950'
                          : 'text-slate-300 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {activeWorkspaceTab === 'files' ? (
              <div className="space-y-6">
                <section className="max-w-4xl">
                  <UploadZone onUploadComplete={refreshAll} />
                </section>

                <section className="panel-surface overflow-hidden">
                  <div className="border-b border-white/8 px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="eyebrow">Library</p>
                        <h2 className="mt-2 text-xl font-semibold text-white">
                          Uploaded files
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          Browse recent uploads and take quick actions without
                          leaving the active tenant workspace.
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
              </div>
            ) : (
              <TenantWorkspace
                tenants={demoTenants}
                tenantOverview={tenantOverview}
                currentTenantId={metrics?.tenantId}
                onCreateTenant={createAndConnectTenant}
                onSwitchTenant={handleSwitchTenant}
                creatingTenant={creatingTenant}
                switchingTenantId={switchingTenantId}
                loadingTenants={loadingTenants}
                loadingOverview={loadingTenantOverview}
              />
            )}
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
