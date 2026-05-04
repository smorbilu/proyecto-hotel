const router = require('express').Router();
const pool   = require('../config/db');

// GET /api/grupos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM grupo ORDER BY id_grupo');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/grupos/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM grupo WHERE id_grupo=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Grupo no encontrado' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/grupos
router.post('/', async (req, res) => {
  const { nom_grupo, nom_evento } = req.body;
  if (!nom_grupo || !nom_evento) return res.status(400).json({ error: 'nom_grupo y nom_evento son requeridos' });
  try {
    const [[{ max }]] = await pool.query('SELECT COALESCE(MAX(id_grupo),0)+1 AS max FROM grupo');
    await pool.query('INSERT INTO grupo VALUES (?,?,?)', [max, nom_grupo, nom_evento]);
    const [rows] = await pool.query('SELECT * FROM grupo WHERE id_grupo=?', [max]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/grupos/:id
router.put('/:id', async (req, res) => {
  const { nom_grupo, nom_evento } = req.body;
  try {
    const [r] = await pool.query(
      'UPDATE grupo SET nom_grupo=?, nom_evento=? WHERE id_grupo=?',
      [nom_grupo, nom_evento, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Grupo no encontrado' });
    const [rows] = await pool.query('SELECT * FROM grupo WHERE id_grupo=?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/grupos/:id
router.delete('/:id', async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM grupo WHERE id_grupo=?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Grupo no encontrado' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
