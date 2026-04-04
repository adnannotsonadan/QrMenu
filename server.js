import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import { authSessionMiddleware, requireAuth } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import menuRouter from './routes/menu.js';
import ordersRouter from './routes/orders.js';
import tablesRouter from './routes/tables.js';
import analyticsRouter from './routes/analytics.js';
import themeRouter from './routes/theme.js';
import waiterRouter from './routes/waiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.locals.defaultCafeId = db.defaultCafeId;
app.locals.defaultCafeName = db.defaultCafeName;
app.locals.defaultCafeEmail = db.defaultCafeEmail;

app.use(express.json());
app.use(authSessionMiddleware);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/theme', themeRouter);
app.use('/api/waiter', waiterRouter);

app.get('/login', (req, res) => {
  if (req.session.cafeId) return res.redirect('/dashboard');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  if (req.session.cafeId) return res.redirect('/dashboard');
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/scan', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scan.html'));
});

app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'menu.html'));
});

app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/cashier', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cashier.html'));
});

app.get('/tables', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tables.html'));
});

app.get('/analytics', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

app.get('/', (req, res) => {
  if (req.session.cafeId) return res.redirect('/dashboard');
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`QR Cafe SaaS is running on http://localhost:${PORT}`);
  console.log(`Default migrated cafe: ${app.locals.defaultCafeName} (${app.locals.defaultCafeEmail})`);
});

export default app;
