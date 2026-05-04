const router = require('express').Router();
const pool   = require('../config/db');

// GET /api/clientes
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cliente ORDER BY id_cliente');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/clientes/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cliente WHERE id_cliente = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/clientes
router.post('/', async (req, res) => {
  const { nombre, apellido, telefono, email } = req.body;
  if (!nombre || !apellido) return res.status(400).json({ error: 'nombre y apellido son requeridos' });
  try {
    const [[{ max }]] = await pool.query('SELECT COALESCE(MAX(id_cliente),0)+1 AS max FROM cliente');
    await pool.query(
      'INSERT INTO cliente VALUES (?,?,?,?,?)',
      [max, nombre, apellido, telefono || null, email || null]
    );
    const [rows] = await pool.query('SELECT * FROM cliente WHERE id_cliente = ?', [max]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
  const { nombre, apellido, telefono, email } = req.body;
  try {
    const [r] = await pool.query(
      'UPDATE cliente SET nombre=?, apellido=?, telefono=?, email=? WHERE id_cliente=?',
      [nombre, apellido, telefono, email, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Cliente no encontrado' });
    const [rows] = await pool.query('SELECT * FROM cliente WHERE id_cliente=?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/clientes/:id
router.delete('/:id', async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM cliente WHERE id_cliente=?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
