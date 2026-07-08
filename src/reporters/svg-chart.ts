import type { CheckSummary } from '../metrics/types.js'

const WIDTH = 320
const HEIGHT = 60
const PADDING = 6

/** Renders a dependency-free SVG sparkline comparing early vs late p95 latency for one check. */
export function renderLatencySparkline(check: CheckSummary): string {
  const values = [check.earlyP95Ms, check.lateP95Ms]
  const max = Math.max(1, ...values)
  const plotWidth = WIDTH - PADDING * 2
  const plotHeight = HEIGHT - PADDING * 2
  const stepX = plotWidth

  const points = values.map((value, i) => {
    const x = PADDING + i * stepX
    const y = PADDING + plotHeight - (value / max) * plotHeight
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const drifted = check.earlyP95Ms > 0 && check.lateP95Ms > check.earlyP95Ms * 1.2
  const color = drifted ? '#ff3b30' : '#2997ff'

  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" height="${HEIGHT}" role="img" aria-label="${check.checkName} latency trend">
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#0a0a0a" rx="8" />
  <polyline fill="none" stroke="${color}" stroke-width="2" points="${points.join(' ')}" />
  <circle cx="${points[0]?.split(',')[0]}" cy="${points[0]?.split(',')[1]}" r="3" fill="${color}" />
  <circle cx="${points[1]?.split(',')[0]}" cy="${points[1]?.split(',')[1]}" r="3" fill="${color}" />
</svg>`
}
