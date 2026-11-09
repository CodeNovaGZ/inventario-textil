export type DatosAviso = { tipo: 'ok' | 'error'; texto: string }

// Mensaje de resultado de una acción: éxito (se anuncia con calma) o error (se anuncia de inmediato)
export default function Aviso({ aviso }: { aviso: DatosAviso | null }) {
  if (!aviso) return null

  return (
    <p
      role={aviso.tipo === 'ok' ? 'status' : 'alert'}
      className={`rounded-lg px-3 py-2 text-sm font-semibold ${
        aviso.tipo === 'ok' ? 'bg-ok/10 text-ok' : 'bg-peligro/10 text-peligro'
      }`}
    >
      {aviso.texto}
    </p>
  )
}