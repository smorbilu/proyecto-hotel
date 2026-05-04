const router = require('express').Router();
const pool   = require('../config/db');

// GET /api/facturas  — incluye cliente y cuarto a través de los joins
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.id_factura, f.fecha_deposit, f.monto_deposit,
             r.id_reserva, r.id_cuarto,
             cu.no_cuarto, cu.descripcion AS cuarto_desc,
             c.id_cliente, c.nombre, c.apellido,
             g.id_grupo, g.nom_grupo, g.nom_evento
      FROM   factura f
      LEFT JOIN factura_reserva fr ON f.id_factura = fr.id_factura
      LEFT JOIN cuarto_reserva  cr ON fr.id_cuarto_reser = cr.id_cuarto_reser
      LEFT JOIN reservaciones   r  ON cr.id_reserva = r.id_reserva
      LEFT JOIN cliente         c  ON r.id_cliente  = c.id_cliente
      LEFT JOIN cuarto          cu ON r.id_cuarto   = cu.id_cuarto
      LEFT JOIN grupo_reserva   gr ON r.id_reserva  = gr.id_reserva
      LEFT JOIN grupo           g  ON gr.id_grupo   = g.id_grupo
      ORDER BY f.id_factura
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/facturas/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM factura WHERE id_factura=?', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/facturas  { fecha_deposit, monto_deposit }
router.post('/', async (req, res) => {
  const { fecha_deposit, monto_deposit } = req.body;
  if (!fecha_deposit || monto_deposit === undefined)
    return res.status(400).json({ error: 'fecha_deposit y monto_deposit son requeridos' });
  try {
    const [[{ max }]] = await pool.query('SELECT COALESCE(MAX(id_factura),0)+1 AS max FROM factura');
    await pool.query('INSERT INTO factura VALUES (?,?,?)', [max, fecha_deposit, monto_deposit]);
    const [rows] = await pool.query('SELECT * FROM factura WHERE id_factura=?', [max]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/facturas/:id
router.put('/:id', async (req, res) => {
  const { fecha_deposit, monto_deposit } = req.body;
  try {
    const [r] = await pool.query(
      'UPDATE factura SET fecha_deposit=?, monto_deposit=? WHERE id_factura=?',
      [fecha_deposit, monto_deposit, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Factura no encontrada' });
    const [rows] = await pool.query('SELECT * FROM factura WHERE id_factura=?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/facturas/:id
router.delete('/:id', async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM factura WHERE id_factura=?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
