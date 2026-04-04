import express from 'express';
import pool from '../db.js';
import { requireAuth, resolveCafeId } from '../middleware/auth.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const cafeId = resolveCafeId(req);
    const { table_number, items, whatsapp_number } = req.body;

    if (!cafeId) return res.status(400).json({ error: 'cafe_id is required' });
    if (!table_number || !items || items.length === 0) {
      return res.status(400).json({ error: 'Table number and items are required' });
    }
    if (!whatsapp_number || !/^\d{10}$/.test(whatsapp_number)) {
      return res.status(400).json({ error: 'A valid 10-digit WhatsApp number is required' });
    }
    if (items.some((item) => !item.quantity || item.quantity < 1 || !Number.isInteger(item.quantity))) {
      return res.status(400).json({ error: 'Each item must have a quantity of at least 1' });
    }

    const active = await client.query(
      "SELECT id FROM orders WHERE cafe_id = $1 AND table_number = $2 AND status IN ('pending', 'preparing')",
      [cafeId, table_number]
    );
    if (active.rows.length > 0) {
      return res.status(409).json({ error: 'This table already has an active order' });
    }

    await client.query('BEGIN');
    const tableResult = await client.query('SELECT id FROM tables WHERE cafe_id = $1 AND number = $2', [cafeId, table_number]);
    const tableId = tableResult.rows[0]?.id || null;

    const orderResult = await client.query(
      'INSERT INTO orders (cafe_id, table_id, table_number, status, whatsapp_number) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [cafeId, tableId, table_number, 'pending', whatsapp_number]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.id, item.quantity, item.price]
      );
    }

    await client.query('COMMIT');
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.status(201).json({ ...order, items, total_price: totalPrice });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.*,
        json_agg(
          json_build_object(
            'id', oi.menu_item_id,
            'name', mi.name,
            'price', oi.price,
            'quantity', oi.quantity
          )
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.cafe_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.session.cafeId]);

    const orders = result.rows.map((order) => {
      const safeItems = (order.items || []).filter((item) => item && item.id !== null);
      const totalPrice = safeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return { ...order, total_price: totalPrice, items: safeItems };
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status must be pending, preparing, or completed' });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND cafe_id = $3 RETURNING *',
      [status, id, req.session.cafeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

    const result = await client.query(
      'DELETE FROM orders WHERE id = $1 AND cafe_id = $2 RETURNING *',
      [id, req.session.cafeId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Order deleted' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  } finally {
    client.release();
  }
});

export default router;
