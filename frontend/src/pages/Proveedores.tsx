import { useState } from 'react'
import { useEliminarProveedor, useProveedores } from '../api/hooks'
import type { Proveedor } from '../api/tipos'
import Estado from '../components/Estado'
import FormularioProveedor from '../components/FormularioProveedor'
import Tabla from '../components/Tabla'
import Tarjeta from '../components/Tarjeta'
import { botonPrimario } from '../lib/Estilos'
import AccionesFila from '../components/AccionesFila'
import Aviso, { type DatosAviso } from '../components/Aviso'

// Qué se está haciendo con el formulario: nada, crear uno nuevo o editar uno existente
type Modo = { tipo: 'nuevo' } | { tipo: 'editar'; proveedor: Proveedor } | null

export default function Proveedores() {
  const proveedores = useProveedores()
  const eliminar = useEliminarProveedor()

  const [modo, setModo] = useState<Modo>(null)
  const [aviso, setAviso] = useState<DatosAviso | null>(null)
  const [confirmando, setConfirmando] = useState<number | null>(null) // id de la fila que pide confirmación

  async function borrar(p: Proveedor) {
    try {
      await eliminar.mutateAsync(p.id_proveedor)
      setAviso({ tipo: 'ok', texto: `Proveedor «${p.nombre}» eliminado` })
    } catch (e) {
      // 409: el backend no deja borrar un proveedor que todavía tiene productos
      setAviso({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo eliminar el proveedor' })
    } finally {
      setConfirmando(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <button
          className={botonPrimario}
          onClick={() => {
            setAviso(null)
            setModo({ tipo: 'nuevo' })
          }}
        >
          + Nuevo proveedor
        </button>
      </div>

      <Aviso aviso={aviso} />

      {modo && (
        <Tarjeta titulo={modo.tipo === 'nuevo' ? 'Nuevo proveedor' : 'Editar proveedor'}>
          {/* key: al cambiar de proveedor, el formulario se crea de nuevo con sus datos */}
          <FormularioProveedor
            key={modo.tipo === 'editar' ? modo.proveedor.id_proveedor : 'nuevo'}
            proveedor={modo.tipo === 'editar' ? modo.proveedor : undefined}
            onGuardado={(mensaje) => {
              setAviso({ tipo: 'ok', texto: mensaje })
              setModo(null)
            }}
            onCancelar={() => setModo(null)}
          />
        </Tarjeta>
      )}

      <Tarjeta>
        <Estado consulta={proveedores}>
          {(filas) => (
            <Tabla
              filas={filas}
              clave={(p) => p.id_proveedor}
              vacio="Todavía no hay proveedores"
              columnas={[
                { titulo: 'Proveedor', celda: (p) => p.nombre },
                { titulo: 'NIT', celda: (p) => p.nit },
                { titulo: 'Contacto', celda: (p) => p.contacto ?? '—' },
                { titulo: 'Teléfono', celda: (p) => p.telefono ?? '—' },
                { titulo: 'Ciudad', celda: (p) => p.ciudad ?? '—' },
                { titulo: 'Productos', derecha: true, celda: (p) => p.total_productos },
                {
                  titulo: 'Acciones',
                     celda: (p) => (
                      <AccionesFila
                        nombre={p.nombre}
                        confirmando={confirmando === p.id_proveedor}
                        pendiente={eliminar.isPending}
                        onEditar={() => {
                          setAviso(null)
                          setModo({ tipo: 'editar', proveedor: p })
                        }}
                        onPedirEliminar={() => {
                          setAviso(null)
                          setConfirmando(p.id_proveedor)
                        }}
                        onConfirmar={() => borrar(p)}
                        onCancelar={() => setConfirmando(null)}
                      />
                    ),
                },
              ]}
            />
          )}
        </Estado>
      </Tarjeta>
    </div>
  )
}