import express from 'express';
import pool from '../db.js';
import { requireAuth, resolveCafeId } from '../middleware/auth.js';

const router = express.Router();

const CATEGORIES = [
  'Coffee', 'Tea', 'Juices & Shakes', 'Beverages',
  'Snacks', 'Mains', 'Desserts', 'Bakery', 'Other'
];

router.get('/', async (req, res) => {
  try {
    const cafeId = resolveCafeId(req);
    if (!cafeId) return res.status(400).json({ error: 'cafe_id required' });
    const result = await pool.query(
      'SELECT * FROM menu_items WHERE cafe_id = $1 ORDER BY category, name',
      [cafeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

router.get('/categories', (req, res) => {
  res.json(CATEGORIES);
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, price, description, available, image_url, category, is_trending } = req.body;
    if (!name || price === undefined) return res.status(400).json({ error: 'Name and price are required' });
    if (isNaN(price) || Number(price) <= 0) return res.status(400).json({ error: 'Price must be a positive number' });

    const result = await pool.query(
      `INSERT INTO menu_items (cafe_id, name, price, description, available, image_url, category, is_trending)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.session.cafeId, name, price, description || null, available !== false, image_url || null, category || 'Other', Boolean(is_trending)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, available, image_url, category, is_trending } = req.body;
    const result = await pool.query(
      `UPDATE menu_items
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           description = COALESCE($3, description),
           available = COALESCE($4, available),
           image_url = COALESCE($5, image_url),
           category = COALESCE($6, category),
           is_trending = COALESCE($7, is_trending)
       WHERE id = $8 AND cafe_id = $9
       RETURNING *`,
      [name, price, description, available, image_url, category, is_trending, id, req.session.cafeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Menu item not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM menu_items WHERE id = $1 AND cafe_id = $2 RETURNING *', [id, req.session.cafeId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;
