import { useRef, useState } from 'react'
import {
  completeUpload,
  initiateUpload,
  uploadPendingFile,
  uploadToStorage,
} from '../api/files'
import { useToast } from '../context/ToastContext'

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

    try {
      const { hostname } = new URL(uploadUrl)
      const isLocalFrontend =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'

      return (
        isLocalFrontend &&
        hostname.endsWith('.r2.cloudflarestorage.com')
      )
    } catch {
      return false
    }
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

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList)
    const ids = files.map((_, i) => Date.now() + i)

    setUploads(
      files.map((f, i) => ({
        id: ids[i],
        fileName: f.name,
        progress: 0,
        status: 'uploading',
      })),
    )

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const uploadId = ids[i]

      try {
        const initiateRes = await initiateUpload(
          file.name,
          file.type || 'application/octet-stream',
          file.size,
        )
        const { fileId, uploadUrl } = initiateRes.data
        let usedBackendFallback = shouldUseBackendUpload(uploadUrl)

        if (!usedBackendFallback) {
          try {
            await uploadToStorage(uploadUrl, file, (pct) => {
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
        addToast(`Failed to upload ${file.name}`, 'error')
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
    <div>
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
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors duration-150 ${
          isDragging
            ? 'border-blue-500 bg-blue-950/20'
            : 'border-gray-700 bg-gray-900 hover:border-gray-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="*/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="mb-3 text-3xl text-gray-500">
          {isDragging ? '↑' : '📁'}
        </div>
        <p className="text-gray-400">Drop files here or click to browse</p>
        <p className="mt-1 text-sm text-gray-600">Any file type supported</p>
      </div>

      {uploads.length > 0 ? (
        <div className="mt-4 space-y-3">
          {uploads.map((upload) => (
            <div key={upload.id}>
              <div className="flex items-center justify-between gap-4">
                <p className="max-w-xs truncate text-sm text-gray-300">
                  {upload.fileName}
                </p>
                <span className="text-xs">
                  {upload.status === 'uploading' ? (
                    <span className="text-gray-500">{upload.progress}%</span>
                  ) : upload.status === 'done' ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span className="text-red-400">✗ failed</span>
                  )}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
