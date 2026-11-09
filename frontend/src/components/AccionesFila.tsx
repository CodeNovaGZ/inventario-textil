import { botonChico, botonPeligro } from '../lib/Estilos'

// Los botones Editar / Eliminar de una fila. Al eliminar, la fila pide confirmación.
// `nombre` identifica la fila para los lectores de pantalla ("Editar REF-01009")
export default function AccionesFila({
  nombre,
  confirmando,
  pendiente,
  onEditar,
  onPedirEliminar,
  onConfirmar,
  onCancelar,
}: {
  nombre: string
  confirmando: boolean
  pendiente: boolean
  onEditar: () => void
  onPedirEliminar: () => void
  onConfirmar: () => void
  onCancelar: () => void
}) {
  if (confirmando) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs font-semibold text-peligro">¿Eliminar?</span>
        <button className={botonPeligro} disabled={pendiente} onClick={onConfirmar}>
          Sí, eliminar
        </button>
        <button className={botonChico} onClick={onCancelar}>
          Cancelar
        </button>
      </span>
    )
  }

  return (
    <span className="flex gap-2">
      <button className={botonChico} aria-label={`Editar ${nombre}`} onClick={onEditar}>
        Editar
      </button>
      <button className={`${botonChico} text-peligro`} aria-label={`Eliminar ${nombre}`} onClick={onPedirEliminar}>
        Eliminar
      </button>
    </span>
  )
}