import { useState } from 'react'

export default function Header({
  connected,
  tenantName,
  provider,
  loading,
  creatingTenant,
  error,
  onConnectWithApiKey,
  onCreateTenant,
  onClearError,
  onDisconnect,
}) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [newTenantName, setNewTenantName] = useState('')

  const handleConnect = async () => {
    await onConnectWithApiKey(apiKey)
  }

  const handleCreateTenant = async () => {
    const created = await onCreateTenant(newTenantName)
    if (created) {
      setNewTenantName('')
    }
  }

  const handleDisconnect = () => {
    localStorage.removeItem('apiKey')
    onDisconnect()
  }

  return (
    <header className="relative border-b border-white/8 bg-slate-950/65 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-lg text-cyan-200 shadow-[0_0_40px_rgba(34,211,238,0.14)]">
              FV
            </div>
            <div>
              <span className="text-xl font-semibold tracking-tight text-white">
                FileVault
              </span>
              <p className="text-sm text-slate-400">
                Cloud storage control plane
              </p>
            </div>
          </div>

          <p className="max-w-md text-sm leading-6 text-slate-500">
            Connect a tenant, upload files, and manage storage activity from a
            single dashboard.
          </p>
        </div>

        {connected ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.9)]" />
                <span className="text-sm font-medium text-white">
                  {tenantName}
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-200/85">
                Connected{provider ? ` to ${provider}` : ''}
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 lg:w-auto">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={newTenantName}
                onChange={(e) => {
                  setNewTenantName(e.target.value)
                  if (error) {
                    onClearError()
                  }
                }}
                placeholder="Optional tenant name for demo creation"
                className="w-full min-w-0 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/15"
              />
              <div className="rounded-2xl border border-white/8 bg-slate-950/35 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Manual connect
                </p>
                <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  if (error) {
                    onClearError()
                  }
                }}
                placeholder="Enter API key for manual connect"
                className="w-full min-w-0 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 xl:w-72"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:flex-nowrap">
                <button
                  onClick={() => setShowKey((prev) => !prev)}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  {showKey ? 'Hide key' : 'Show key'}
                </button>
                <button
                  onClick={handleConnect}
                  disabled={loading || creatingTenant}
                  className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
                <button
                  onClick={handleCreateTenant}
                  disabled={loading || creatingTenant}
                  className="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-medium text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-400/18 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingTenant ? 'Creating...' : 'Create demo tenant'}
                </button>
              </div>
            </div>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Create a named tenant first, or use manual API key connect if you
              already have a tenant key.
            </p>
            {error ? (
              <p className="mt-2 rounded-2xl border border-red-500/20 bg-red-500/8 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </header>
  )
}
