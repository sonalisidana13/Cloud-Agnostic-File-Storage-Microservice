import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
})

client.interceptors.request.use((config) => {
  const key = localStorage.getItem('apiKey')
  if (key) config.headers['X-API-Key'] = key
  return config
})

export default client
