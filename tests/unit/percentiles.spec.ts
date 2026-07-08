import { describe, expect, it } from 'vitest'
import { percentile } from '../../src/metrics/percentiles.js'

describe('percentile', () => {
  it('returns 0 for an empty array', () => {
    expect(percentile([], 95)).toBe(0)
  })

  it('returns the single value when the array has one element', () => {
    expect(percentile([42], 50)).toBe(42)
  })

  it('computes p50 (median) for a sorted array', () => {
    expect(percentile([10, 20, 30, 40, 50], 50)).toBe(30)
  })

  it('computes p100 as the max value', () => {
    expect(percentile([10, 20, 30, 40, 50], 100)).toBe(50)
  })
})
