/**
 * GET  /api/cuartos          – listar todos con joins
 * GET  /api/cuartos/:id      – detalle
 * PATCH /api/cuartos/:id/estado – cambiar estado (solo Disponible/Ocupado)
 *
 * POST / PUT / DELETE cuartos → 405 Method Not Allowed
 * Los cuartos son fijos: 20×1cama, 20×2camas, 10 suites, 2 banquetes.
 */
const router  = require('express').Router();
const pool    = require('../config/db');

// GET /api/cuartos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id_cuarto, c.no_cuarto, c.descripcion,
             c.id_tipo_cuarto, tc.tipo_cuarto, tc.precio,
             c.id_estado, ce.estado
      FROM   cuarto c
      JOIN   tipo_cuarto  tc ON c.id_tipo_cuarto = tc.id_tipo_cuarto
      JOIN   cuarto_estado ce ON c.id_estado     = ce.id_estado
      ORDER  BY c.id_cuarto
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/cuartos/tipos
router.get('/tipos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tipo_cuarto ORDER BY id_tipo_cuarto');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/cuartos/estados
router.get('/estados', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cuarto_estado ORDER BY id_estado');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/cuartos/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id_cuarto, c.no_cuarto, c.descripcion,
             c.id_tipo_cuarto, tc.tipo_cuarto, tc.precio,
             c.id_estado, ce.estado
      FROM   cuarto c
      JOIN   tipo_cuarto  tc ON c.id_tipo_cuarto = tc.id_tipo_cuarto
      JOIN   cuarto_estado ce ON c.id_estado     = ce.id_estado
      WHERE  c.id_cuarto = ?
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Cuarto no encontrado' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/cuartos/:id/estado  { id_estado: 1|2 }
router.patch('/:id/estado', async (req, res) => {
  const { id_estado } = req.body;
  if (![1, 2].includes(Number(id_estado)))
    return res.status(400).json({ error: 'id_estado debe ser 1 (Disponible) o 2 (Ocupado)' });
  try {
    const [r] = await pool.query(
      'UPDATE cuarto SET id_estado = ? WHERE id_cuarto = ?',
      [id_estado, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Cuarto no encontrado' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Bloquear POST/PUT/DELETE sobre cuartos
router.post('/',    (_, res) => res.status(405).json({ error: 'No se pueden crear cuartos. El inventario es fijo.' }));
router.put('/:id',  (_, res) => res.status(405).json({ error: 'Usar PATCH /estado para cambiar el estado.' }));
router.delete('/:id',(_, res) => res.status(405).json({ error: 'No se pueden eliminar cuartos.' }));

module.exports = router;
