import type { TipoMovimiento } from '../api/tipos'



const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
const numero = new Intl.NumberFormat('es-CO')

export const moneda = (n: number) => pesos.format(n)
export const metros = (n: number) => `${numero.format(n)} m`

// '2026-09-28' -> '28 sept'. Se agrega la hora para que no se interprete como UTC
// (sin ella, en Bogotá saldría el día anterior)
export const diaMes = (fecha: string) =>
  new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })


export const metrosConSigno = (tipo: TipoMovimiento, n: number) =>
  `${tipo === 'ENTRADA' ? '+' : '−'}${numero.format(n)} m`

// Las fechas llegan como '2026-11-07T11:27:00' (sin zona): new Date las toma como hora local
export const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

// 'Algodón Popelina' + 'Rojo' -> 'Algodón Popelina · Rojo' (el color es opcional)
export const conColor = (nombre: string, color: string | null) =>
  color ? `${nombre} · ${color}` : nombre