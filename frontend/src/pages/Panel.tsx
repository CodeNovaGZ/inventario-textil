
import Estado from '../components/Estado'
import Indicador from '../components/Indicador'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Tarjeta from '../components/Tarjeta'
import { useCategoriasResumen, useMovimientos, useResumen, useSemanal, useProductos } from '../api/hooks'
import Tabla from '../components/Tabla'
import { conColor, diaMes, fechaHora, metros, metrosConSigno, moneda } from '../lib/formato'
import { Link } from 'react-router'
import { botonPrimario } from '../lib/Estilos'

export default function Panel() {
  const resumen = useResumen()
  const semanal = useSemanal(6)
  const categorias = useCategoriasResumen()
  const ultimos = useMovimientos({ limit: 5 })
  const cobertura = useProductos({ orden: 'cobertura', limite: 3 })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Panel de inventario</h1>
        <Link to="/movimientos/nuevo" className={botonPrimario}>
            + Registrar movimiento
        </Link>
      </div>

      <Estado consulta={resumen}>
        {(r) => (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Indicador titulo="Valor del inventario" valor={moneda(r.valor_inventario)} />
            <Indicador titulo="Metros en bodega" valor={metros(r.metros_totales)} />
            <Indicador titulo="Productos activos" valor={String(r.productos)} />
            <Indicador
              titulo="Bajo el stock mínimo"
              valor={String(r.bajo_minimo)}
              tono={r.bajo_minimo > 0 ? 'alerta' : 'ok'}
            />
          </div>

          
        )}
      </Estado>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Tarjeta titulo="Entradas y salidas por semana (metros)">
            <Estado consulta={semanal}>
            {(semanas) => (
                <ResponsiveContainer width="100%" height={240}>
                <BarChart data={semanas.map((s) => ({ ...s, etiqueta: diaMes(s.semana) }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="etiqueta" />
                    <YAxis />
                    <Tooltip formatter={(v) => metros(Number(v))} />
                    <Legend />
                    <Bar dataKey="entradas" name="Entradas" fill="#2f4b7c" />
                    <Bar dataKey="salidas" name="Salidas" fill="#b45309" />
                </BarChart>
                </ResponsiveContainer>
            )}
            </Estado>
        </Tarjeta>

        <Tarjeta titulo="Valor por categoría">
            <Estado consulta={categorias}>
            {(datos) => (
                <ResponsiveContainer width="100%" height={240}>
                <BarChart data={datos} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `${Number(v) / 1_000_000} M`} />
                    <YAxis type="category" dataKey="categoria" width={90} />
                    <Tooltip formatter={(v) => moneda(Number(v))} />
                    <Bar dataKey="valor" name="Valor" fill="#2f4b7c" />
                </BarChart>
                </ResponsiveContainer>
            )}
            </Estado>
        </Tarjeta>
        <Tarjeta titulo="Últimos movimientos">
            <Estado consulta={ultimos}>
                {(filas) => (
                <Tabla
                    filas={filas}
                    clave={(m) => m.id_movimiento}
                    vacio="Todavía no hay movimientos"
                    columnas={[
                    { titulo: 'Fecha', celda: (m) => fechaHora(m.fecha) },
                    { titulo: 'Producto', celda: (m) => conColor(m.producto, m.color) },
                    { titulo: 'Motivo', celda: (m) => m.motivo },
                    {
                        titulo: 'Metros',
                        derecha: true,
                        celda: (m) => (
                        <span className={m.tipo === 'ENTRADA' ? 'text-ok' : 'text-alerta'}>
                            {metrosConSigno(m.tipo, m.cantidad_metros)}
                        </span>
                        ),
                    },
                    ]}
                />
                )}
            </Estado>
        </Tarjeta>
        <Tarjeta titulo="Alertas de stock">
            <Estado consulta={resumen}>
                {(r) =>
                r.bajo_minimo === 0 ? (
                    <p className="rounded-lg bg-ok/10 px-3 py-2 text-sm font-semibold text-ok">
                    Ningún producto está bajo el mínimo
                    </p>
                ) : (
                    <p role="alert" className="rounded-lg bg-peligro/10 px-3 py-2 text-sm font-semibold text-peligro">
                    {r.bajo_minimo} {r.bajo_minimo === 1 ? 'producto está' : 'productos están'} bajo el mínimo
                    </p>
                )
                }
            </Estado>
            <p className="text-xs text-suave">Menor cobertura (stock / mínimo)</p>
            <Estado consulta={cobertura}>
                {(productos) => (
                <ul className="flex flex-col gap-2 text-sm">
                    {productos.map((p) => (
                    <li key={p.id_producto} className="flex justify-between gap-2">
                        <span>{conColor(p.nombre, p.color)}</span>
                        <span className={p.stock_bajo ? 'font-semibold text-peligro' : ''}>
                        {metros(p.stock_actual)} de {p.stock_minimo}
                        </span>
                    </li>
                    ))}
                </ul>
                )}
            </Estado>
        </Tarjeta>
      </div>
    </div>
  )
}