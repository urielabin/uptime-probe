import { createFixtureApp } from './app.js'

const port = Number(process.env['PORT'] ?? 4000)
createFixtureApp().listen(port, () => {
  console.log(`Fixture server listening on http://localhost:${port}`)
})
