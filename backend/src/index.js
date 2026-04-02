import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import './db.js'
import categoriesRouter from './routes/categories.js'
import entriesRouter from './routes/entries.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/categories', categoriesRouter)
app.use('/api/entries', entriesRouter)

// Serve frontend static files in production (single-container deployment)
const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
if (existsSync(publicDir)) {
  app.use(express.static(publicDir))
  app.get('*', (req, res) => res.sendFile(join(publicDir, 'index.html')))
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
