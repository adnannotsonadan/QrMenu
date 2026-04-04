import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(derived).toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, hash] = storedHash.split(':');
  const derived = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived));
}
