import axios from 'axios'
import client from './client'

export const initiateUpload = (fileName, contentType, sizeBytes) =>
  client.post('/api/files/initiate', { fileName, contentType, sizeBytes })

export const uploadToStorage = (uploadUrl, file, contentType, onProgress) =>
  axios.put(uploadUrl, file, {
    headers: { 'Content-Type': contentType },
    onUploadProgress: (e) => onProgress(Math.round((e.loaded * 100) / e.total)),
  })

export const completeUpload = (fileId) =>
  client.post(`/api/files/${fileId}/complete`)

export const uploadPendingFile = (fileId, file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)

  return client.post(`/api/files/${fileId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress(Math.round((e.loaded * 100) / e.total)),
  })
}

export const listFiles = () =>
  client.get('/api/files')

export const getDownloadUrl = (fileId) =>
  client.get(`/api/files/${fileId}/download-url`)

export const deleteFile = (fileId) =>
  client.delete(`/api/files/${fileId}`)

export const getMetrics = () =>
  client.get('/api/metrics')

export const healthCheck = () =>
  client.get('/api/health')
