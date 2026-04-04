import express from 'express';
import pool from '../db.js';
import { requireAuth, resolveCafeId, setSession } from '../middleware/auth.js';

const router = express.Router();

const DEFAULT = {
  brandColor: '#c8773a',
  bgColor: '#f7f4f0',
  surfaceColor: '#ffffff',
  textColor: '#1a1714',
  fontFamily: 'DM Sans',
  cafeName: 'Our Cafe',
  logoUrl: '',
};

router.get('/', async (req, res) => {
  try {
    const cafeId = resolveCafeId(req);
    if (!cafeId) return res.json(DEFAULT);

    const themeResult = await pool.query('SELECT * FROM themes WHERE cafe_id = $1', [cafeId]);
    const cafeResult = await pool.query('SELECT name FROM cafes WHERE id = $1', [cafeId]);
    if (themeResult.rows.length === 0) {
      return res.json({ ...DEFAULT, cafeName: cafeResult.rows[0]?.name || DEFAULT.cafeName });
    }

    const theme = themeResult.rows[0];
    res.json({
      brandColor: theme.brand_color,
      bgColor: theme.bg_color,
      surfaceColor: theme.surface_color,
      textColor: theme.text_color,
      fontFamily: theme.font_family,
      cafeName: cafeResult.rows[0]?.name || DEFAULT.cafeName,
      logoUrl: theme.logo_url || '',
    });
  } catch (error) {
    console.error('Theme fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch theme' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { brandColor, bgColor, surfaceColor, textColor, fontFamily, logoUrl, cafeName } = req.body;

    await pool.query(`
      INSERT INTO themes (cafe_id, brand_color, bg_color, surface_color, text_color, font_family, logo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (cafe_id) DO UPDATE SET
        brand_color = EXCLUDED.brand_color,
        bg_color = EXCLUDED.bg_color,
        surface_color = EXCLUDED.surface_color,
        text_color = EXCLUDED.text_color,
        font_family = EXCLUDED.font_family,
        logo_url = EXCLUDED.logo_url,
        updated_at = CURRENT_TIMESTAMP
    `, [
      req.session.cafeId,
      brandColor || DEFAULT.brandColor,
      bgColor || DEFAULT.bgColor,
      surfaceColor || DEFAULT.surfaceColor,
      textColor || DEFAULT.textColor,
      fontFamily || DEFAULT.fontFamily,
      logoUrl || '',
    ]);

    let nextCafeName = req.session.cafeName || DEFAULT.cafeName;
    if (cafeName) {
      nextCafeName = cafeName.trim();
      await pool.query('UPDATE cafes SET name = $1 WHERE id = $2', [nextCafeName, req.session.cafeId]);
    }

    setSession(res, { cafeId: req.session.cafeId, cafeName: nextCafeName, email: req.session.email });

    const latestTheme = await pool.query('SELECT * FROM themes WHERE cafe_id = $1', [req.session.cafeId]);
    res.json({
      brandColor: latestTheme.rows[0].brand_color,
      bgColor: latestTheme.rows[0].bg_color,
      surfaceColor: latestTheme.rows[0].surface_color,
      textColor: latestTheme.rows[0].text_color,
      fontFamily: latestTheme.rows[0].font_family,
      cafeName: nextCafeName,
      logoUrl: latestTheme.rows[0].logo_url || '',
    });
  } catch (error) {
    console.error('Theme save error:', error);
    res.status(500).json({ error: 'Failed to save theme' });
  }
});

router.delete('/', requireAuth, async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO themes (cafe_id, brand_color, bg_color, surface_color, text_color, font_family, logo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (cafe_id) DO UPDATE SET
        brand_color = EXCLUDED.brand_color,
        bg_color = EXCLUDED.bg_color,
        surface_color = EXCLUDED.surface_color,
        text_color = EXCLUDED.text_color,
        font_family = EXCLUDED.font_family,
        logo_url = EXCLUDED.logo_url,
        updated_at = CURRENT_TIMESTAMP
    `, [
      req.session.cafeId,
      DEFAULT.brandColor,
      DEFAULT.bgColor,
      DEFAULT.surfaceColor,
      DEFAULT.textColor,
      DEFAULT.fontFamily,
      DEFAULT.logoUrl,
    ]);

    res.json({ ...DEFAULT, cafeName: req.session.cafeName || DEFAULT.cafeName });
  } catch (error) {
    console.error('Theme reset error:', error);
    res.status(500).json({ error: 'Failed to reset theme' });
  }
});

export default router;
