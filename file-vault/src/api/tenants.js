import client from './client'

export const createDemoTenant = (name) =>
  client.post('/api/demo/tenants', name ? { name } : {})
