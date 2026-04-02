import express from 'express'
import cors from 'cors'
import './db.js'
import categoriesRouter from './routes/categories.js'
import entriesRouter from './routes/entries.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/categories', categoriesRouter)
app.use('/api/entries', entriesRouter)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))