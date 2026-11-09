const colores = { normal: 'text-tinta', ok: 'text-ok', alerta: 'text-peligro' }

export default function Indicador({
  titulo,
  valor,
  tono = 'normal',
}: {
  titulo: string
  valor: string
  tono?: keyof typeof colores
}) {
  return (
    <div className="rounded-xl border border-borde bg-white p-4">
      <div className="text-sm text-suave">{titulo}</div>
      <div className={`mt-1.5 text-2xl font-bold ${colores[tono]}`}>{valor}</div>
    </div>
  )
}