import { Router } from 'express'
import jwt from 'jsonwebtoken'

const router = Router()
const PASSWORD = process.env.AUTH_PASSWORD
const SECRET   = process.env.JWT_SECRET || PASSWORD || 'dev-secret'

router.post('/login', (req, res) => {
  // Auth disabled — let the frontend through without a token
  if (!PASSWORD) return res.json({ token: null })

  if (req.body.password !== PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  const token = jwt.sign({}, SECRET, { expiresIn: '30d' })
  res.json({ token })
})

export default router