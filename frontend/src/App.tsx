import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import Panel from './pages/Panel'
import Inventario from './pages/Inventario'
import Movimientos from './pages/Movimientos'
import Proveedores from './pages/Proveedores'
import NuevoMovimiento from './pages/NuevoMovimiento'
import Categorias from './pages/Categorias'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Panel />} />
        <Route path="inventario/categorias" element={<Categorias />} />
        <Route path="movimientos/nuevo" element={<NuevoMovimiento />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="movimientos" element={<Movimientos />} />
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="*" element={<p>Página no encontrada</p>} />
      </Route>
    </Routes>
  )
}