import { useState } from 'react'
import { useCategorias, useEliminarCategoria } from '../api/hooks'
import type { Categoria } from '../api/tipos'
import AccionesFila from '../components/AccionesFila'
import Aviso, { type DatosAviso } from '../components/Aviso'
import Estado from '../components/Estado'
import FormularioCategoria from '../components/FormularioCategoria'
import Pestanas from '../components/Pestanas'
import Tabla from '../components/Tabla'
import Tarjeta from '../components/Tarjeta'
import { botonPrimario } from '../lib/Estilos'
import { pestanasInventario } from '../lib/pestanas'

// Qué se está haciendo con el formulario: nada, crear una nueva o renombrar una existente
type Modo = { tipo: 'nueva' } | { tipo: 'editar'; categoria: Categoria } | null

export default function Categorias() {
  const categorias = useCategorias()
  const eliminar = useEliminarCategoria()

  const [modo, setModo] = useState<Modo>(null)
  const [aviso, setAviso] = useState<DatosAviso | null>(null)
  const [confirmando, setConfirmando] = useState<number | null>(null)

  async function borrar(c: Categoria) {
    try {
      await eliminar.mutateAsync(c.id_categoria)
      setAviso({ tipo: 'ok', texto: `Categoría «${c.nombre}» eliminada` })
    } catch (e) {
      // 409: el backend no deja borrar una categoría que todavía tiene productos
      setAviso({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo eliminar la categoría' })
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
            setModo({ tipo: 'nueva' })
          }}
        >
          + Nueva categoría
        </button>
      </div>

      <Pestanas pestanas={pestanasInventario} />

      <Aviso aviso={aviso} />

      {modo && (
        <Tarjeta titulo={modo.tipo === 'nueva' ? 'Nueva categoría' : 'Editar categoría'}>
          <FormularioCategoria
            key={modo.tipo === 'editar' ? modo.categoria.id_categoria : 'nueva'}
            categoria={modo.tipo === 'editar' ? modo.categoria : undefined}
            onGuardado={(mensaje) => {
              setAviso({ tipo: 'ok', texto: mensaje })
              setModo(null)
            }}
            onCancelar={() => setModo(null)}
          />
        </Tarjeta>
      )}

      <Tarjeta>
        <Estado consulta={categorias}>
          {(filas) => (
            <Tabla
              filas={filas}
              clave={(c) => c.id_categoria}
              vacio="Todavía no hay categorías"
              columnas={[
                { titulo: 'Categoría', celda: (c) => c.nombre },
                { titulo: 'Productos', derecha: true, celda: (c) => c.total_productos },
                {
                  titulo: 'Acciones',
                  celda: (c) => (
                    <AccionesFila
                      nombre={c.nombre}
                      confirmando={confirmando === c.id_categoria}
                      pendiente={eliminar.isPending}
                      onEditar={() => {
                        setAviso(null)
                        setModo({ tipo: 'editar', categoria: c })
                      }}
                      onPedirEliminar={() => {
                        setAviso(null)
                        setConfirmando(c.id_categoria)
                      }}
                      onConfirmar={() => borrar(c)}
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