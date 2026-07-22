import express from 'express'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createMcpServer } from './server.js'

// Stateless streamable-HTTP MCP endpoint: one server+transport per request,
// no session state kept between calls.
export function startMcpHttpServer(port) {
  const app = express()
  app.use(express.json())

  app.post('/mcp', async (req, res) => {
    const server = createMcpServer()
    try {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
      res.on('close', () => {
        transport.close()
        server.close()
      })
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (err) {
      console.error('Error handling MCP request:', err)
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null })
      }
    }
  })

  const methodNotAllowed = (req, res) => {
    res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null })
  }
  app.get('/mcp', methodNotAllowed)
  app.delete('/mcp', methodNotAllowed)

  app.listen(port, () => console.log(`MCP streamable-HTTP server listening on port ${port}`))
}
