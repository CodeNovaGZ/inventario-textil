const router = require('express').Router();
const pool = require('../db');

// Crea un GET que ejecuta una consulta y devuelve las filas como JSON
function catalogo(ruta, sql) {
  router.get(ruta, async (req, res) => {
    const { rows } = await pool.query(sql);
    res.json(rows);
  });
}


catalogo('/motivos', 'SELECT id_motivo, nombre, tipo FROM motivo_movimiento ORDER BY tipo, nombre');
catalogo(
  '/usuarios',
  `SELECT u.id_usuario, u.nombre, r.nombre AS rol
   FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
   ORDER BY u.nombre`
);

module.exports = router;