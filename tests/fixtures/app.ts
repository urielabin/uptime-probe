import express, { type Express } from 'express'

/** A small real HTTP app used as a monitoring target in tests — not mocked, an actual server handling real requests. */
export function createFixtureApp(): Express {
  const app = express()
  app.use(express.json())

  const receivedWebhooks: unknown[] = []

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true })
  })

  app.get('/slow', (_req, res) => {
    setTimeout(() => res.status(200).json({ ok: true }), 300)
  })

  app.get('/down', (_req, res) => {
    res.status(500).json({ ok: false })
  })

  app.get('/', (_req, res) => {
    res.status(200).type('html').send('<html><body><h1>Welcome</h1></body></html>')
  })

  app.post('/webhook', (req, res) => {
    receivedWebhooks.push(req.body)
    res.status(200).json({ received: true })
  })

  app.get('/webhook/received', (_req, res) => {
    res.status(200).json(receivedWebhooks)
  })

  return app
}
