import { describe, expect, it } from 'vitest'
import { checkConfigSchema } from '../../src/config/check-schema.js'

describe('checkConfigSchema', () => {
  it('accepts a minimal valid http check config', () => {
    const result = checkConfigSchema.safeParse({
      name: 'smoke',
      checks: [{ type: 'http', name: 'health', url: 'http://localhost:4000/health' }],
    })
    expect(result.success).toBe(true)
  })

  it('accepts a browser check', () => {
    const result = checkConfigSchema.safeParse({
      name: 'smoke',
      checks: [{ type: 'browser', name: 'home', url: 'http://localhost:4000/', expectText: 'Welcome' }],
    })
    expect(result.success).toBe(true)
  })

  it('defaults http method to GET and expectStatus to 200', () => {
    const result = checkConfigSchema.parse({
      name: 'smoke',
      checks: [{ type: 'http', name: 'health', url: 'http://localhost:4000/health' }],
    })
    const check = result.checks[0]
    expect(check?.type === 'http' && check.method).toBe('GET')
    expect(check?.type === 'http' && check.expectStatus).toBe(200)
  })

  it('rejects a non-URL check target', () => {
    const result = checkConfigSchema.safeParse({
      name: 'smoke',
      checks: [{ type: 'http', name: 'health', url: 'not-a-url' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty checks array', () => {
    const result = checkConfigSchema.safeParse({ name: 'smoke', checks: [] })
    expect(result.success).toBe(false)
  })

  it('rejects a browser check missing expectText', () => {
    const result = checkConfigSchema.safeParse({
      name: 'smoke',
      checks: [{ type: 'browser', name: 'home', url: 'http://localhost:4000/' }],
    })
    expect(result.success).toBe(false)
  })
})
