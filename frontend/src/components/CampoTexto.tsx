import type { UseFormRegisterReturn } from 'react-hook-form'
import { campo, campoError } from '../lib/Estilos'
import Campo from './Campo'

// Un campo de texto completo (etiqueta + input + error/ayuda) conectado a React Hook Form.
// `registro` es lo que devuelve register('nombreDelCampo')
export default function CampoTexto({
  etiqueta,
  id,
  error,
  ayuda,
  registro,
  type = 'text',
  step,
}: {
  etiqueta: string
  id: string
  error?: string
  ayuda?: string
  registro: UseFormRegisterReturn
  type?: 'text' | 'email' | 'tel' | 'number'
  step?: string
}) {
  return (
    <Campo etiqueta={etiqueta} id={id} error={error} ayuda={ayuda}>
      <input
        id={id}
        type={type}
        step={step}
        inputMode={type === 'number' ? 'decimal' : undefined}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined}
        className={error ? campoError : campo}
        {...registro}
      />
    </Campo>
  )
}