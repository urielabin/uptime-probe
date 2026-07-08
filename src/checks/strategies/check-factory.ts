import type { Check } from '../../config/check-schema.js'
import type { CheckStrategy } from './check-strategy.interface.js'
import { HttpCheckStrategy } from './http-check-strategy.js'
import { BrowserCheckStrategy } from './browser-check-strategy.js'

export function createCheckStrategy(check: Check): CheckStrategy {
  switch (check.type) {
    case 'http':
      return new HttpCheckStrategy(check)
    case 'browser':
      return new BrowserCheckStrategy(check)
  }
}
