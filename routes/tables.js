import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import QRCode from 'qrcode';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tables WHERE cafe_id = $1 ORDER BY number',
      [req.session.cafeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Tables fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { number, label } = req.body;
    if (!number) return res.status(400).json({ error: 'Table number required' });

    const existing = await pool.query('SELECT id FROM tables WHERE cafe_id = $1 AND number = $2', [req.session.cafeId, number]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Table number already exists' });
    }

    const result = await pool.query(
      'INSERT INTO tables (cafe_id, number, label) VALUES ($1, $2, $3) RETURNING *',
      [req.session.cafeId, number, label || `Table ${number}`]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add table error:', error);
    res.status(500).json({ error: 'Failed to add table' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { label } = req.body;
    const result = await pool.query(
      'UPDATE tables SET label = $1 WHERE id = $2 AND cafe_id = $3 RETURNING *',
      [label, req.params.id, req.session.cafeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Table not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tables WHERE id = $1 AND cafe_id = $2 RETURNING *',
      [req.params.id, req.session.cafeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Table not found' });
    res.json({ message: 'Table deleted' });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

router.get('/:id/qr', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tables WHERE id = $1 AND cafe_id = $2',
      [req.params.id, req.session.cafeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Table not found' });

    const table = result.rows[0];
    const url = `${req.protocol}://${req.get('host')}/menu?cafe_id=${req.session.cafeId}&table=${table.number}`;
    const qr = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    res.json({ qr, url, table });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR' });
  }
});

export default router;
