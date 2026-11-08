const router = require('express').Router();
const pool = require('../db');

// GET /api/movimientos?id_producto=5&tipo=SALIDA&limit=20&offset=0
router.get('/', async (req, res) => {
  const { id_producto, tipo } = req.query;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const condiciones = [];
  const valores = [];

  if (id_producto) {
    valores.push(Number(id_producto));
    condiciones.push(`m.id_producto = $${valores.length}`);
  }
  if (tipo) {
    valores.push(String(tipo).toUpperCase());
    condiciones.push(`mo.tipo = $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  valores.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT m.id_movimiento, m.fecha, p.referencia, p.nombre AS producto,
            mo.nombre AS motivo, mo.tipo, u.nombre AS usuario,
            m.cantidad_metros, m.precio_metro,
            m.cantidad_metros * m.precio_metro AS valor_total
     FROM movimiento m
     JOIN producto p ON p.id_producto = m.id_producto
     JOIN motivo_movimiento mo ON mo.id_motivo = m.id_motivo
     JOIN usuario u ON u.id_usuario = m.id_usuario
     ${where}
     ORDER BY m.fecha DESC, m.id_movimiento DESC
     LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
    valores
  );
  res.json(rows);
});

// POST /api/movimientos
// body: { id_producto, id_motivo, id_usuario, cantidad_metros }
router.post('/', async (req, res) => {
  const { id_producto, id_motivo, id_usuario, cantidad_metros } = req.body ?? {};

  const esEnteroPositivo = (v) => Number.isInteger(v) && v > 0;
  if (
    !esEnteroPositivo(id_producto) ||
    !esEnteroPositivo(id_motivo) ||
    !esEnteroPositivo(id_usuario) ||
    !(typeof cantidad_metros === 'number' && cantidad_metros > 0)
  ) {
    return res.status(400).json({
      error: 'Se requieren id_producto, id_motivo, id_usuario (enteros) y cantidad_metros (número mayor a 0)',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // FOR UPDATE bloquea la fila del producto hasta el COMMIT: si llegan dos
    // salidas a la vez, la segunda espera y ve el stock ya actualizado
    const producto = await client.query(
      'SELECT precio_metro FROM producto WHERE id_producto = $1 FOR UPDATE',
      [id_producto]
    );
    const motivo = await client.query(
      'SELECT tipo FROM motivo_movimiento WHERE id_motivo = $1',
      [id_motivo]
    );
    if (producto.rowCount === 0 || motivo.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'El producto o el motivo no existe' });
    }

    if (motivo.rows[0].tipo === 'SALIDA') {
      const { rows } = await client.query(
        'SELECT stock_actual FROM v_stock_actual WHERE id_producto = $1',
        [id_producto]
      );
      if (rows[0].stock_actual < cantidad_metros) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'Stock insuficiente',
          stock_actual: rows[0].stock_actual,
          solicitado: cantidad_metros,
        });
      }
    }

    // El precio se copia del producto para conservar el histórico
    const { rows } = await client.query(
      `INSERT INTO movimiento (id_producto, id_motivo, id_usuario, cantidad_metros, precio_metro)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id_producto, id_motivo, id_usuario, cantidad_metros, producto.rows[0].precio_metro]
    );

    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23503') {
      // violación de llave foránea: el usuario no existe
      return res.status(400).json({ error: 'El usuario no existe' });
    }
    throw err;
  } finally {
    client.release();
  }
});

module.exports = router;