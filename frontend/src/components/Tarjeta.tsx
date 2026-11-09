import type { ReactNode } from 'react'

export default function Tarjeta({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-borde bg-white p-5">
      {titulo && <h2 className="text-base font-semibold">{titulo}</h2>}
      {children}
    </section>
  )
}