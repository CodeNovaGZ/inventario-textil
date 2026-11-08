const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Ruta de prueba: confirma que el servidor y la base de datos responden
app.get('/api/salud', async (req, res) => {
  const { rows } = await pool.query('SELECT NOW() AS hora_bd');
  res.json({ ok: true, hora_bd: rows[0].hora_bd });
});

const PORT = process.env.PORT || 3000;
app.use('/api', require('./routes/catalogos'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/movimientos', require('./routes/movimientos'));
app.use('/api/resumen', require('./routes/resumen'));
app.use('/api/proveedores', require('./routes/proveedores'));
// Si ninguna ruta coincidió
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores: recibe cualquier error no controlado
app.use((err, req, res, next) => {
  // Errores del cliente (por ejemplo, un JSON mal formado) traen status 4xx
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: 'Solicitud inválida' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));