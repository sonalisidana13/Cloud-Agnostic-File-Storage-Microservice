import { useRef, useState } from 'react'
import {
  completeUpload,
  initiateUpload,
  uploadPendingFile,
  uploadToStorage,
} from '../api/files'
import { useToast } from '../context/ToastContext'

const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024
const SUPPORTED_FILE_TYPES_MESSAGE =
  'Only PDF, TXT, CSV, JSON, PNG, and JPG files are allowed'
const SUPPORTED_MIME_TYPES_BY_EXTENSION = {
  pdf: ['application/pdf'],
  txt: ['text/plain'],
  csv: ['text/csv', 'application/csv', 'application/vnd.ms-excel'],
  json: ['application/json', 'text/json'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
}
const ACCEPTED_FILE_TYPES = '.pdf,.txt,.csv,.json,.png,.jpg,.jpeg'
const FILE_TYPE_BADGES = ['PDF', 'TXT', 'CSV', 'JSON', 'PNG', 'JPG']

export default function UploadZone({ onUploadComplete }) {
  const inputRef = useRef(null)
  const { addToast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState([])

  const isDirectUploadFailure = (err) =>
    !err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error'

  const shouldUseBackendUpload = (uploadUrl) => {
    if (import.meta.env.VITE_FORCE_BACKEND_UPLOAD === 'true') {
      return true
    }

    return false
  }

  const logDirectUploadFailure = (err, uploadUrl) => {
    let uploadHost = 'unknown'

    try {
      uploadHost = new URL(uploadUrl).host
    } catch {
      uploadHost = 'invalid-url'
    }

    console.warn('Direct storage upload failed', {
      uploadHost,
      code: err.code,
      message: err.message,
      status: err.response?.status,
    })
  }

  const getUploadErrorMessage = (err, fileName) =>
    err.response?.data?.error || `Failed to upload ${fileName}`

  const getFileExtension = (fileName) => {
    const lastDotIndex = fileName.lastIndexOf('.')

    if (lastDotIndex < 0 || lastDotIndex === fileName.length - 1) {
      return null
    }

    return fileName.slice(lastDotIndex + 1).toLowerCase()
  }

  const resolveContentType = (file) => {
    const extension = getFileExtension(file.name)
    const allowedMimeTypes = extension
      ? SUPPORTED_MIME_TYPES_BY_EXTENSION[extension]
      : null

    if (!allowedMimeTypes) {
      return null
    }

    const normalizedType = file.type?.split(';')[0]?.trim().toLowerCase()
    if (normalizedType && allowedMimeTypes.includes(normalizedType)) {
      return normalizedType
    }

    if (normalizedType) {
      return null
    }

    return allowedMimeTypes[0]
  }

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList)
    const validFiles = files.filter((file) => {
      if (file.size <= MAX_UPLOAD_SIZE_BYTES) {
        const resolvedContentType = resolveContentType(file)

        if (resolvedContentType) {
          return true
        }

        addToast(`${file.name} is not an allowed file type`, 'error')
        return false
      }

      addToast(`${file.name} is larger than 2 MB and was skipped`, 'error')
      return false
    })

    if (validFiles.length === 0) {
      return
    }
    const ids = validFiles.map((_, i) => Date.now() + i)

    setUploads(
      validFiles.map((f, i) => ({
        id: ids[i],
        fileName: f.name,
        progress: 0,
        status: 'uploading',
      })),
    )

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      const uploadId = ids[i]
      const resolvedContentType = resolveContentType(file)

      try {
        const initiateRes = await initiateUpload(
          file.name,
          resolvedContentType,
          file.size,
        )
        const { fileId, uploadUrl } = initiateRes.data
        let usedBackendFallback = shouldUseBackendUpload(uploadUrl)

        if (!usedBackendFallback) {
          try {
            await uploadToStorage(uploadUrl, file, resolvedContentType, (pct) => {
              setUploads((prev) =>
                prev.map((u) =>
                  u.id === uploadId ? { ...u, progress: pct } : u,
                ),
              )
            })

            await completeUpload(fileId)
          } catch (err) {
            logDirectUploadFailure(err, uploadUrl)

            if (!isDirectUploadFailure(err)) {
              throw err
            }

            usedBackendFallback = true
          }
        }

        if (usedBackendFallback) {
          await uploadPendingFile(fileId, file, (pct) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadId ? { ...u, progress: pct } : u,
              ),
            )
          })
        }

        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId ? { ...u, progress: 100, status: 'done' } : u,
          ),
        )
        addToast(
          usedBackendFallback
            ? `${file.name} uploaded via backend fallback`
            : `${file.name} uploaded successfully`,
          'success',
        )
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, status: 'error' } : u)),
        )
        addToast(getUploadErrorMessage(err, file.name), 'error')
      }
    }

    onUploadComplete()
    setTimeout(() => setUploads([]), 2000)
  }

  const handleInputChange = (e) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <section className="panel-surface overflow-hidden">
      <div className="border-b border-white/8 px-5 py-4 sm:px-6">
        <p className="eyebrow">Upload</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Upload files to the vault
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Add supported files with automatic progress tracking and seamless
              fallback when needed.
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] whitespace-nowrap text-slate-300">
            Max 2 MB each
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
          className={`group cursor-pointer rounded-[28px] border p-6 transition duration-200 sm:p-8 ${
            isDragging
              ? 'border-cyan-400/60 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.18),0_24px_60px_rgba(8,47,73,0.35)]'
              : 'border-white/10 bg-slate-950/70 hover:border-cyan-300/30 hover:bg-slate-950/90'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            multiple
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-2xl text-cyan-200">
                {isDragging ? '↑' : '↥'}
              </div>
              <h3 className="mt-5 max-w-xl text-2xl font-semibold tracking-tight text-white">
                {isDragging
                  ? 'Release to start uploading'
                  : 'Drag files here or choose them from your device'}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {SUPPORTED_FILE_TYPES_MESSAGE}. You can upload multiple files at
                once, and the app will handle fallback automatically if direct
                storage upload is unavailable.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 xl:items-end">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-medium whitespace-nowrap text-slate-950 transition group-hover:bg-cyan-300"
              >
                Choose files
              </button>
              <p className="text-sm text-slate-500 xl:text-right">
                Or drag and drop files anywhere in this panel
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {FILE_TYPE_BADGES.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {uploads.length > 0 ? (
          <div className="mt-5 rounded-[26px] border border-white/8 bg-slate-950/75 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Upload queue</p>
                <p className="mt-1 text-sm text-slate-400">
                  Progress updates stay here until the queue completes.
                </p>
              </div>
              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 text-sm text-slate-200">
                {uploads.length}
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">
                        {upload.fileName}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {upload.status === 'uploading'
                          ? 'Uploading'
                          : upload.status === 'done'
                            ? 'Completed'
                            : 'Failed'}
                      </p>
                    </div>
                    <span className="text-sm">
                      {upload.status === 'uploading' ? (
                        <span className="text-slate-300">{upload.progress}%</span>
                      ) : upload.status === 'done' ? (
                        <span className="text-emerald-300">Done</span>
                      ) : (
                        <span className="text-red-300">Retry needed</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/8">
                    <div
                      className={`h-full rounded-full transition-all ${
                        upload.status === 'error'
                          ? 'bg-red-400'
                          : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
