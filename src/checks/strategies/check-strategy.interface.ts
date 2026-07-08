export interface ProbeOutcome {
  readonly checkName: string
  readonly timestampMs: number
  readonly latencyMs: number
  readonly success: boolean
  readonly statusCode: number | null
  readonly error?: string
}

export interface CheckStrategy {
  run(): Promise<ProbeOutcome>
}
