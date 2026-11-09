import type { ReactNode } from 'react'

export type Columna<T> = {
  titulo: string
  celda: (fila: T) => ReactNode
  derecha?: boolean
}

export default function Tabla<T>({
  columnas,
  filas,
  clave,
  vacio,
}: {
  columnas: Columna<T>[]
  filas: T[]
  clave: (fila: T) => string | number
  vacio: string
}) {
  if (filas.length === 0) return <p className="py-8 text-center text-suave">{vacio}</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-suave">
            {columnas.map((c) => (
              <th key={c.titulo} className={`py-3 pr-4 font-semibold ${c.derecha ? 'text-right' : ''}`}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={clave(fila)} className="border-t border-borde">
              {columnas.map((c) => (
                <td key={c.titulo} className={`py-3 pr-4 ${c.derecha ? 'text-right' : ''}`}>
                  {c.celda(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}