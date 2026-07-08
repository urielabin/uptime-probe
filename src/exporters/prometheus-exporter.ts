import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Exporter } from './exporter.interface.js'
import type { ReportContext } from '../reporters/report-context.js'
import { formatPrometheusText } from './prometheus.js'

export class PrometheusExporter implements Exporter {
  constructor(private readonly outputPath: string) {}

  async export(context: ReportContext): Promise<void> {
    await mkdir(dirname(this.outputPath), { recursive: true })
    await writeFile(this.outputPath, formatPrometheusText(context), 'utf-8')
  }
}
