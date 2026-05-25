import { useToast } from '../context/ToastContext'
import { formatBytes, timeAgo } from '../utils/format'

export default function FileList({ files, loading, onDelete }) {
  useToast()

  if (loading) {
    return (
      <div className="grid gap-3 p-5 sm:p-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-2xl border border-white/8 bg-white/[0.03] p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/8" />
                <div className="space-y-2">
                  <div className="h-4 w-36 rounded-full bg-white/8" />
                  <div className="h-3 w-24 rounded-full bg-white/6" />
                </div>
              </div>
              <div className="h-9 w-24 rounded-full bg-white/8" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!files.length) {
    return (
      <div className="p-5 sm:p-6">
        <div className="rounded-[26px] border border-dashed border-white/10 bg-slate-950/70 px-6 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-2xl text-slate-300">
            ⌁
          </div>
          <p className="mt-5 text-lg font-medium text-white">
            No files uploaded yet
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Use the upload panel to add your first file and start populating
            this library.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3 p-5 sm:p-6 xl:grid-cols-2">
      {files.map((file) => (
        <div
          key={file.fileId}
          className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/14 hover:bg-white/[0.05]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-slate-300">
                ⌘
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white sm:text-base">
                  {file.fileName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span>{file.contentType}</span>
                  <span>{formatBytes(file.sizeBytes)}</span>
                  <span>{timeAgo(file.uploadedAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
              <button
                onClick={() => window.open(file.downloadUrl, '_blank')}
                className="inline-flex items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/18"
              >
                Download
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${file.fileName}"?`)) {
                    onDelete(file.fileId)
                  }
                }}
                className="inline-flex items-center justify-center rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:border-red-300/40 hover:bg-red-400/18"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
