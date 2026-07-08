import type { IncidentSummaryGenerator, IncidentSummaryInput } from './incident-summary-generator.interface.js'
import { TemplatedIncidentSummaryGenerator } from './templated-incident-summary-generator.js'

/**
 * Optional enhancement layer: if ANTHROPIC_API_KEY is set, asks Claude to
 * write a plain-English incident summary from the probe results. Falls back
 * to the templated generator on any failure, so a flaky/misconfigured key
 * never breaks a report.
 */
export class ClaudeIncidentSummaryGenerator implements IncidentSummaryGenerator {
  private readonly fallback = new TemplatedIncidentSummaryGenerator()

  constructor(private readonly apiKey: string) {}

  async generate(input: IncidentSummaryInput): Promise<string> {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey: this.apiKey })

      const message = await client.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `You are analyzing synthetic-monitoring probe results. Write a 3-4 sentence plain-English incident summary for an on-call engineer, calling out anything concerning (failure streaks, latency drift, threshold breaches). Be specific with the numbers given.\n\n${JSON.stringify(input, null, 2)}`,
          },
        ],
      })

      const textBlock = message.content.find((block) => block.type === 'text')
      return textBlock && 'text' in textBlock ? textBlock.text.trim() : await this.fallback.generate(input)
    } catch {
      return this.fallback.generate(input)
    }
  }
}
