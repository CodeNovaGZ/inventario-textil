import { useMotivos, useProductos, useUsuarios } from '../api/hooks'
import Estado from '../components/Estado'
import FormularioMovimiento from '../components/FormularioMovimiento'

export default function NuevoMovimiento() {
  const productos = useProductos({})
  const motivos = useMotivos()
  const usuarios = useUsuarios()

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Registrar movimiento</h1>

      {/* El formulario solo se dibuja cuando las tres listas ya llegaron */}
      <Estado consulta={productos}>
        {(listaProductos) => (
          <Estado consulta={motivos}>
            {(listaMotivos) => (
              <Estado consulta={usuarios}>
                {(listaUsuarios) => (
                  <FormularioMovimiento
                    productos={listaProductos}
                    motivos={listaMotivos}
                    usuarios={listaUsuarios}
                  />
                )}
              </Estado>
            )}
          </Estado>
        )}
      </Estado>
    </div>
  )
}