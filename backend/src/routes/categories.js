import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  res.json(await db.all('SELECT * FROM categories ORDER BY name'))
})

router.post('/', async (req, res) => {
  const { name, color } = req.body
  const { lastID } = await db.run('INSERT INTO categories (name, color) VALUES (?, ?)', name, color)
  res.json(await db.get('SELECT * FROM categories WHERE id = ?', lastID))
})

router.put('/:id', async (req, res) => {
  const { name, color } = req.body
  await db.run('UPDATE categories SET name = ?, color = ? WHERE id = ?', name, color, req.params.id)
  res.json(await db.get('SELECT * FROM categories WHERE id = ?', req.params.id))
})

router.delete('/:id', async (req, res) => {
  await db.run('DELETE FROM categories WHERE id = ?', req.params.id)
  res.json({ ok: true })
})

export default router