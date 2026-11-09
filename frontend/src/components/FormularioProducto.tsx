import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ErrorApi } from '../api/cliente'
import { useGuardarProducto } from '../api/hooks'
import type { Categoria, Producto, Proveedor } from '../api/tipos'
import { boton, botonPrimario, campo } from '../lib/Estilos'
import { metros } from '../lib/formato'
import { numero, texto } from '../lib/validaciones'
import Campo from './Campo'
import CampoSelect from './CampoSelect'
import CampoTexto from './CampoTexto'

const esquema = z.object({
  referencia: texto(20).min(1, 'La referencia es obligatoria'),
  nombre: texto(100).min(1, 'El nombre es obligatorio'),
  id_categoria: z.string().min(1, 'Elige una categoría'),
  id_proveedor: z.string().min(1, 'Elige un proveedor'),
  color: texto(40),
  precio_metro: numero('Escribe el precio por metro'),
  stock_inicial: numero('Escribe el stock inicial (0 si no hay)'),
  stock_minimo: numero('Escribe el stock mínimo (0 si no aplica)'),
})

type Formulario = z.infer<typeof esquema>

// Sirve para crear (sin `producto`) y para editar (con `producto`)
export default function FormularioProducto({
  producto,
  categorias,
  proveedores,
  onGuardado,
  onCancelar,
}: {
  producto?: Producto
  categorias: Categoria[]
  proveedores: Proveedor[]
  onGuardado: (mensaje: string) => void
  onCancelar: () => void
}) {
  const guardar = useGuardarProducto()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(esquema),
    defaultValues: {
      referencia: producto?.referencia ?? '',
      nombre: producto?.nombre ?? '',
      id_categoria: producto ? String(producto.id_categoria) : '',
      id_proveedor: producto ? String(producto.id_proveedor) : '',
      color: producto?.color ?? '',
      precio_metro: producto ? String(producto.precio_metro) : '',
      stock_inicial: '0',
      stock_minimo: producto ? String(producto.stock_minimo) : '0',
    },
  })

  async function enviar(v: Formulario) {
    try {
      await guardar.mutateAsync({
        id: producto?.id_producto,
        datos: {
          referencia: v.referencia,
          nombre: v.nombre,
          id_categoria: Number(v.id_categoria),
          id_proveedor: Number(v.id_proveedor),
          color: v.color,
          precio_metro: Number(v.precio_metro),
          stock_minimo: Number(v.stock_minimo),
          // El stock inicial solo se fija al crear; después el stock cambia con movimientos
          ...(producto ? {} : { stock_inicial: Number(v.stock_inicial) }),
        },
      })
      onGuardado(producto ? `Producto «${v.nombre}» actualizado` : `Producto «${v.nombre}» creado`)
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 409) {
        setError('referencia', { message: e.message }) // ya existe otro producto con esa referencia
      } else {
        setError('root.servidor', {
          message: e instanceof Error ? e.message : 'No se pudo guardar el producto',
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

      {/* Los id llevan prefijo "p-" porque la pantalla ya tiene otros campos (los filtros) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto etiqueta="Referencia" id="p-referencia" error={errors.referencia?.message} registro={register('referencia')} />
        <CampoTexto etiqueta="Nombre" id="p-nombre" error={errors.nombre?.message} registro={register('nombre')} />
        <CampoSelect
          etiqueta="Categoría"
          id="p-categoria"
          error={errors.id_categoria?.message}
          registro={register('id_categoria')}
          vacio="Elige una categoría"
          opciones={categorias.map((c) => ({ valor: c.id_categoria, texto: c.nombre }))}
        />
        <CampoSelect
          etiqueta="Proveedor"
          id="p-proveedor"
          error={errors.id_proveedor?.message}
          registro={register('id_proveedor')}
          vacio="Elige un proveedor"
          opciones={proveedores.map((p) => ({ valor: p.id_proveedor, texto: p.nombre }))}
        />
        <CampoTexto etiqueta="Color (opcional)" id="p-color" error={errors.color?.message} registro={register('color')} />
        <CampoTexto
          etiqueta="Precio por metro"
          id="p-precio"
          type="number"
          step="0.01"
          ayuda={producto ? 'El nuevo precio solo aplica a los movimientos futuros' : undefined}
          error={errors.precio_metro?.message}
          registro={register('precio_metro')}
        />
        {producto ? (
          <Campo etiqueta="Stock actual" id="p-stock-actual" ayuda="Cambia solo con movimientos de entrada y salida">
            <input id="p-stock-actual" readOnly value={metros(producto.stock_actual)} className={`${campo} bg-lino`} />
          </Campo>
        ) : (
          <CampoTexto
            etiqueta="Stock inicial (metros)"
            id="p-stock-inicial"
            type="number"
            step="0.01"
            ayuda="Lo que ya hay en bodega. Después solo cambia con movimientos"
            error={errors.stock_inicial?.message}
            registro={register('stock_inicial')}
          />
        )}
        <CampoTexto
          etiqueta="Stock mínimo (metros)"
          id="p-stock-minimo"
          type="number"
          step="0.01"
          ayuda="Por debajo de este valor se activa la alerta"
          error={errors.stock_minimo?.message}
          registro={register('stock_minimo')}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className={boton} onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={botonPrimario}>
          {isSubmitting ? 'Guardando…' : producto ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}