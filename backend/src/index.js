import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import './db.js'
import { requireAuth } from './middleware/auth.js'
import authRouter from './routes/auth.js'
import categoriesRouter from './routes/categories.js'
import entriesRouter from './routes/entries.js'

const app = express()
app.use(cors())
app.use(express.json())

// Public
app.use('/api/auth', authRouter)

// Protected
app.use('/api/categories', requireAuth, categoriesRouter)
app.use('/api/entries',    requireAuth, entriesRouter)

// Serve frontend static files in production (single-container deployment)
const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
if (existsSync(publicDir)) {
  app.use(express.static(publicDir))
  app.get('*', (req, res) => res.sendFile(join(publicDir, 'index.html')))
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Listening on port ${PORT}`))