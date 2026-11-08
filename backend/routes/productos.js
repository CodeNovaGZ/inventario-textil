const router = require('express').Router();
const pool = require('../db');
const { limpiar, cabe, esEntero, esNumero } = require('../utils/validar');

// Consulta base: producto + categoría + proveedor + stock calculado por la vista
const SELECT_PRODUCTO = `
  SELECT p.id_producto, p.referencia, p.nombre,
         c.nombre AS categoria, p.color, p.precio_metro,
         s.stock_actual, p.stock_minimo,
         (s.stock_actual < p.stock_minimo) AS stock_bajo,
         pr.nombre AS proveedor
  FROM producto p
  JOIN categoria c ON c.id_categoria = p.id_categoria
  JOIN proveedor pr ON pr.id_proveedor = p.id_proveedor
  JOIN v_stock_actual s ON s.id_producto = p.id_producto`;

// GET /api/productos?q=algodon&id_categoria=1&stock_bajo=true&orden=cobertura&limite=3
router.get('/', async (req, res) => {
  const { q, id_categoria, stock_bajo, orden, limite } = req.query;
  const condiciones = [];
  const valores = [];

  if (q) {
    valores.push(`%${q}%`);
    condiciones.push(`(p.nombre ILIKE $${valores.length} OR p.referencia ILIKE $${valores.length})`);
  }
  if (id_categoria) {
    valores.push(Number(id_categoria));
    condiciones.push(`p.id_categoria = $${valores.length}`);
  }
  if (stock_bajo === 'true') {
    condiciones.push('s.stock_actual < p.stock_minimo');
  }

  // ORDER BY no admite parámetros ($1), así que solo se aceptan órdenes de esta lista
  const ORDENES = {
    cobertura: 's.stock_actual / NULLIF(p.stock_minimo, 0) ASC NULLS LAST',
    stock: 's.stock_actual ASC',
  };
  const orderBy = ORDENES[orden] || 'p.id_producto';

  let limit = '';
  if (limite) {
    valores.push(Math.min(Math.floor(Number(limite)) || 10, 100));
    limit = `LIMIT $${valores.length}`;
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `${SELECT_PRODUCTO} ${where} ORDER BY ${orderBy} ${limit}`,
    valores
  );
  res.json(rows);
});

// GET /api/productos/5 -> detalle + últimos 10 movimientos
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'El id debe ser un número entero' });
  }

  const producto = await pool.query(`${SELECT_PRODUCTO} WHERE p.id_producto = $1`, [id]);
  if (producto.rowCount === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const movimientos = await pool.query(
    `SELECT m.id_movimiento, m.fecha, mo.nombre AS motivo, mo.tipo,
            m.cantidad_metros, m.precio_metro
     FROM movimiento m
     JOIN motivo_movimiento mo ON mo.id_motivo = m.id_motivo
     WHERE m.id_producto = $1
     ORDER BY m.fecha DESC, m.id_movimiento DESC
     LIMIT 10`,
    [id]
  );

  res.json({ ...producto.rows[0], ultimos_movimientos: movimientos.rows });
});

// Valida el cuerpo de POST y PUT; devuelve los datos limpios o null si algo está mal
function leerProducto(b = {}) {
  const d = {
    referencia: limpiar(b.referencia),
    nombre: limpiar(b.nombre),
    id_categoria: b.id_categoria,
    color: limpiar(b.color),
    precio_metro: b.precio_metro,
    stock_minimo: b.stock_minimo ?? 0,
    id_proveedor: b.id_proveedor,
  };
  const valido =
    d.referencia && d.nombre &&
    cabe(d.referencia, 20) && cabe(d.nombre, 100) && cabe(d.color, 40) &&
    esEntero(d.id_categoria) && esEntero(d.id_proveedor) &&
    esNumero(d.precio_metro) && esNumero(d.stock_minimo);
  return valido ? d : null;
}

const MSG_INVALIDO =
  'Se requieren referencia, nombre, id_categoria, id_proveedor y precio_metro válidos (precio y mínimo no pueden ser negativos)';

// Traduce los errores de la base de datos a respuestas claras; si no reconoce el error, lo relanza
function errorProducto(err, res) {
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Ya existe un producto con esa referencia' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'La categoría o el proveedor no existe' });
  }
  throw err;
}

// POST /api/productos
// body: { referencia, nombre, id_categoria, color?, precio_metro, stock_inicial?, stock_minimo?, id_proveedor }
router.post('/', async (req, res) => {
  const d = leerProducto(req.body ?? {});
  const stock_inicial = req.body?.stock_inicial ?? 0;
  if (!d || !esNumero(stock_inicial)) {
    return res.status(400).json({ error: MSG_INVALIDO });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO producto
         (referencia, nombre, id_categoria, color, precio_metro, stock_inicial, stock_minimo, id_proveedor)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_producto`,
      [d.referencia, d.nombre, d.id_categoria, d.color, d.precio_metro, stock_inicial, d.stock_minimo, d.id_proveedor]
    );
    const creado = await pool.query(`${SELECT_PRODUCTO} WHERE p.id_producto = $1`, [rows[0].id_producto]);
    res.status(201).json(creado.rows[0]);
  } catch (err) {
    errorProducto(err, res);
  }
});

// PUT /api/productos/5 (se envían todos los campos, menos stock_inicial)
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'El id debe ser un número entero' });
  }
  const d = leerProducto(req.body ?? {});
  if (!d) return res.status(400).json({ error: MSG_INVALIDO });

  try {
    const { rowCount } = await pool.query(
      `UPDATE producto
       SET referencia = $1, nombre = $2, id_categoria = $3, color = $4,
           precio_metro = $5, stock_minimo = $6, id_proveedor = $7
       WHERE id_producto = $8`,
      [d.referencia, d.nombre, d.id_categoria, d.color, d.precio_metro, d.stock_minimo, d.id_proveedor, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    const actualizado = await pool.query(`${SELECT_PRODUCTO} WHERE p.id_producto = $1`, [id]);
    res.json(actualizado.rows[0]);
  } catch (err) {
    errorProducto(err, res);
  }
});

// DELETE /api/productos/5
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'El id debe ser un número entero' });
  }
  try {
    const { rowCount } = await pool.query('DELETE FROM producto WHERE id_producto = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.status(204).end();
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: el producto tiene movimientos registrados' });
    }
    throw err;
  }
});

module.exports = router;