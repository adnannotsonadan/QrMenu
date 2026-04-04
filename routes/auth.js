import express from 'express';
import pool from '../db.js';
import { requireGuest, setSession, clearSession } from '../middleware/auth.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const router = express.Router();

router.post('/signup', requireGuest, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await pool.query('SELECT id FROM cafes WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO cafes (name, email, password_hash, plan)
       VALUES ($1, $2, $3, 'starter')
       RETURNING id, name, email`,
      [name.trim(), email.trim().toLowerCase(), passwordHash]
    );
    const cafe = result.rows[0];

    for (let tableNumber = 1; tableNumber <= 5; tableNumber += 1) {
      await pool.query(
        'INSERT INTO tables (cafe_id, number, label) VALUES ($1, $2, $3)',
        [cafe.id, tableNumber, `Table ${tableNumber}`]
      );
    }

    await pool.query('INSERT INTO themes (cafe_id) VALUES ($1) ON CONFLICT (cafe_id) DO NOTHING', [cafe.id]);
    setSession(res, { cafeId: cafe.id, cafeName: cafe.name, email: cafe.email });
    res.status(201).json({ message: 'Signup successful', cafe });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', requireGuest, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT id, name, email, password_hash FROM cafes WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const cafe = result.rows[0];
    const valid = await verifyPassword(password, cafe.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    setSession(res, { cafeId: cafe.id, cafeName: cafe.name, email: cafe.email });
    res.json({ message: 'Login successful', cafe: { id: cafe.id, name: cafe.name, email: cafe.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ message: 'Logged out' });
});

router.get('/me', (req, res) => {
  if (!req.session.cafeId) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ cafeId: req.session.cafeId, cafeName: req.session.cafeName, email: req.session.email });
});

router.get('/default', (req, res) => {
  res.json({
    cafeId: req.app.locals.defaultCafeId,
    cafeName: req.app.locals.defaultCafeName,
    email: req.app.locals.defaultCafeEmail,
  });
});

export default router;
