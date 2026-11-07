-- =====================================================================
-- 01_schema.sql  |  Inventario textil  |  PostgreSQL
-- Estructura de la base de datos (tablas, restricciones, índice y vista)
-- =====================================================================

CREATE TABLE rol (
  id_rol SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  id_rol INT NOT NULL REFERENCES rol(id_rol)
);

CREATE TABLE proveedor (
  id_proveedor SERIAL PRIMARY KEY,
  nit VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  contacto VARCHAR(100),
  telefono VARCHAR(30),
  correo VARCHAR(120),
  ciudad VARCHAR(80)
);

CREATE TABLE categoria (
  id_categoria SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE producto (
  id_producto SERIAL PRIMARY KEY,
  referencia VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  id_categoria INT NOT NULL REFERENCES categoria(id_categoria),
  color VARCHAR(40),
  precio_metro NUMERIC(10,2) NOT NULL CHECK (precio_metro >= 0),
  stock_inicial NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (stock_inicial >= 0),
  stock_minimo NUMERIC(10,2) NOT NULL DEFAULT 0,
  id_proveedor INT NOT NULL REFERENCES proveedor(id_proveedor)
);

CREATE TABLE motivo_movimiento (
  id_motivo SERIAL PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  tipo VARCHAR(7) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA'))
);

CREATE TABLE movimiento (
  id_movimiento SERIAL PRIMARY KEY,
  fecha TIMESTAMP NOT NULL DEFAULT NOW(),
  id_producto INT NOT NULL REFERENCES producto(id_producto),
  id_motivo INT NOT NULL REFERENCES motivo_movimiento(id_motivo),
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario),
  cantidad_metros NUMERIC(10,2) NOT NULL CHECK (cantidad_metros > 0),
  precio_metro NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_movimiento_producto_fecha ON movimiento (id_producto, fecha);

-- Stock actual = stock inicial + entradas - salidas
CREATE VIEW v_stock_actual AS
SELECT
  p.id_producto, p.referencia, p.nombre, p.stock_minimo,
  p.stock_inicial + COALESCE(SUM(CASE WHEN mo.tipo = 'ENTRADA' THEN m.cantidad_metros
                                      ELSE -m.cantidad_metros END), 0) AS stock_actual
FROM producto p
LEFT JOIN movimiento m ON m.id_producto = p.id_producto
LEFT JOIN motivo_movimiento mo ON mo.id_motivo = m.id_motivo
GROUP BY p.id_producto;
