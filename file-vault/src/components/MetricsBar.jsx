export default function MetricsBar({ metrics }) {
  if (!metrics) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className="min-w-32 flex-1 rounded-xl border border-gray-800 bg-gray-900 p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Total Files
        </p>
        <p className="mt-1 text-2xl font-medium text-white">
          {metrics.totalFiles}
        </p>
      </div>

      <div className="min-w-32 flex-1 rounded-xl border border-gray-800 bg-gray-900 p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Storage Used
        </p>
        <p className="mt-1 text-2xl font-medium text-white">
          {metrics.totalBytesHuman}
        </p>
      </div>

      <div className="min-w-32 flex-1 rounded-xl border border-gray-800 bg-gray-900 p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Provider
        </p>
        <p className="mt-1 text-lg font-medium text-white">
          {metrics.provider}
        </p>
        {metrics.provider === 'cloudflare-r2' ? (
          <span className="mt-1 inline-block rounded-full border border-green-800 bg-green-950 px-2 py-0.5 text-xs text-green-400">
            Free egress
          </span>
        ) : null}
      </div>
    </div>
  )
}
