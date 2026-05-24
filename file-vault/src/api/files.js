import axios from 'axios'
import client from './client'

export const initiateUpload = (fileName, contentType, sizeBytes) =>
  client.post('/api/files/initiate', { fileName, contentType, sizeBytes })

export const uploadToStorage = (uploadUrl, file, onProgress) =>
  axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (e) => onProgress(Math.round((e.loaded * 100) / e.total)),
  })

export const completeUpload = (fileId) =>
  client.post(`/api/files/${fileId}/complete`)

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
