import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDashboardPublisher } from '../../src/publishers/dashboard-publisher-factory.js'
import { HttpDashboardPublisher } from '../../src/publishers/http-dashboard-publisher.js'
import { NullPublisher } from '../../src/publishers/null-publisher.js'

describe('createDashboardPublisher', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns a NullPublisher when neither env var is set', () => {
    vi.stubEnv('DASHBOARD_API_URL', '')
    vi.stubEnv('DASHBOARD_API_KEY', '')
    expect(createDashboardPublisher()).toBeInstanceOf(NullPublisher)
  })

  it('returns a NullPublisher when only the URL is set', () => {
    vi.stubEnv('DASHBOARD_API_URL', 'http://localhost:4000/dashboard/ingest')
    vi.stubEnv('DASHBOARD_API_KEY', '')
    expect(createDashboardPublisher()).toBeInstanceOf(NullPublisher)
  })

  it('returns a NullPublisher when only the API key is set', () => {
    vi.stubEnv('DASHBOARD_API_URL', '')
    vi.stubEnv('DASHBOARD_API_KEY', 'test-key')
    expect(createDashboardPublisher()).toBeInstanceOf(NullPublisher)
  })

  it('returns an HttpDashboardPublisher when both env vars are set', () => {
    vi.stubEnv('DASHBOARD_API_URL', 'http://localhost:4000/dashboard/ingest')
    vi.stubEnv('DASHBOARD_API_KEY', 'test-key')
    expect(createDashboardPublisher()).toBeInstanceOf(HttpDashboardPublisher)
  })
})
