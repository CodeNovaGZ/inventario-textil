import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ErrorApi } from '../api/cliente'
import { useGuardarProveedor } from '../api/hooks'
import type { Proveedor } from '../api/tipos'
import { boton, botonPrimario } from '../lib/Estilos'
import CampoTexto from './CampoTexto'
import { texto } from '../lib/validaciones'

const esquema = z.object({
  nit: texto(20).min(1, 'El NIT es obligatorio'),
  nombre: texto(150).min(1, 'El nombre es obligatorio'),
  contacto: texto(100),
  telefono: texto(30),
  correo: texto(120).refine(
    (v) => v === '' || /^\S+@\S+\.\S+$/.test(v),
    'Escribe un correo válido, por ejemplo nombre@empresa.com',
  ),
  ciudad: texto(80),
})

type Formulario = z.infer<typeof esquema>

// Sirve para crear (sin `proveedor`) y para editar (con `proveedor`)
export default function FormularioProveedor({
  proveedor,
  onGuardado,
  onCancelar,
}: {
  proveedor?: Proveedor
  onGuardado: (mensaje: string) => void
  onCancelar: () => void
}) {
  const guardar = useGuardarProveedor()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(esquema),
    // En edición los campos arrancan con los datos actuales (la base guarda null si falta algo)
    defaultValues: {
      nit: proveedor?.nit ?? '',
      nombre: proveedor?.nombre ?? '',
      contacto: proveedor?.contacto ?? '',
      telefono: proveedor?.telefono ?? '',
      correo: proveedor?.correo ?? '',
      ciudad: proveedor?.ciudad ?? '',
    },
  })

  async function enviar(datos: Formulario) {
    try {
      await guardar.mutateAsync({ id: proveedor?.id_proveedor, datos })
      onGuardado(
        proveedor ? `Proveedor «${datos.nombre}» actualizado` : `Proveedor «${datos.nombre}» creado`,
      )
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 409) {
        setError('nit', { message: e.message }) // ya existe otro proveedor con ese NIT
      } else {
        setError('root.servidor', {
          message: e instanceof Error ? e.message : 'No se pudo guardar el proveedor',
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

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto etiqueta="NIT" id="nit" error={errors.nit?.message} registro={register('nit')} />
        <CampoTexto etiqueta="Nombre" id="nombre" error={errors.nombre?.message} registro={register('nombre')} />
        <CampoTexto etiqueta="Contacto" id="contacto" error={errors.contacto?.message} registro={register('contacto')} />
        <CampoTexto etiqueta="Teléfono" id="telefono" type="tel" error={errors.telefono?.message} registro={register('telefono')} />
        <CampoTexto etiqueta="Correo" id="correo" type="email" error={errors.correo?.message} registro={register('correo')} />
        <CampoTexto etiqueta="Ciudad" id="ciudad" error={errors.ciudad?.message} registro={register('ciudad')} />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className={boton} onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={botonPrimario}>
          {isSubmitting ? 'Guardando…' : proveedor ? 'Guardar cambios' : 'Crear proveedor'}
        </button>
      </div>
    </form>
  )
}