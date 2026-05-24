import { useState } from 'react'
import { getMetrics } from '../api/files'
import { createDemoTenant } from '../api/tenants'

export default function Header({
  connected,
  tenantName,
  onConnect,
  onDisconnect,
}) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creatingTenant, setCreatingTenant] = useState(false)
  const [error, setError] = useState('')

  const connectWithApiKey = async (nextApiKey) => {
    const normalizedApiKey = nextApiKey.trim()

    if (!normalizedApiKey) {
      setError('Enter an API key')
      return
    }

    setError('')
    setLoading(true)
    setApiKey(normalizedApiKey)
    localStorage.setItem('apiKey', normalizedApiKey)

    try {
      const res = await getMetrics()
      onConnect(res.data)
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid API key')
      } else {
        setError('Cannot reach server')
      }
      localStorage.removeItem('apiKey')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    await connectWithApiKey(apiKey)
  }

  const handleCreateTenant = async () => {
    setCreatingTenant(true)
    setError('')

    try {
      const res = await createDemoTenant()
      const nextApiKey = res.data.apiKey
      setShowKey(true)
      await connectWithApiKey(nextApiKey)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create demo tenant')
    } finally {
      setCreatingTenant(false)
    }
  }

  const handleDisconnect = () => {
    localStorage.removeItem('apiKey')
    onDisconnect()
  }

  return (
    <header className="w-full bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center">
          <span className="text-lg font-medium text-white">FileVault</span>
          <span className="ml-2 text-sm text-gray-500">☁ Cloud Storage</span>
        </div>

        {connected ? (
          <div className="flex items-center">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
            <span className="ml-2 text-sm text-white">{tenantName}</span>
            <span className="ml-1 text-sm text-green-400">Connected</span>
            <button
              onClick={handleDisconnect}
              className="ml-4 text-sm text-gray-400 hover:text-white"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <div className="flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key"
                className="w-64 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={() => setShowKey((prev) => !prev)}
                className="ml-2 text-sm text-gray-400 hover:text-white"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={handleConnect}
                disabled={loading || creatingTenant}
                className="ml-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect'}
              </button>
              <button
                onClick={handleCreateTenant}
                disabled={loading || creatingTenant}
                className="ml-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {creatingTenant ? 'Creating...' : 'Create Demo Tenant'}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Demo tenant creation generates and saves an API key locally
            </p>
            {error ? <p className="mt-1 text-sm text-red-400">{error}</p> : null}
          </div>
        )}
      </div>
    </header>
  )
}
