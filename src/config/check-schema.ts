import { z } from 'zod'

const baseCheckSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  maxLatencyMs: z.number().positive().optional(),
  timeoutMs: z.number().positive().default(5000),
})

const httpCheckSchema = baseCheckSchema.extend({
  type: z.literal('http'),
  method: z.enum(['GET', 'POST', 'HEAD']).default('GET'),
  headers: z.record(z.string()).optional(),
  expectStatus: z.number().int().default(200),
  bodyContains: z.string().optional(),
})

const browserCheckSchema = baseCheckSchema.extend({
  type: z.literal('browser'),
  expectText: z.string(),
  timeoutMs: z.number().positive().default(15000),
})

export const checkSchema = z.discriminatedUnion('type', [httpCheckSchema, browserCheckSchema])

const thresholdsSchema = z.object({
  minUptimePercent: z.number().min(0).max(100).optional(),
  maxLatencyP95Ms: z.number().positive().optional(),
  maxConsecutiveFailures: z.number().int().positive().optional(),
})

const alertingSchema = z.object({
  webhookUrl: z.string().url().optional(),
})

export const checkConfigSchema = z.object({
  name: z.string(),
  checks: z.array(checkSchema).min(1),
  intervalSeconds: z.number().positive().default(60),
  thresholds: thresholdsSchema.optional(),
  alerting: alertingSchema.optional(),
})

export type HttpCheck = z.infer<typeof httpCheckSchema>
export type BrowserCheck = z.infer<typeof browserCheckSchema>
export type Check = z.infer<typeof checkSchema>
export type Thresholds = z.infer<typeof thresholdsSchema>
export type Alerting = z.infer<typeof alertingSchema>
export type CheckConfig = z.infer<typeof checkConfigSchema>
