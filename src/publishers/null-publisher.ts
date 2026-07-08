import type { Publisher } from './publisher.interface.js'
import type { ReportContext } from '../reporters/report-context.js'

/** Zero-cost default: no dashboard configured, publishing is a no-op. */
export class NullPublisher implements Publisher {
  async publish(_context: ReportContext): Promise<void> {
    // intentionally empty
  }
}
