import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { from, to } = req.query
  const rows = await db.all(
    `SELECT date, mood FROM moods WHERE date BETWEEN date(?) AND date(?)`,
    [from, to]
  )
  res.json(rows)
})

router.put('/', async (req, res) => {
  const { date, mood } = req.body
  if (mood == null) {
    await db.run(`DELETE FROM moods WHERE date = ?`, [date])
    return res.json({ deleted: true })
  }
  await db.run(
    `INSERT INTO moods(date, mood) VALUES(?, ?) ON CONFLICT(date) DO UPDATE SET mood=excluded.mood`,
    [date, mood]
  )
  res.json({ date, mood })
})

export default router