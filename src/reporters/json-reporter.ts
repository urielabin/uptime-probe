import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Reporter } from './reporter.interface.js'
import type { ReportContext } from './report-context.js'

export class JsonReporter implements Reporter {
  constructor(private readonly outputPath: string) {}

  async report(context: ReportContext): Promise<void> {
    await mkdir(dirname(this.outputPath), { recursive: true })
    await writeFile(this.outputPath, JSON.stringify(context, null, 2), 'utf-8')
  }
}
