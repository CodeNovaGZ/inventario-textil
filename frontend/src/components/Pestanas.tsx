import { NavLink } from 'react-router'

// Pestañas de navegación: cada una es una ruta, y la activa se resalta sola
export default function Pestanas({ pestanas }: { pestanas: { a: string; texto: string }[] }) {
  return (
    <nav aria-label="Secciones" className="flex gap-1 border-b border-borde">
      {pestanas.map(({ a, texto }) => (
        <NavLink
          key={a}
          to={a}
          end
          className={({ isActive }) =>
            `-mb-px border-b-2 px-4 py-2.5 text-sm ${
              isActive ? 'border-acento font-semibold text-acento' : 'border-transparent text-suave hover:text-tinta'
            }`
          }
        >
          {texto}
        </NavLink>
      ))}
    </nav>
  )
}