const router = require('express').Router();
const pool = require('../db');
const { limpiar, cabe } = require('../utils/validar');

// Valida el cuerpo; devuelve los datos limpios o null si algo está mal
function leerProveedor(b = {}) {
  const d = {
    nit: limpiar(b.nit),
    nombre: limpiar(b.nombre),
    contacto: limpiar(b.contacto),
    telefono: limpiar(b.telefono),
    correo: limpiar(b.correo),
    ciudad: limpiar(b.ciudad),
  };
  const valido =
    d.nit && d.nombre &&
    cabe(d.nit, 20) && cabe(d.nombre, 150) && cabe(d.contacto, 100) &&
    cabe(d.telefono, 30) && cabe(d.correo, 120) && cabe(d.ciudad, 80) &&
    (d.correo === null || d.correo.includes('@'));
  return valido ? d : null;
}

const MSG_INVALIDO =
  'NIT y nombre son obligatorios; el correo debe contener @ y los textos no pueden exceder el largo permitido';
const MSG_NIT_REPETIDO = 'Ya existe un proveedor con ese NIT';

// GET /api/proveedores -> lista con la cantidad de productos de cada uno
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT pr.*, COUNT(p.id_producto) AS total_productos
     FROM proveedor pr
     LEFT JOIN producto p ON p.id_proveedor = pr.id_proveedor
     GROUP BY pr.id_proveedor
     ORDER BY pr.nombre`
  );
  res.json(rows);
});

// GET /api/proveedores/3 -> detalle + productos que suministra
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'El id debe ser un número entero' });
  }
  const proveedor = await pool.query('SELECT * FROM proveedor WHERE id_proveedor = $1', [id]);
  if (proveedor.rowCount === 0) {
    return res.status(404).json({ error: 'Proveedor no encontrado' });
  }
  const productos = await pool.query(
    `SELECT id_producto, referencia, nombre, color, precio_metro
     FROM producto WHERE id_proveedor = $1 ORDER BY nombre`,
    [id]
  );
  res.json({ ...proveedor.rows[0], productos: productos.rows });
});

// POST /api/proveedores
router.post('/', async (req, res) => {
  const d = leerProveedor(req.body ?? {});
  if (!d) return res.status(400).json({ error: MSG_INVALIDO });

  try {
    const { rows } = await pool.query(
      `INSERT INTO proveedor (nit, nombre, contacto, telefono, correo, ciudad)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [d.nit, d.nombre, d.contacto, d.telefono, d.correo, d.ciudad]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: MSG_NIT_REPETIDO });
    throw err;
  }
});

// PUT /api/proveedores/3 (se envían todos los campos)
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'El id debe ser un número entero' });
  }
  const d = leerProveedor(req.body ?? {});
  if (!d) return res.status(400).json({ error: MSG_INVALIDO });

  try {
    const { rows } = await pool.query(
      `UPDATE proveedor
       SET nit = $1, nombre = $2, contacto = $3, telefono = $4, correo = $5, ciudad = $6
       WHERE id_proveedor = $7
       RETURNING *`,
      [d.nit, d.nombre, d.contacto, d.telefono, d.correo, d.ciudad, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: MSG_NIT_REPETIDO });
    throw err;
  }
});

// DELETE /api/proveedores/3
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'El id debe ser un número entero' });
  }
  try {
    const { rowCount } = await pool.query('DELETE FROM proveedor WHERE id_proveedor = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.status(204).end();
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: el proveedor tiene productos asociados' });
    }
    throw err;
  }
});

module.exports = router;