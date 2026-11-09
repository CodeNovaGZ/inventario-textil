import { useState } from 'react'
import { useMotivos, useMovimientos, useProductos, useUsuarios } from '../api/hooks'
import type { TipoMovimiento } from '../api/tipos'
import Campo from '../components/Campo'
import Estado from '../components/Estado'
import Tabla from '../components/Tabla'
import Tarjeta from '../components/Tarjeta'
import { boton, botonPrimario, campo } from '../lib/Estilos'
import { conColor, fechaHora, metrosConSigno, moneda } from '../lib/formato'
import { Link } from 'react-router/internal/react-server-client'

const POR_PAGINA = 20

type Filtros = {
  tipo: '' | TipoMovimiento
  producto: string
  motivo: string
  usuario: string
  desde: string
  hasta: string
}

const SIN_FILTROS: Filtros = { tipo: '', producto: '', motivo: '', usuario: '', desde: '', hasta: '' }

export default function Movimientos() {
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS)
  const [pagina, setPagina] = useState(0)

  // Listas para los desplegables
  const productos = useProductos({})
  const motivos = useMotivos()
  const usuarios = useUsuarios()

  const movimientos = useMovimientos({
    tipo: filtros.tipo || undefined,
    id_producto: filtros.producto ? Number(filtros.producto) : undefined,
    id_motivo: filtros.motivo ? Number(filtros.motivo) : undefined,
    id_usuario: filtros.usuario ? Number(filtros.usuario) : undefined,
    desde: filtros.desde || undefined,
    hasta: filtros.hasta || undefined,
    limit: POR_PAGINA + 1, // una fila de más: sirve para saber si hay página siguiente
    offset: pagina * POR_PAGINA,
  })

  // Mientras llega la página nueva se siguen mostrando las filas anteriores (placeholder)
  const cambiando = movimientos.isPlaceholderData

  // Cualquier cambio de filtro vuelve a la primera página
  function cambiar(cambios: Partial<Filtros>) {
    setFiltros({ ...filtros, ...cambios })
    setPagina(0)
  }

  // El motivo determina el tipo: solo se ofrecen los motivos del tipo elegido
  const motivosVisibles = motivos.data?.filter((m) => !filtros.tipo || m.tipo === filtros.tipo) ?? []

  function cambiarTipo(tipo: '' | TipoMovimiento) {
    const motivoActual = motivos.data?.find((m) => String(m.id_motivo) === filtros.motivo)
    const sigueValido = !motivoActual || !tipo || motivoActual.tipo === tipo
    cambiar({ tipo, motivo: sigueValido ? filtros.motivo : '' })
  }

  const hayFiltros = Object.values(filtros).some(Boolean)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Movimientos</h1>
        <Link to="/movimientos/nuevo" className={botonPrimario}>
            + Registrar movimiento
        </Link>
      </div>

      <Tarjeta>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo etiqueta="Tipo" id="tipo">
            <select
              id="tipo"
              value={filtros.tipo}
              onChange={(e) => cambiarTipo(e.target.value as '' | TipoMovimiento)}
              className={campo}
            >
              <option value="">Entradas y salidas</option>
              <option value="ENTRADA">Solo entradas</option>
              <option value="SALIDA">Solo salidas</option>
            </select>
          </Campo>

          <Campo etiqueta="Motivo" id="motivo">
            <select
              id="motivo"
              value={filtros.motivo}
              onChange={(e) => cambiar({ motivo: e.target.value })}
              className={campo}
            >
              <option value="">Todos los motivos</option>
              {motivosVisibles.map((m) => (
                <option key={m.id_motivo} value={m.id_motivo}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Producto" id="producto">
            <select
              id="producto"
              value={filtros.producto}
              onChange={(e) => cambiar({ producto: e.target.value })}
              className={campo}
            >
              <option value="">Todos los productos</option>
              {productos.data?.map((p) => (
                <option key={p.id_producto} value={p.id_producto}>
                  {p.referencia} · {conColor(p.nombre, p.color)}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Usuario" id="usuario">
            <select
              id="usuario"
              value={filtros.usuario}
              onChange={(e) => cambiar({ usuario: e.target.value })}
              className={campo}
            >
              <option value="">Todos los usuarios</option>
              {usuarios.data?.map((u) => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Desde" id="desde">
            <input
              id="desde"
              type="date"
              value={filtros.desde}
              max={filtros.hasta || undefined}
              onChange={(e) => cambiar({ desde: e.target.value })}
              className={campo}
            />
          </Campo>

          <Campo etiqueta="Hasta" id="hasta">
            <input
              id="hasta"
              type="date"
              value={filtros.hasta}
              min={filtros.desde || undefined}
              onChange={(e) => cambiar({ hasta: e.target.value })}
              className={campo}
            />
          </Campo>
        </div>

        {hayFiltros && (
          <button className={`${boton} self-start`} onClick={() => cambiar(SIN_FILTROS)}>
            Limpiar filtros
          </button>
        )}
      </Tarjeta>

      <Tarjeta>
        <Estado consulta={movimientos}>
          {(recibidas) => {
            const filas = recibidas.slice(0, POR_PAGINA) // la fila extra no se muestra
            const hayMas = recibidas.length > POR_PAGINA

            return (
              <>
                <Tabla
                  filas={filas}
                  clave={(m) => m.id_movimiento}
                  vacio="No hay movimientos con esos filtros"
                  columnas={[
                    { titulo: 'Fecha', celda: (m) => fechaHora(m.fecha) },
                    { titulo: 'Producto', celda: (m) => `${m.referencia} · ${conColor(m.producto, m.color)}` },
                    { titulo: 'Motivo', celda: (m) => m.motivo },
                    { titulo: 'Usuario', celda: (m) => m.usuario },
                    {
                      titulo: 'Metros',
                      derecha: true,
                      celda: (m) => (
                        <span className={m.tipo === 'ENTRADA' ? 'text-ok' : 'text-alerta'}>
                          {metrosConSigno(m.tipo, m.cantidad_metros)}
                        </span>
                      ),
                    },
                    { titulo: 'Valor', derecha: true, celda: (m) => moneda(m.valor_total) },
                  ]}
                />
                <div className="flex items-center justify-between border-t border-borde pt-3">
                  <button
                    className={boton}
                    disabled={pagina === 0 || cambiando}
                    onClick={() => setPagina(pagina - 1)}
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-suave">Página {pagina + 1}</span>
                  <button
                    className={boton}
                    disabled={!hayMas || cambiando}
                    onClick={() => setPagina(pagina + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )
          }}
        </Estado>
      </Tarjeta>
    </div>
  )
}