import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ErrorApi } from '../api/cliente'
import { useGuardarCategoria } from '../api/hooks'
import type { Categoria } from '../api/tipos'
import { boton, botonPrimario } from '../lib/Estilos'
import { texto } from '../lib/validaciones'
import CampoTexto from './CampoTexto'

const esquema = z.object({ nombre: texto(50).min(1, 'El nombre es obligatorio') })

type Formulario = z.infer<typeof esquema>

// Sirve para crear (sin `categoria`) y para renombrar (con `categoria`)
export default function FormularioCategoria({
  categoria,
  onGuardado,
  onCancelar,
}: {
  categoria?: Categoria
  onGuardado: (mensaje: string) => void
  onCancelar: () => void
}) {
  const guardar = useGuardarCategoria()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(esquema),
    defaultValues: { nombre: categoria?.nombre ?? '' },
  })

  async function enviar(datos: Formulario) {
    try {
      await guardar.mutateAsync({ id: categoria?.id_categoria, datos })
      onGuardado(
        categoria ? `Categoría «${datos.nombre}» actualizada` : `Categoría «${datos.nombre}» creada`,
      )
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 409) {
        setError('nombre', { message: e.message }) // ya existe una categoría con ese nombre
      } else {
        setError('root.servidor', {
          message: e instanceof Error ? e.message : 'No se pudo guardar la categoría',
        })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="flex flex-col gap-5">
      {errors.root?.servidor && (
        <p role="alert" className="rounded-lg bg-peligro/10 px-3 py-2 text-sm font-semibold text-peligro">
          {errors.root.servidor.message}
        </p>
      )}

      <div className="max-w-sm">
        <CampoTexto etiqueta="Nombre" id="nombre" error={errors.nombre?.message} registro={register('nombre')} />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className={boton} onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={botonPrimario}>
          {isSubmitting ? 'Guardando…' : categoria ? 'Guardar cambios' : 'Crear categoría'}
        </button>
      </div>
    </form>
  )
}