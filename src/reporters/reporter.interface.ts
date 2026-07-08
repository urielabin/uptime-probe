import type { ReportContext } from './report-context.js'

export interface Reporter {
  report(context: ReportContext): Promise<void> | void
}
