import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { db } from '../db.js'

const json = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] })

export function createMcpServer() {
  const server = new McpServer({ name: 'track', version: '1.0.0' })

  server.registerTool(
    'list_categories',
    {
      title: 'List categories',
      description: 'List all tracking categories with their id, name and color.',
      inputSchema: {},
    },
    async () => json(await db.all('SELECT * FROM categories ORDER BY name'))
  )

  server.registerTool(
    'create_category',
    {
      title: 'Create category',
      description: 'Create a new tracking category.',
      inputSchema: { name: z.string(), color: z.string() },
    },
    async ({ name, color }) => {
      const { lastID } = await db.run('INSERT INTO categories (name, color) VALUES (?, ?)', name, color)
      return json(await db.get('SELECT * FROM categories WHERE id = ?', lastID))
    }
  )

  server.registerTool(
    'update_category',
    {
      title: 'Update category',
      description: 'Rename a category or change its color.',
      inputSchema: { id: z.number().int(), name: z.string(), color: z.string() },
    },
    async ({ id, name, color }) => {
      await db.run('UPDATE categories SET name = ?, color = ? WHERE id = ?', name, color, id)
      return json(await db.get('SELECT * FROM categories WHERE id = ?', id))
    }
  )

  server.registerTool(
    'delete_category',
    {
      title: 'Delete category',
      description: 'Delete a category. Entries referencing it are kept with category_id set to null.',
      inputSchema: { id: z.number().int() },
    },
    async ({ id }) => {
      await db.run('DELETE FROM categories WHERE id = ?', id)
      return json({ ok: true })
    }
  )

  server.registerTool(
    'get_entries',
    {
      title: 'Get time entries',
      description: 'Get all painted 30-minute time slots between two dates (inclusive), joined with category name/color. Slot 0-47 maps to 00:00-23:30.',
      inputSchema: { from: z.string().describe('YYYY-MM-DD'), to: z.string().describe('YYYY-MM-DD') },
    },
    async ({ from, to }) => json(await db.all(
      `SELECT e.date, e.slot, e.category_id, c.name AS category_name, c.color AS category_color
       FROM entries e LEFT JOIN categories c ON c.id = e.category_id
       WHERE date(e.date) BETWEEN date(?) AND date(?) AND e.category_id IS NOT NULL
       ORDER BY e.date, e.slot`,
      [from, to]
    ))
  )

  const UPSERT_ENTRY = `
    INSERT INTO entries (date, slot, category_id) VALUES (?, ?, ?)
    ON CONFLICT(date, slot) DO UPDATE SET category_id = excluded.category_id
  `

  server.registerTool(
    'set_entry',
    {
      title: 'Set a time slot',
      description: 'Assign a category to one 30-minute slot on a date, or clear it by omitting category_id.',
      inputSchema: {
        date: z.string().describe('YYYY-MM-DD'),
        slot: z.number().int().min(0).max(47),
        category_id: z.number().int().nullable().optional(),
      },
    },
    async ({ date, slot, category_id }) => {
      if (category_id == null) {
        await db.run('DELETE FROM entries WHERE date = ? AND slot = ?', [date, slot])
        return json({ date, slot, category_id: null })
      }
      await db.run(UPSERT_ENTRY, [date, slot, category_id])
      return json(await db.get('SELECT * FROM entries WHERE date = ? AND slot = ?', [date, slot]))
    }
  )

  server.registerTool(
    'set_entries_bulk',
    {
      title: 'Set multiple time slots',
      description: 'Assign or clear categories for many 30-minute slots at once.',
      inputSchema: {
        entries: z.array(z.object({
          date: z.string().describe('YYYY-MM-DD'),
          slot: z.number().int().min(0).max(47),
          category_id: z.number().int().nullable().optional(),
        })),
      },
    },
    async ({ entries }) => {
      await db.run('BEGIN')
      try {
        for (const { date, slot, category_id } of entries) {
          if (category_id == null) {
            await db.run('DELETE FROM entries WHERE date = ? AND slot = ?', [date, slot])
          } else {
            await db.run(UPSERT_ENTRY, [date, slot, category_id])
          }
        }
        await db.run('COMMIT')
      } catch (err) {
        await db.run('ROLLBACK').catch(() => {})
        throw err
      }
      return json({ ok: true, count: entries.length })
    }
  )

  server.registerTool(
    'get_moods',
    {
      title: 'Get daily moods',
      description: 'Get the recorded mood value for each date in a range (inclusive).',
      inputSchema: { from: z.string().describe('YYYY-MM-DD'), to: z.string().describe('YYYY-MM-DD') },
    },
    async ({ from, to }) => json(await db.all(
      'SELECT date, mood FROM moods WHERE date BETWEEN date(?) AND date(?) ORDER BY date',
      [from, to]
    ))
  )

  server.registerTool(
    'set_mood',
    {
      title: 'Set a day\'s mood',
      description: 'Set (or clear, by omitting mood) the mood value for a date.',
      inputSchema: { date: z.string().describe('YYYY-MM-DD'), mood: z.number().int().nullable().optional() },
    },
    async ({ date, mood }) => {
      if (mood == null) {
        await db.run('DELETE FROM moods WHERE date = ?', [date])
        return json({ date, deleted: true })
      }
      await db.run(
        'INSERT INTO moods(date, mood) VALUES(?, ?) ON CONFLICT(date) DO UPDATE SET mood=excluded.mood',
        [date, mood]
      )
      return json({ date, mood })
    }
  )

  return server
}
