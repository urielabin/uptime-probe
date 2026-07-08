import { readFile } from 'node:fs/promises'
import { parse } from 'yaml'
import { checkConfigSchema, type CheckConfig } from './check-schema.js'

export async function loadCheckConfig(filePath: string): Promise<CheckConfig> {
  const raw = await readFile(filePath, 'utf-8')
  const parsed = parse(raw)
  return checkConfigSchema.parse(parsed)
}
