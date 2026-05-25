import { useState } from 'react'
import { formatDateTime } from '../utils/format'

function maskApiKey(apiKey) {
  if (!apiKey) return 'No API key'
  if (apiKey.length <= 10) return apiKey
  return `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`
}

export default function TenantWorkspace({
  tenants,
  tenantOverview,
  currentTenantId,
  onCreateTenant,
  onSwitchTenant,
  creatingTenant,
  switchingTenantId,
  loadingTenants,
  loadingOverview,
}) {
  const [tenantName, setTenantName] = useState('')

  const handleCreateTenant = async () => {
    const created = await onCreateTenant(tenantName)
    if (created) {
      setTenantName('')
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="panel-surface overflow-hidden">
        <div className="border-b border-white/8 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3">
            <div>
              <p className="eyebrow">Tenant manager</p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Create and switch tenants
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Keep multiple tenants ready and switch workspaces without
                retyping API keys.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Optional tenant name, for example Finance Workspace"
                className="w-full min-w-0 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/15"
              />
              <button
                onClick={handleCreateTenant}
                disabled={creatingTenant}
                className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingTenant ? 'Creating...' : 'Create tenant'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {loadingTenants ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                >
                  <div className="h-4 w-28 rounded-full bg-white/8" />
                  <div className="mt-3 h-3 w-40 rounded-full bg-white/6" />
                  <div className="mt-4 h-9 w-24 rounded-full bg-white/8" />
                </div>
              ))}
            </div>
          ) : tenants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 px-5 py-10 text-center">
              <p className="text-sm font-medium text-white">
                No demo tenants yet
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Create your first tenant to start switching between isolated
                workspaces.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {tenants.map((tenant) => {
                const isActive = tenant.tenantId === currentTenantId
                const isSwitching = switchingTenantId === tenant.tenantId

                return (
                  <div
                    key={tenant.tenantId}
                    className={`rounded-2xl border p-4 transition ${
                      isActive
                        ? 'border-cyan-400/40 bg-cyan-400/10'
                        : 'border-white/8 bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-medium text-white">
                          {tenant.tenantName}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                          {isActive ? 'Active tenant' : 'Demo tenant'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          isActive
                            ? 'bg-cyan-400/18 text-cyan-100'
                            : 'bg-white/6 text-slate-300'
                        }`}
                      >
                        {isActive ? 'Connected' : 'Available'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-400">
                      <p>Created {formatDateTime(tenant.createdAt)}</p>
                      <p className="font-mono text-xs text-slate-500">
                        {maskApiKey(tenant.apiKey)}
                      </p>
                    </div>

                    <button
                      onClick={() => onSwitchTenant(tenant)}
                      disabled={isActive || Boolean(switchingTenantId)}
                      className={`mt-4 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'cursor-default border border-white/10 bg-white/5 text-slate-400'
                          : 'border border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:border-cyan-300/40 hover:bg-cyan-400/18'
                      } disabled:opacity-60`}
                    >
                      {isSwitching ? 'Switching...' : isActive ? 'Current tenant' : 'Switch tenant'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="panel-surface overflow-hidden">
        <div className="border-b border-white/8 px-5 py-4 sm:px-6">
          <p className="eyebrow">Tenant overview</p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Tenant-wise metrics
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Compare file counts and storage usage across available tenants.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {loadingOverview ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                >
                  <div className="h-4 w-32 rounded-full bg-white/8" />
                  <div className="mt-3 h-3 w-48 rounded-full bg-white/6" />
                </div>
              ))}
            </div>
          ) : tenantOverview.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 px-5 py-10 text-center">
              <p className="text-sm font-medium text-white">
                No tenant metrics yet
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Create a tenant and upload files to start building overview
                metrics.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tenantOverview.map((tenant) => {
                const isActive = tenant.tenantId === currentTenantId

                return (
                  <div
                    key={tenant.tenantId}
                    className={`rounded-2xl border p-4 ${
                      isActive
                        ? 'border-cyan-400/30 bg-cyan-400/8'
                        : 'border-white/8 bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-medium text-white">
                            {tenant.tenantName}
                          </p>
                          {isActive ? (
                            <span className="rounded-full bg-cyan-400/18 px-2 py-1 text-xs font-medium text-cyan-100">
                              Active
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          Created {formatDateTime(tenant.createdAt)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-64">
                        <div className="rounded-xl border border-white/8 bg-slate-950/60 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                            Files
                          </p>
                          <p className="mt-2 text-lg font-medium text-white">
                            {tenant.totalFiles}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/8 bg-slate-950/60 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                            Storage
                          </p>
                          <p className="mt-2 text-lg font-medium text-white">
                            {tenant.totalBytesHuman}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      Provider: <span className="text-slate-300">{tenant.provider}</span>
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
