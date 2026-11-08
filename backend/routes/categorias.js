const router = require('express').Router();
const pool = require('../db');
const { limpiar, cabe } = require('../utils/validar');

// Devuelve el nombre limpio o null si es inválido (obligatorio, máximo 50 caracteres)
function leerNombre(body = {}) {
  const nombre = limpiar(body.nombre);
  return nombre && cabe(nombre, 50) ? nombre : null;
}

const MSG_INVALIDO = 'El nombre es obligatorio y no puede exceder 50 caracteres';
const MSG_REPETIDA = 'Ya existe una categoría con ese nombre';

// GET /api/categorias -> lista con la cantidad de productos de cada una
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id_categoria, c.nombre, COUNT(p.id_producto) AS total_productos
     FROM categoria c
     LEFT JOIN producto p ON p.id_categoria = c.id_categoria
     GROUP BY c.id_categoria
     ORDER BY c.nombre`
  );
  res.json(rows);
});

// POST /api/categorias   body: { nombre }
router.post('/', async (req, res) => {
  const nombre = leerNombre(req.body ?? {});
  if (!nombre) return res.status(400).json({ error: MSG_INVALIDO });

  try {
    const { rows } = await pool.query(
      'INSERT INTO categoria (nombre) VALUES ($1) RETURNING id_categoria, nombre',
      [nombre]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: MSG_REPETIDA });
    throw err;
  }
});

// PUT /api/categorias/3   body: { nombre }
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'El id debe ser un número entero' });
  }
  const nombre = leerNombre(req.body ?? {});
  if (!nombre) return res.status(400).json({ error: MSG_INVALIDO });

  try {
    const { rows } = await pool.query(
      'UPDATE categoria SET nombre = $1 WHERE id_categoria = $2 RETURNING id_categoria, nombre',
      [nombre, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: MSG_REPETIDA });
    throw err;
  }
});

// DELETE /api/categorias/3
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'El id debe ser un número entero' });
  }
  try {
    const { rowCount } = await pool.query('DELETE FROM categoria WHERE id_categoria = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.status(204).end();
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: la categoría tiene productos asociados' });
    }
    throw err;
  }
});

module.exports = router;