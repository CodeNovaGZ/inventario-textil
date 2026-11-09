import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, consulta } from './cliente'
import type {
  Categoria,
  CategoriaResumen,
  Movimiento,
  Producto,
  Proveedor,
  Resumen,
  SemanaResumen,
  TipoMovimiento,
  Motivo,
  Usuario, 
  MovimientoCreado,
  NuevoMovimiento,
  DatosProveedor,
  DatosProducto,
  DatosCategoria,   
} from './tipos'

export type FiltrosProductos = {
  q?: string
  id_categoria?: number
  stock_bajo?: boolean
  orden?: 'cobertura' | 'stock'
  limite?: number
}


export type FiltrosMovimientos = {
  tipo?: TipoMovimiento
  id_producto?: number
  id_motivo?: number
  id_usuario?: number
  desde?: string // AAAA-MM-DD
  hasta?: string // AAAA-MM-DD, incluye todo ese día
  limit?: number
  offset?: number
}

export const useResumen = () =>
  useQuery({ queryKey: ['resumen'], queryFn: () => api.get<Resumen>('/resumen') })

export const useSemanal = (semanas: number) =>
  useQuery({
    queryKey: ['resumen', 'semanal', semanas],
    queryFn: () => api.get<SemanaResumen[]>(`/resumen/semanal?semanas=${semanas}`),
  })

export const useCategoriasResumen = () =>
  useQuery({
    queryKey: ['resumen', 'categorias'],
    queryFn: () => api.get<CategoriaResumen[]>('/resumen/categorias'),
  })

// placeholderData: mientras llegan los resultados de un filtro nuevo, se siguen
// mostrando los anteriores (la tabla no parpadea)
export const useProductos = (filtros: FiltrosProductos) =>
  useQuery({
    queryKey: ['productos', filtros],
    queryFn: () => api.get<Producto[]>(`/productos${consulta(filtros)}`),
    placeholderData: keepPreviousData,
  })

export const useMovimientos = (filtros: FiltrosMovimientos) =>
  useQuery({
    queryKey: ['movimientos', filtros],
    queryFn: () => api.get<Movimiento[]>(`/movimientos${consulta(filtros)}`),
    placeholderData: keepPreviousData,
  })

export const useCategorias = () =>
  useQuery({ queryKey: ['categorias'], queryFn: () => api.get<Categoria[]>('/categorias') })

export const useProveedores = () =>
  useQuery({ queryKey: ['proveedores'], queryFn: () => api.get<Proveedor[]>('/proveedores') })

export const useMotivos = () =>
  useQuery({ queryKey: ['motivos'], queryFn: () => api.get<Motivo[]>('/motivos') })

export const useUsuarios = () =>
  useQuery({ queryKey: ['usuarios'], queryFn: () => api.get<Usuario[]>('/usuarios') })

export function useRegistrarMovimiento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: NuevoMovimiento) => api.post<MovimientoCreado>('/movimientos', datos),
    onSuccess: () => {
      // El movimiento cambió el stock, los indicadores, los gráficos y los historiales:
      // se marcan como desactualizados y TanStack Query los vuelve a pedir
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
    },
    onError: () => {
      // Si falló (por ejemplo, stock insuficiente), el stock que mostrábamos pudo quedar viejo
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

// Sin id crea un proveedor (POST); con id edita el existente (PUT)
export function useGuardarProveedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: DatosProveedor }) =>
      id === undefined
        ? api.post<unknown>('/proveedores', datos)
        : api.put<unknown>(`/proveedores/${id}`, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      // Los productos muestran el nombre de su proveedor: si cambió, esas listas quedaron viejas
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

export function useEliminarProveedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.delete(`/proveedores/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proveedores'] }),
  })
}

// Marca como desactualizados todos los datos que empiezan con alguna de estas claves
function invalidar(queryClient: QueryClient, claves: string[]) {
  for (const clave of claves) queryClient.invalidateQueries({ queryKey: [clave] })
}

// Un producto afecta a muchas pantallas: el inventario, el Panel, los historiales y
// los totales de productos que muestran las categorías y los proveedores
const CLAVES_DE_PRODUCTOS = ['productos', 'resumen', 'movimientos', 'categorias', 'proveedores']

// Sin id crea un producto (POST); con id edita el existente (PUT)
export function useGuardarProducto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: DatosProducto }) =>
      id === undefined
        ? api.post<unknown>('/productos', datos)
        : api.put<unknown>(`/productos/${id}`, datos),
    onSuccess: () => invalidar(queryClient, CLAVES_DE_PRODUCTOS),
  })
}

export function useEliminarProducto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.delete(`/productos/${id}`),
    onSuccess: () => invalidar(queryClient, CLAVES_DE_PRODUCTOS),
  })
}

// Sin id crea una categoría (POST); con id la renombra (PUT)
export function useGuardarCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: DatosCategoria }) =>
      id === undefined
        ? api.post<unknown>('/categorias', datos)
        : api.put<unknown>(`/categorias/${id}`, datos),
    // Los productos y el Panel muestran el nombre de la categoría: si cambió, quedaron viejos
    onSuccess: () => invalidar(queryClient, ['categorias', 'productos', 'resumen']),
  })
}

export function useEliminarCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.delete(`/categorias/${id}`),
    onSuccess: () => invalidar(queryClient, ['categorias']),
  })
}