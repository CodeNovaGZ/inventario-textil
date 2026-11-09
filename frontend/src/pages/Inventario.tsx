import { useState } from 'react'
import { useCategorias, useEliminarProducto, useProductos, useProveedores } from '../api/hooks'
import type { Producto } from '../api/tipos'
import AccionesFila from '../components/AccionesFila'
import Aviso, { type DatosAviso } from '../components/Aviso'
import Estado from '../components/Estado'
import FormularioProducto from '../components/FormularioProducto'
import Tabla from '../components/Tabla'
import Tarjeta from '../components/Tarjeta'
import { botonPrimario, campo } from '../lib/Estilos'
import { conColor, metros, moneda } from '../lib/formato'
import { useDebounce } from '../lib/useDebounce'
import Pestanas from '../components/Pestanas'
import { pestanasInventario } from '../lib/pestanas'

// Qué se está haciendo con el formulario: nada, crear uno nuevo o editar uno existente
type Modo = { tipo: 'nuevo' } | { tipo: 'editar'; producto: Producto } | null

export default function Inventario() {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [soloBajo, setSoloBajo] = useState(false)

  const [modo, setModo] = useState<Modo>(null)
  const [aviso, setAviso] = useState<DatosAviso | null>(null)
  const [confirmando, setConfirmando] = useState<number | null>(null)

  // Se espera 300 ms después de la última tecla antes de consultar
  const q = useDebounce(busqueda, 300)

  const categorias = useCategorias()
  const proveedores = useProveedores()
  const productos = useProductos({
    q,
    id_categoria: categoria ? Number(categoria) : undefined,
    stock_bajo: soloBajo,
  })
  const eliminar = useEliminarProducto()

  async function borrar(p: Producto) {
    try {
      await eliminar.mutateAsync(p.id_producto)
      setAviso({ tipo: 'ok', texto: `Producto «${p.nombre}» eliminado` })
    } catch (e) {
      // 409: el backend no deja borrar un producto que ya tiene movimientos
      setAviso({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo eliminar el producto' })
    } finally {
      setConfirmando(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <button
          className={botonPrimario}
          onClick={() => {
            setAviso(null)
            setModo({ tipo: 'nuevo' })
          }}
        >
          + Nuevo producto
        </button>
      </div>
      
      <Pestanas pestanas={pestanasInventario} />
      <Aviso aviso={aviso} />

      {/* El formulario necesita las listas de categorías y proveedores para sus desplegables */}
      {modo && categorias.data && proveedores.data && (
        <Tarjeta titulo={modo.tipo === 'nuevo' ? 'Nuevo producto' : 'Editar producto'}>
          <FormularioProducto
            key={modo.tipo === 'editar' ? modo.producto.id_producto : 'nuevo'}
            producto={modo.tipo === 'editar' ? modo.producto : undefined}
            categorias={categorias.data}
            proveedores={proveedores.data}
            onGuardado={(mensaje) => {
              setAviso({ tipo: 'ok', texto: mensaje })
              setModo(null)
            }}
            onCancelar={() => setModo(null)}
          />
        </Tarjeta>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-60 flex-1 flex-col gap-1.5">
          <label htmlFor="busqueda" className="text-sm text-suave">
            Buscar por nombre o referencia
          </label>
          <input
            id="busqueda"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={campo}
          />
        </div>
        <div className="flex w-56 flex-col gap-1.5">
          <label htmlFor="categoria" className="text-sm text-suave">
            Categoría
          </label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={campo}
          >
            <option value="">Todas</option>
            {categorias.data?.map((c) => (
              <option key={c.id_categoria} value={c.id_categoria}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={soloBajo} onChange={(e) => setSoloBajo(e.target.checked)} />
          Solo stock bajo
        </label>
      </div>

      <Tarjeta>
        <Estado consulta={productos}>
          {(filas) => (
            <>
              <Tabla
                filas={filas}
                clave={(p) => p.id_producto}
                vacio="Ningún producto coincide con los filtros"
                columnas={[
                  { titulo: 'Referencia', celda: (p) => p.referencia },
                  { titulo: 'Producto', celda: (p) => conColor(p.nombre, p.color) },
                  { titulo: 'Categoría', celda: (p) => p.categoria },
                  { titulo: 'Proveedor', celda: (p) => p.proveedor },
                  { titulo: 'Precio por metro', derecha: true, celda: (p) => moneda(p.precio_metro) },
                  { titulo: 'Stock', derecha: true, celda: (p) => <b>{metros(p.stock_actual)}</b> },
                  { titulo: 'Mínimo', derecha: true, celda: (p) => p.stock_minimo },
                  {
                    titulo: 'Estado',
                    celda: (p) =>
                      p.stock_bajo ? (
                        <span className="font-semibold text-peligro">Bajo mínimo</span>
                      ) : (
                        <span className="font-semibold text-ok">En orden</span>
                      ),
                  },
                  {
                    titulo: 'Acciones',
                    celda: (p) => (
                      <AccionesFila
                        nombre={p.referencia}
                        confirmando={confirmando === p.id_producto}
                        pendiente={eliminar.isPending}
                        onEditar={() => {
                          setAviso(null)
                          setModo({ tipo: 'editar', producto: p })
                        }}
                        onPedirEliminar={() => {
                          setAviso(null)
                          setConfirmando(p.id_producto)
                        }}
                        onConfirmar={() => borrar(p)}
                        onCancelar={() => setConfirmando(null)}
                      />
                    ),
                  },
                ]}
              />
              <p className="border-t border-borde pt-3 text-sm text-suave">
                Mostrando {filas.length} {filas.length === 1 ? 'producto' : 'productos'}
              </p>
            </>
          )}
        </Estado>
      </Tarjeta>
    </div>
  )
}