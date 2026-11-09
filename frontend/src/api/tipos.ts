export type Resumen = {
  valor_inventario: number
  metros_totales: number
  productos: number
  bajo_minimo: number
}

export type SemanaResumen = { semana: string; entradas: number; salidas: number }

export type CategoriaResumen = { categoria: string; valor: number; metros: number }

export type TipoMovimiento = 'ENTRADA' | 'SALIDA'

export type Movimiento = {
  id_movimiento: number
  fecha: string
  referencia: string
  producto: string
  color: string | null
  motivo: string
  tipo: TipoMovimiento
  usuario: string
  cantidad_metros: number
  precio_metro: number
  valor_total: number
}

export type Producto = {
  id_producto: number
  referencia: string
  nombre: string
  categoria: string
  color: string | null
  precio_metro: number
  stock_actual: number
  stock_minimo: number
  stock_bajo: boolean
  proveedor: string
  id_categoria: number
  id_proveedor: number
}

export type Categoria = { id_categoria: number; nombre: string; total_productos: number }

export type Proveedor = {
  id_proveedor: number
  nit: string
  nombre: string
  contacto: string | null
  telefono: string | null
  correo: string | null
  ciudad: string | null
  total_productos: number
}

export type Motivo = { id_motivo: number; nombre: string; tipo: TipoMovimiento }

export type Usuario = { id_usuario: number; nombre: string; rol: string }

// Lo que se envía al registrar un movimiento
export type NuevoMovimiento = {
  id_producto: number
  id_motivo: number
  id_usuario: number
  cantidad_metros: number
}

// Lo que responde el backend (201): el movimiento ya guardado
export type MovimientoCreado = {
  id_movimiento: number
  fecha: string
  id_producto: number
  id_motivo: number
  id_usuario: number
  cantidad_metros: number
  precio_metro: number
}

export type DatosProveedor = {
  nit: string
  nombre: string
  contacto: string
  telefono: string
  correo: string
  ciudad: string
}

// Lo que se envía al crear o editar un producto (stock_inicial solo se envía al crear)
export type DatosProducto = {
  referencia: string
  nombre: string
  id_categoria: number
  id_proveedor: number
  color: string
  precio_metro: number
  stock_minimo: number
  stock_inicial?: number
}

export type DatosCategoria = { nombre: string }

