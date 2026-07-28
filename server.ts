// server.ts
import { createServer } from "http"
import { parse }        from "url"
import next             from "next"
import { initIO } from "./lib/socket"
import { startWorker }  from "./lib/worker"

const dev  = process.env.NODE_ENV !== "production"
const app  = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // attach Socket.io
  initIO(httpServer)

  // start BullMQ worker
  startWorker()

  httpServer.listen(3000, () => {
    console.log(`Revix running on port 3000`)
  })
})