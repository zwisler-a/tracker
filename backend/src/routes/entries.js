import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

const UPSERT = `
  INSERT INTO entries (date, slot, category_id) VALUES (?, ?, ?)
  ON CONFLICT(date, slot) DO UPDATE SET category_id = excluded.category_id
`

router.get('/', async (req, res, next) => {
  try {
    const { from, to } = req.query
    const rows = await db.all(
      'SELECT * FROM entries WHERE date(date) BETWEEN date(?) AND date(?) AND category_id IS NOT NULL',
      [from, to]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

router.put('/', async (req, res, next) => {
  try {
    const { date, slot, category_id } = req.body
    if (category_id == null) {
      await db.run('DELETE FROM entries WHERE date = ? AND slot = ?', [date, slot])
      res.json({ date, slot, category_id: null })
    } else {
      await db.run(UPSERT, [date, slot, category_id])
      res.json(await db.get('SELECT * FROM entries WHERE date = ? AND slot = ?', [date, slot]))
    }
  } catch (err) {
    next(err)
  }
})

router.put('/bulk', async (req, res, next) => {
  try {
    await db.run('BEGIN')
    for (const { date, slot, category_id } of req.body) {
      if (category_id == null) {
        await db.run('DELETE FROM entries WHERE date = ? AND slot = ?', [date, slot])
      } else {
        await db.run(UPSERT, [date, slot, category_id])
      }
    }
    await db.run('COMMIT')
    res.json({ ok: true })
  } catch (err) {
    await db.run('ROLLBACK').catch(() => {})
    next(err)
  }
})

export default router