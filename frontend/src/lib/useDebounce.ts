import { useEffect, useState } from 'react'

// Devuelve el valor solo cuando deja de cambiar durante `espera` milisegundos
export function useDebounce<T>(valor: T, espera: number): T {
  const [retrasado, setRetrasado] = useState(valor)

  useEffect(() => {
    const temporizador = setTimeout(() => setRetrasado(valor), espera)
    return () => clearTimeout(temporizador)
  }, [valor, espera])

  return retrasado
}