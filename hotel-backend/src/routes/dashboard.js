const router = require('express').Router();
const pool   = require('../config/db');

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const [[totales]]    = await pool.query('SELECT COUNT(*) AS total FROM cuarto');
    const [[ocupados]]   = await pool.query("SELECT COUNT(*) AS total FROM cuarto WHERE id_estado=2");
    const [[clientes]]   = await pool.query('SELECT COUNT(*) AS total FROM cliente');
    const [[reservas]]   = await pool.query('SELECT COUNT(*) AS total FROM reservaciones');
    const [[ingresos]]   = await pool.query('SELECT COALESCE(SUM(monto_deposit),0) AS total FROM factura');

    const [porTipo] = await pool.query(`
      SELECT tc.tipo_cuarto,
             COUNT(c.id_cuarto)                                           AS total,
             SUM(c.id_estado=2)                                           AS ocupados,
             ROUND(SUM(c.id_estado=2)/COUNT(c.id_cuarto)*100, 1)          AS pct_ocupacion
      FROM   cuarto c
      JOIN   tipo_cuarto tc ON c.id_tipo_cuarto = tc.id_tipo_cuarto
      GROUP  BY tc.id_tipo_cuarto, tc.tipo_cuarto
      ORDER  BY tc.id_tipo_cuarto
    `);

    const [reservasRecientes] = await pool.query(`
      SELECT r.id_reserva, c.nombre, c.apellido,
             cu.no_cuarto, tc.tipo_cuarto,
             r.fecha_entrada, r.fecha_salida
      FROM   reservaciones r
      JOIN   cliente      c  ON r.id_cliente     = c.id_cliente
      JOIN   cuarto       cu ON r.id_cuarto      = cu.id_cuarto
      JOIN   tipo_cuarto  tc ON cu.id_tipo_cuarto = tc.id_tipo_cuarto
      ORDER  BY r.id_reserva DESC
      LIMIT  5
    `);

    res.json({
      totalCuartos:       totales.total,
      cuartosOcupados:    ocupados.total,
      cuartosDisponibles: totales.total - ocupados.total,
      pctOcupacion:       totales.total ? Math.round(ocupados.total / totales.total * 100) : 0,
      totalClientes:      clientes.total,
      totalReservas:      reservas.total,
      totalIngresos:      Number(ingresos.total),
      ocupacionPorTipo:   porTipo,
      reservasRecientes,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
