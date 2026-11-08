const router = require('express').Router();
const pool = require('../db');

// GET /api/resumen -> los cuatro indicadores del panel
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(s.stock_actual * p.precio_metro), 0) AS valor_inventario,
            COALESCE(SUM(s.stock_actual), 0) AS metros_totales,
            COUNT(*) AS productos,
            COUNT(*) FILTER (WHERE s.stock_actual < s.stock_minimo) AS bajo_minimo
     FROM v_stock_actual s
     JOIN producto p ON p.id_producto = s.id_producto`
  );
  res.json(rows[0]);
});

// GET /api/resumen/semanal?semanas=8 -> entradas y salidas (metros) por semana
router.get('/semanal', async (req, res) => {
  const semanas = Math.min(Math.max(Math.floor(Number(req.query.semanas)) || 8, 1), 52);

  const { rows } = await pool.query(
    `WITH semanas AS (
       SELECT generate_series(
         date_trunc('week', NOW() AT TIME ZONE 'America/Bogota') - ($1::int - 1) * INTERVAL '1 week',
         date_trunc('week', NOW() AT TIME ZONE 'America/Bogota'),
         INTERVAL '1 week'
       ) AS semana
     )
     SELECT to_char(s.semana, 'YYYY-MM-DD') AS semana,
            COALESCE(SUM(m.cantidad_metros) FILTER (WHERE mo.tipo = 'ENTRADA'), 0) AS entradas,
            COALESCE(SUM(m.cantidad_metros) FILTER (WHERE mo.tipo = 'SALIDA'), 0) AS salidas
     FROM semanas s
     LEFT JOIN movimiento m ON date_trunc('week', m.fecha) = s.semana
     LEFT JOIN motivo_movimiento mo ON mo.id_motivo = m.id_motivo
     GROUP BY s.semana
     ORDER BY s.semana`,
    [semanas]
  );
  res.json(rows);
});

// GET /api/resumen/categorias -> valor y metros en bodega por categoría
router.get('/categorias', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.nombre AS categoria,
            SUM(s.stock_actual * p.precio_metro) AS valor,
            SUM(s.stock_actual) AS metros
     FROM v_stock_actual s
     JOIN producto p ON p.id_producto = s.id_producto
     JOIN categoria c ON c.id_categoria = p.id_categoria
     GROUP BY c.nombre
     ORDER BY valor DESC`
  );
  res.json(rows);
});

module.exports = router;