import type { IncidentSummaryGenerator } from './incident-summary-generator.interface.js'
import { ClaudeIncidentSummaryGenerator } from './claude-incident-summary-generator.js'
import { TemplatedIncidentSummaryGenerator } from './templated-incident-summary-generator.js'

export function createIncidentSummaryGenerator(): IncidentSummaryGenerator {
  const apiKey = process.env['ANTHROPIC_API_KEY']
  return apiKey ? new ClaudeIncidentSummaryGenerator(apiKey) : new TemplatedIncidentSummaryGenerator()
}
