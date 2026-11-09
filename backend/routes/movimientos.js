const router = require('express').Router();
const pool = require('../db');

// ¿Es una fecha real con formato AAAA-MM-DD? ('2026-02-30' tiene el formato, pero no existe)
function esFecha(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !isNaN(d) && d.toISOString().slice(0, 10) === v;
}

// GET /api/movimientos?id_producto=5&id_motivo=2&id_usuario=3&tipo=SALIDA
//                     &desde=2026-10-01&hasta=2026-10-31&limit=20&offset=0
router.get('/', async (req, res) => {
  const { id_producto, id_motivo, id_usuario, tipo, desde, hasta } = req.query;
  const limit = Math.min(Math.max(Math.floor(Number(req.query.limit)) || 50, 1), 200);
  const offset = Math.max(Math.floor(Number(req.query.offset)) || 0, 0);
  const condiciones = [];
  const valores = [];

  // Filtros por id: deben ser enteros positivos. Las columnas salen de este objeto
  // (no del cliente), por eso es seguro escribirlas dentro del SQL
  const porId = {
    'm.id_producto': id_producto,
    'm.id_motivo': id_motivo,
    'm.id_usuario': id_usuario,
  };
  for (const [columna, valor] of Object.entries(porId)) {
    if (valor === undefined || valor === '') continue;
    const n = Number(valor);
    if (!Number.isInteger(n) || n <= 0) {
      return res.status(400).json({ error: 'Los filtros de producto, motivo y usuario deben ser números enteros' });
    }
    valores.push(n);
    condiciones.push(`${columna} = $${valores.length}`);
  }

  if (tipo) {
    const t = String(tipo).toUpperCase();
    if (t !== 'ENTRADA' && t !== 'SALIDA') {
      return res.status(400).json({ error: 'El tipo debe ser ENTRADA o SALIDA' });
    }
    valores.push(t);
    condiciones.push(`mo.tipo = $${valores.length}`);
  }

  if (desde) {
    if (!esFecha(desde)) {
      return res.status(400).json({ error: 'La fecha desde debe tener el formato AAAA-MM-DD' });
    }
    valores.push(desde);
    condiciones.push(`m.fecha >= $${valores.length}::date`);
  }
  if (hasta) {
    if (!esFecha(hasta)) {
      return res.status(400).json({ error: 'La fecha hasta debe tener el formato AAAA-MM-DD' });
    }
    valores.push(hasta);
    // "hasta" incluye todo ese día: se compara contra el inicio del día siguiente
    condiciones.push(`m.fecha < $${valores.length}::date + 1`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  valores.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT m.id_movimiento, m.fecha, p.referencia, p.nombre AS producto, p.color,
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