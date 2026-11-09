import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'

// Resuelve los tres casos de toda consulta (cargando, error, datos) en un solo lugar
export default function Estado<T>({
  consulta,
  children,
}: {
  consulta: UseQueryResult<T>
  children: (datos: T) => ReactNode
}) {
  if (consulta.isPending) return <p className="text-suave">Cargando…</p>
  if (consulta.isError) {
    return (
      <p role="alert" className="rounded-lg bg-peligro/10 px-3 py-2 text-sm text-peligro">
        No se pudo cargar la información: {consulta.error.message}
      </p>
    )
  }
  return <>{children(consulta.data)}</>
}