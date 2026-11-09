import { NavLink, Outlet } from 'react-router'

const enlaces = [
  { a: '/', texto: 'Panel' },
  { a: '/inventario', texto: 'Inventario' },
  { a: '/movimientos', texto: 'Movimientos' },
  { a: '/proveedores', texto: 'Proveedores' },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-lino text-tinta">
      <aside className="sticky h-screen top-0 flex w-56 shrink-0 flex-col gap-1 bg-tinta p-4">
        <div className="mb-6 font-bold text-white text-lg">COMPRO S.A.S</div>
        <nav className="flex flex-col gap-1">
          {enlaces.map(({ a, texto }) => (
            <NavLink
              key={a}
              to={a}
              end={a === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-sm hover:scale-105 my-3.5 ${
                  isActive ? 'bg-acento text-white' : 'text-slate-200 hover:bg-white/10'
                }`
              }
            >
              {texto}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 max-w-6xl flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}