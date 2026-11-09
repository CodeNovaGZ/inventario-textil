// Error que lanzamos cuando algo sale mal al hablar con el backend
export class ErrorApi extends Error {
  status: number
  datos: unknown // el cuerpo completo de la respuesta de error (por ejemplo, el stock disponible)

  constructor(mensaje: string, status: number, datos: unknown = null) {
    super(mensaje)
    this.status = status
    this.datos = datos
  }
}

async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${ruta}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    })
  } catch {
    // fetch solo falla así cuando no hay conexión (backend apagado, sin red)
    throw new ErrorApi('No se pudo conectar con el servidor', 0)
  }

  if (res.status === 204) return undefined as T // DELETE exitoso: no trae cuerpo

  const cuerpo = await res.json().catch(() => null)

  if (!res.ok) {
    // Nuestro backend siempre responde { error: '...' } cuando algo falla
    throw new ErrorApi(cuerpo?.error ?? 'Error inesperado del servidor', res.status, cuerpo)
  }
  return cuerpo as T
}

export const api = {
  get: <T>(ruta: string) => pedir<T>(ruta),
  post: <T>(ruta: string, datos: unknown) =>
    pedir<T>(ruta, { method: 'POST', body: JSON.stringify(datos) }),
  put: <T>(ruta: string, datos: unknown) =>
    pedir<T>(ruta, { method: 'PUT', body: JSON.stringify(datos) }),
  delete: (ruta: string) => pedir<void>(ruta, { method: 'DELETE' }),
}

// { orden: 'cobertura', limite: 3, q: undefined } -> '?orden=cobertura&limite=3'
export function consulta(params: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams()
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== '' && valor !== false) p.set(clave, String(valor))
  }
  const texto = p.toString()
  return texto ? `?${texto}` : ''
}