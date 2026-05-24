import { useState } from 'react'
import { getMetrics } from '../api/files'

export default function Header({
  connected,
  tenantName,
  onConnect,
  onDisconnect,
}) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    setLoading(true)
    setError('')
    localStorage.setItem('apiKey', apiKey)

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
                disabled={loading}
                className="ml-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
            {error ? <p className="mt-1 text-sm text-red-400">{error}</p> : null}
          </div>
        )}
      </div>
    </header>
  )
}
