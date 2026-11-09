import type { UseFormRegisterReturn } from 'react-hook-form'
import { campo, campoError } from '../lib/Estilos'
import Campo from './Campo'

// Un desplegable completo (etiqueta + select + error) conectado a React Hook Form
export default function CampoSelect({
  etiqueta,
  id,
  error,
  registro,
  vacio,
  opciones,
}: {
  etiqueta: string
  id: string
  error?: string
  registro: UseFormRegisterReturn
  vacio: string // texto de la primera opción, la que no elige nada
  opciones: { valor: number; texto: string }[]
}) {
  return (
    <Campo etiqueta={etiqueta} id={id} error={error}>
      <select
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={error ? campoError : campo}
        {...registro}
      >
        <option value="">{vacio}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </Campo>
  )
}