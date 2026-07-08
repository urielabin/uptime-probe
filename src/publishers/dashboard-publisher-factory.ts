import type { Publisher } from './publisher.interface.js'
import { HttpDashboardPublisher } from './http-dashboard-publisher.js'
import { NullPublisher } from './null-publisher.js'

export function createDashboardPublisher(): Publisher {
  const apiUrl = process.env['DASHBOARD_API_URL']
  const apiKey = process.env['DASHBOARD_API_KEY']
  return apiUrl && apiKey ? new HttpDashboardPublisher(apiUrl, apiKey) : new NullPublisher()
}
