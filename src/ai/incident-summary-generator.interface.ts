import type { ProbeSummary } from '../metrics/types.js'
import type { ThresholdResult } from '../thresholds/threshold-evaluator.js'

export interface IncidentSummaryInput {
  readonly configName: string
  readonly summary: ProbeSummary
  readonly thresholdResult: ThresholdResult
}

export interface IncidentSummaryGenerator {
  generate(input: IncidentSummaryInput): Promise<string>
}
