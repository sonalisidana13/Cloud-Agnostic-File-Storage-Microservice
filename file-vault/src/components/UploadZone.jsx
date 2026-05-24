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
          accept={ACCEPTED_FILE_TYPES}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="mb-3 text-3xl text-gray-500">
          {isDragging ? '↑' : '📁'}
        </div>
        <p className="text-gray-400">Drop files here or click to browse</p>
        <p className="mt-1 text-sm text-gray-600">
          {SUPPORTED_FILE_TYPES_MESSAGE}, max 2 MB per file
        </p>
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
