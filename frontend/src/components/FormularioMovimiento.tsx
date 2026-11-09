import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { ErrorApi } from '../api/cliente'
import { useRegistrarMovimiento } from '../api/hooks'
import type { Motivo, Producto, Usuario } from '../api/tipos'
import { boton, botonPrimario, campo, campoError } from '../lib/Estilos'
import { conColor, metros, moneda } from '../lib/formato'
import Campo from './Campo'
import Tarjeta from './Tarjeta'

// Las reglas del formulario. Los campos HTML siempre entregan texto, por eso todo es string
const esquema = z.object({
  tipo: z.enum(['ENTRADA', 'SALIDA']),
  id_motivo: z.string().min(1, 'Elige un motivo'),
  id_producto: z.string().min(1, 'Elige un producto'),
  cantidad: z
    .string()
    .min(1, 'Escribe la cantidad')
    .refine((v) => Number(v) > 0, 'La cantidad debe ser mayor a 0')
    .refine((v) => Number(v) <= 99_999_999, 'La cantidad es demasiado grande'),
  id_usuario: z.string().min(1, 'Elige quién registra el movimiento'),
})

// El tipo del formulario se deduce del esquema: una sola fuente de verdad
type Formulario = z.infer<typeof esquema>

const ULTIMO_USUARIO = 'ultimoUsuario'

// Recuerda quién registró el último movimiento (si ese usuario todavía existe)
function usuarioInicial(usuarios: Usuario[]): string {
  const guardado = localStorage.getItem(ULTIMO_USUARIO)
  return usuarios.some((u) => String(u.id_usuario) === guardado) ? (guardado ?? '') : ''
}

export default function FormularioMovimiento({
  productos,
  motivos,
  usuarios,
}: {
  productos: Producto[]
  motivos: Motivo[]
  usuarios: Usuario[]
}) {
  const registrar = useRegistrarMovimiento()
  const [exito, setExito] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(esquema),
    defaultValues: {
      tipo: 'SALIDA',
      id_motivo: '',
      id_producto: '',
      cantidad: '',
      id_usuario: usuarioInicial(usuarios),
    },
  })

  // useWatch: el componente se vuelve a dibujar cuando cambian estos campos
  const tipo = useWatch({ control, name: 'tipo' })
  const cantidad = useWatch({ control, name: 'cantidad' })
  const idProducto = useWatch({ control, name: 'id_producto' })
  const producto = productos.find((p) => String(p.id_producto) === idProducto)
  const motivosDelTipo = motivos.filter((m) => m.tipo === tipo)
  const valorTotal = producto ? Number(cantidad || 0) * producto.precio_metro : 0

  async function enviar(v: Formulario) {
    setExito(null)
    try {
      const creado = await registrar.mutateAsync({
        id_producto: Number(v.id_producto),
        id_motivo: Number(v.id_motivo),
        id_usuario: Number(v.id_usuario),
        cantidad_metros: Number(v.cantidad),
      })
      localStorage.setItem(ULTIMO_USUARIO, v.id_usuario)
      setExito(`Movimiento n.º ${creado.id_movimiento} registrado`)
      // Se limpia lo que cambia en cada movimiento; el tipo y el usuario se conservan
      reset({ tipo: v.tipo, id_motivo: '', id_producto: '', cantidad: '', id_usuario: v.id_usuario })
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 409) {
        // 409: el backend rechazó la salida. Su respuesta trae el stock disponible
        const stock = (e.datos as { stock_actual?: number } | null)?.stock_actual
        setError('cantidad', {
          message:
            stock === undefined ? e.message : `Stock insuficiente: solo hay ${metros(stock)} disponibles`,
        })
      } else {
        setError('root.servidor', {
          message: e instanceof Error ? e.message : 'No se pudo registrar el movimiento',
        })
      }
    }
  }

  return (
    <Tarjeta>
      <form onSubmit={handleSubmit(enviar)} noValidate className="flex  flex-col gap-5">
        {exito && (
          <p role="status" className="rounded-lg bg-ok/10 px-3 py-2 text-sm font-semibold text-ok">
            {exito}
          </p>
        )}
        {errors.root?.servidor && (
          <p role="alert" className="rounded-lg bg-peligro/10 px-3 py-2 text-sm font-semibold text-peligro">
            {errors.root.servidor.message}
          </p>
        )}

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm text-suave">Tipo</legend>
          <div className="flex gap-3">
            {(['ENTRADA', 'SALIDA'] as const).map((t) => (
              <label
                key={t}
                className={`flex min-h-11 flex-1 items-center gap-2 rounded-lg px-3 text-sm ${
                  tipo === t ? 'border-2 border-acento font-semibold' : 'border border-slate-400'
                }`}
              >
                <input
                  type="radio"
                  value={t}
                  {...register('tipo', { onChange: () => setValue('id_motivo', '') })}
                />
                {t === 'ENTRADA' ? 'Entrada' : 'Salida'}
              </label>
            ))}
          </div>
        </fieldset>

        <Campo etiqueta="Motivo" id="motivo" error={errors.id_motivo?.message}>
          <select
            id="motivo"
            aria-invalid={!!errors.id_motivo}
            aria-describedby={errors.id_motivo ? 'motivo-error' : undefined}
            className={errors.id_motivo ? campoError : campo}
            {...register('id_motivo')}
          >
            <option value="">Elige un motivo</option>
            {motivosDelTipo.map((m) => (
              <option key={m.id_motivo} value={m.id_motivo}>
                {m.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          etiqueta="Producto"
          id="producto"
          error={errors.id_producto?.message}
          ayuda={producto ? `Stock actual: ${metros(producto.stock_actual)} · Mínimo: ${producto.stock_minimo} m` : undefined}
        >
          <select
            id="producto"
            aria-invalid={!!errors.id_producto}
            aria-describedby={errors.id_producto ? 'producto-error' : producto ? 'producto-ayuda' : undefined}
            className={errors.id_producto ? campoError : campo}
            {...register('id_producto')}
          >
            <option value="">Elige un producto</option>
            {productos.map((p) => (
              <option key={p.id_producto} value={p.id_producto}>
                {p.referencia} · {conColor(p.nombre, p.color)}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Cantidad (metros)" id="cantidad" error={errors.cantidad?.message}>
          <input
            id="cantidad"
            type="number"
            step="0.01"
            inputMode="decimal"
            aria-invalid={!!errors.cantidad}
            aria-describedby={errors.cantidad ? 'cantidad-error' : undefined}
            className={errors.cantidad ? campoError : campo}
            {...register('cantidad')}
          />
        </Campo>

        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Precio por metro" id="precio">
            <input
              id="precio"
              readOnly
              value={producto ? moneda(producto.precio_metro) : ''}
              className={`${campo} bg-lino`}
            />
          </Campo>
          <Campo etiqueta="Valor total" id="valor">
            <input id="valor" readOnly value={producto ? moneda(valorTotal) : ''} className={`${campo} bg-lino`} />
          </Campo>
        </div>

        <Campo etiqueta="Registrado por" id="usuario" error={errors.id_usuario?.message}>
          <select
            id="usuario"
            aria-invalid={!!errors.id_usuario}
            aria-describedby={errors.id_usuario ? 'usuario-error' : undefined}
            className={errors.id_usuario ? campoError : campo}
            {...register('id_usuario')}
          >
            <option value="">Elige quién registra</option>
            {usuarios.map((u) => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {u.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <div className="flex justify-end gap-3">
          <Link to="/movimientos" className={`${boton} inline-flex items-center`}>
            Cancelar
          </Link>
          <button type="submit" disabled={isSubmitting} className={botonPrimario}>
            {isSubmitting ? 'Registrando…' : 'Registrar movimiento'}
          </button>
        </div>
      </form>
    </Tarjeta>
  )
}