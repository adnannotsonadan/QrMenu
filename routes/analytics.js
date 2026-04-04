import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const cafeId = req.session.cafeId;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const monthStart = new Date(todayStart);
    monthStart.setDate(1);

    const revenueResult = await pool.query(`
      SELECT
        SUM(CASE WHEN o.created_at >= $2 AND o.status = 'completed' THEN oi.price * oi.quantity ELSE 0 END) AS today,
        SUM(CASE WHEN o.created_at >= $3 AND o.status = 'completed' THEN oi.price * oi.quantity ELSE 0 END) AS this_week,
        SUM(CASE WHEN o.created_at >= $4 AND o.status = 'completed' THEN oi.price * oi.quantity ELSE 0 END) AS this_month,
        SUM(CASE WHEN o.status = 'completed' THEN oi.price * oi.quantity ELSE 0 END) AS all_time
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.cafe_id = $1
    `, [cafeId, todayStart, weekStart, monthStart]);

    const orderResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'preparing') AS preparing,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE created_at >= $2) AS today_total,
        COUNT(*) AS all_time_total
      FROM orders
      WHERE cafe_id = $1
    `, [cafeId, todayStart]);

    const bestsellersResult = await pool.query(`
      SELECT
        mi.name,
        mi.category,
        mi.image_url,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.price * oi.quantity) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.cafe_id = $1 AND o.status = 'completed'
      GROUP BY mi.id, mi.name, mi.category, mi.image_url
      ORDER BY total_sold DESC
      LIMIT 5
    `, [cafeId]);

    const hourlyResult = await pool.query(`
      SELECT EXTRACT(HOUR FROM created_at) AS hour, COUNT(*) AS count
      FROM orders
      WHERE cafe_id = $1 AND created_at >= $2
      GROUP BY hour
      ORDER BY hour
    `, [cafeId, todayStart]);

    const tableResult = await pool.query(`
      SELECT o.table_number, COUNT(*) AS order_count, SUM(oi.price * oi.quantity) AS revenue
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.cafe_id = $1 AND o.created_at >= $2 AND o.status = 'completed'
      GROUP BY o.table_number
      ORDER BY revenue DESC
    `, [cafeId, monthStart]);

    const recentResult = await pool.query(`
      SELECT o.id, o.table_number, o.status, o.created_at, o.whatsapp_number,
             SUM(oi.price * oi.quantity) AS total
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.cafe_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `, [cafeId]);

    res.json({
      revenue: revenueResult.rows[0] || {},
      orders: orderResult.rows[0] || {},
      bestsellers: bestsellersResult.rows,
      hourly: hourlyResult.rows,
      byTable: tableResult.rows,
      recent: recentResult.rows,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
