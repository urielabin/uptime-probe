import { describe, expect, it, vi } from 'vitest'
import { ProbeCollector } from '../../src/metrics/probe-collector.js'
import type { ProbeOutcome } from '../../src/checks/strategies/check-strategy.interface.js'

function makeOutcome(overrides: Partial<ProbeOutcome> = {}): ProbeOutcome {
  return {
    checkName: 'health',
    timestampMs: Date.now(),
    latencyMs: 100,
    success: true,
    statusCode: 200,
    ...overrides,
  }
}

describe('ProbeCollector', () => {
  it('summarizes zero results without dividing by zero', () => {
    const collector = new ProbeCollector()
    const summary = collector.summarize()
    expect(summary.overallUptimePercent).toBe(100)
    expect(summary.checks).toHaveLength(0)
  })

  it('computes uptime percent per check', () => {
    const collector = new ProbeCollector()
    collector.record(makeOutcome({ success: true }))
    collector.record(makeOutcome({ success: true }))
    collector.record(makeOutcome({ success: false }))

    const summary = collector.summarize()
    expect(summary.checks[0]?.uptimePercent).toBeCloseTo((2 / 3) * 100)
  })

  it('tracks the current and max consecutive-failure streaks', () => {
    const collector = new ProbeCollector()
    for (const success of [true, false, false, false, true, false]) {
      collector.record(makeOutcome({ success }))
    }

    const summary = collector.summarize()
    expect(summary.checks[0]?.maxConsecutiveFailures).toBe(3)
    expect(summary.checks[0]?.consecutiveFailures).toBe(1)
  })

  it('emits a result event per recorded outcome', () => {
    const collector = new ProbeCollector()
    const listener = vi.fn()
    collector.on('result', listener)

    collector.record(makeOutcome())
    collector.record(makeOutcome())

    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('groups results by check name independently', () => {
    const collector = new ProbeCollector()
    collector.record(makeOutcome({ checkName: 'health', success: true }))
    collector.record(makeOutcome({ checkName: 'checkout', success: false }))

    const summary = collector.summarize()
    expect(summary.checks).toHaveLength(2)
    const checkout = summary.checks.find((c) => c.checkName === 'checkout')
    expect(checkout?.uptimePercent).toBe(0)
  })
})
