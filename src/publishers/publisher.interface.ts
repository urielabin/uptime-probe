import type { ReportContext } from '../reporters/report-context.js'

export interface Publisher {
  publish(context: ReportContext): Promise<void>
}
