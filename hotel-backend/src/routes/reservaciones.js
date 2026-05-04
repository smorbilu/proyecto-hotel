const router = require('express').Router();
const pool   = require('../config/db');

const SELECT_FULL = `
  SELECT r.id_reserva, r.descripcion, r.fecha_entrada, r.fecha_salida, r.notas,
         r.id_cliente, c.nombre, c.apellido,
         r.id_cuarto,  cu.no_cuarto, cu.descripcion AS cuarto_desc,
         tc.tipo_cuarto, tc.precio,
         r.id_factura,
         g.id_grupo, g.nom_grupo, g.nom_evento
  FROM   reservaciones r
  JOIN   cliente   c  ON r.id_cliente = c.id_cliente
  JOIN   cuarto    cu ON r.id_cuarto  = cu.id_cuarto
  JOIN   tipo_cuarto tc ON cu.id_tipo_cuarto = tc.id_tipo_cuarto
  LEFT JOIN factura f ON r.id_factura = f.id_factura
  LEFT JOIN grupo_reserva gr ON r.id_reserva = gr.id_reserva
  LEFT JOIN grupo g ON gr.id_grupo = g.id_grupo
`;

// GET /api/reservaciones
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(SELECT_FULL + ' ORDER BY r.id_reserva');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/reservaciones/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(SELECT_FULL + ' WHERE r.id_reserva=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Reservación no encontrada' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/reservaciones
router.post('/', async (req, res) => {
  const { id_cliente, id_factura, id_cuarto, descripcion, fecha_entrada, fecha_salida, notas } = req.body;
  if (!id_cliente || !id_cuarto || !fecha_entrada || !fecha_salida)
    return res.status(400).json({ error: 'id_cliente, id_cuarto, fecha_entrada y fecha_salida son requeridos' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar cuarto disponible
    const [[cuarto]] = await conn.query(
      'SELECT id_estado FROM cuarto WHERE id_cuarto=?', [id_cuarto]
    );
    if (!cuarto) { await conn.rollback(); return res.status(404).json({ error: 'Cuarto no encontrado' }); }
    if (cuarto.id_estado !== 1) { await conn.rollback(); return res.status(409).json({ error: 'Cuarto no disponible' }); }

    // Obtener siguiente id
    const [[{ max }]] = await conn.query('SELECT COALESCE(MAX(id_reserva),0)+1 AS max FROM reservaciones');

    await conn.query(
      'INSERT INTO reservaciones VALUES (?,?,?,?,?,?,?,?)',
      [max, id_cliente, id_factura || null, id_cuarto,
       descripcion || '', fecha_entrada, fecha_salida, notas || '']
    );

    // Marcar cuarto como Ocupado
    await conn.query('UPDATE cuarto SET id_estado=2 WHERE id_cuarto=?', [id_cuarto]);

    // Insertar en cuarto_reserva
    const [[{ maxCr }]] = await conn.query(
      'SELECT COALESCE(MAX(id_cuarto_reser),0)+1 AS maxCr FROM cuarto_reserva'
    );
    await conn.query('INSERT INTO cuarto_reserva VALUES (?,?,?)', [maxCr, id_cuarto, max]);

    await conn.commit();

    const [rows] = await pool.query(SELECT_FULL + ' WHERE r.id_reserva=?', [max]);
    res.status(201).json(rows[0]);
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

// PUT /api/reservaciones/:id
router.put('/:id', async (req, res) => {
  const { id_cliente, id_factura, id_cuarto, descripcion, fecha_entrada, fecha_salida, notas } = req.body;
  try {
    const [r] = await pool.query(
      'UPDATE reservaciones SET id_cliente=?,id_factura=?,id_cuarto=?,descripcion=?,fecha_entrada=?,fecha_salida=?,notas=? WHERE id_reserva=?',
      [id_cliente, id_factura, id_cuarto, descripcion, fecha_entrada, fecha_salida, notas, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Reservación no encontrada' });
    const [rows] = await pool.query(SELECT_FULL + ' WHERE r.id_reserva=?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/reservaciones/:id  → libera el cuarto
router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[reserva]] = await conn.query(
      'SELECT id_cuarto FROM reservaciones WHERE id_reserva=?', [req.params.id]
    );
    if (!reserva) { await conn.rollback(); return res.status(404).json({ error: 'Reservación no encontrada' }); }

    // Borrar registros dependientes
    await conn.query('DELETE fr FROM factura_reserva fr JOIN cuarto_reserva cr ON fr.id_cuarto_reser=cr.id_cuarto_reser WHERE cr.id_reserva=?', [req.params.id]);
    await conn.query('DELETE FROM grupo_reserva WHERE id_reserva=?', [req.params.id]);
    await conn.query('DELETE FROM cuarto_reserva WHERE id_reserva=?', [req.params.id]);
    await conn.query('DELETE FROM reservaciones WHERE id_reserva=?', [req.params.id]);

    // Liberar cuarto
    await conn.query('UPDATE cuarto SET id_estado=1 WHERE id_cuarto=?', [reserva.id_cuarto]);

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

module.exports = router;
