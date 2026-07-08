import type { ReportContext } from '../reporters/report-context.js'

export interface Exporter {
  export(context: ReportContext): Promise<void> | void
}
