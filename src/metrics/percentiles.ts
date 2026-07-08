export function percentile(sortedValues: readonly number[], p: number): number {
  if (sortedValues.length === 0) return 0
  const rank = (p / 100) * (sortedValues.length - 1)
  const lowerIndex = Math.floor(rank)
  const upperIndex = Math.ceil(rank)
  const lower = sortedValues[lowerIndex] ?? 0
  const upper = sortedValues[upperIndex] ?? lower
  const weight = rank - lowerIndex
  return lower + (upper - lower) * weight
}
