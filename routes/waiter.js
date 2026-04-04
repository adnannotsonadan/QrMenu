import express from 'express';
import { requireAuth, resolveCafeId } from '../middleware/auth.js';

const router = express.Router();

const waiterCalls = {};
let nextId = 1;

function getCalls(cafeId) {
  if (!waiterCalls[cafeId]) waiterCalls[cafeId] = [];
  return waiterCalls[cafeId];
}

router.post('/', (req, res) => {
  const cafeId = resolveCafeId(req);
  const tableNumber = Number(req.body.table_number || 0);

  if (!cafeId || !tableNumber) {
    return res.status(400).json({ error: 'cafe_id and table_number are required' });
  }

  const calls = getCalls(cafeId);
  const existing = calls.find((call) => call.table_number === tableNumber && !call.dismissed);
  if (existing) {
    return res.status(409).json({ error: 'Waiter already called for this table' });
  }

  const call = {
    id: nextId++,
    table_number: tableNumber,
    created_at: new Date().toISOString(),
    dismissed: false,
  };

  calls.push(call);
  res.status(201).json(call);
});

router.get('/', requireAuth, (req, res) => {
  const calls = getCalls(req.session.cafeId).filter((call) => !call.dismissed);
  res.json(calls);
});

router.delete('/:id', requireAuth, (req, res) => {
  const calls = getCalls(req.session.cafeId);
  const target = calls.find((call) => call.id === Number(req.params.id));
  if (!target) return res.status(404).json({ error: 'Call not found' });
  target.dismissed = true;
  res.json({ message: 'Dismissed' });
});

export default router;
