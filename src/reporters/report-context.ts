import type { ProbeSummary } from '../metrics/types.js'
import type { ThresholdResult } from '../thresholds/threshold-evaluator.js'

export interface ReportContext {
  readonly configName: string
  readonly summary: ProbeSummary
  readonly thresholdResult: ThresholdResult
  readonly narrative: string
}
