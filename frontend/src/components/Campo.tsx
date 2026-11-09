import type { ReactNode } from 'react'

// Una etiqueta unida al control que describe (input, select...), con ayuda y error opcionales.
// El control debe tener el mismo `id`; si hay error o ayuda, puede apuntar a ellos con
// aria-describedby={`${id}-error`} o aria-describedby={`${id}-ayuda`}
export default function Campo({
  etiqueta,
  id,
  error,
  ayuda,
  children,
}: {
  etiqueta: string
  id: string
  error?: string
  ayuda?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-suave">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-semibold text-peligro">
          {error}
        </p>
      ) : (
        ayuda && (
          <span id={`${id}-ayuda`} className="text-xs text-suave">
            {ayuda}
          </span>
        )
      )}
    </div>
  )
}
