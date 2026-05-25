import client from './client'

export const createDemoTenant = (name) =>
  client.post('/api/demo/tenants', name ? { name } : {})

export const listDemoTenants = () =>
  client.get('/api/demo/tenants')

export const listDemoTenantMetrics = () =>
  client.get('/api/demo/tenants/metrics')
