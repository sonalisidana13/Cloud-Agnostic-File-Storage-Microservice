import { useToast } from '../context/ToastContext'
import { formatBytes, timeAgo } from '../utils/format'

export default function FileList({ files, onDelete }) {
  useToast()

  if (!files.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">No files uploaded yet</p>
        <p className="mt-1 text-sm text-gray-600">
          Upload a file above to get started
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-800">
      {files.map((file) => (
        <div
          key={file.fileId}
          className="flex items-center justify-between px-1 py-3"
        >
          <div className="flex min-w-0 items-center">
            <span className="mr-3 shrink-0 text-gray-500">📄</span>
            <div className="min-w-0">
              <p className="max-w-xs truncate text-sm font-medium text-white">
                {file.fileName}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {file.contentType} · {formatBytes(file.sizeBytes)}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <span className="mr-4 text-xs text-gray-600">
              {timeAgo(file.uploadedAt)}
            </span>
            <button
              onClick={() => window.open(file.downloadUrl, '_blank')}
              className="mr-3 text-sm text-blue-400 hover:text-blue-300"
            >
              Download
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete "${file.fileName}"?`)) {
                  onDelete(file.fileId)
                }
              }}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
