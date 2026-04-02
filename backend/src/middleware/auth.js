import jwt from 'jsonwebtoken'

const PASSWORD = process.env.AUTH_PASSWORD
const SECRET   = process.env.JWT_SECRET || PASSWORD || 'dev-secret'

export function requireAuth(req, res, next) {
  // Auth disabled — allow all requests
  if (!PASSWORD) return next()

  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  try {
    jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}