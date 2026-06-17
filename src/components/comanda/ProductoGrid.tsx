'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StickyNote } from 'lucide-react'
import NotasModal from './NotasModal'
import { formatPrecio } from '@/lib/utils'
import type { Categoria, Producto } from '@/types'

interface ProductoGridProps {
  onAgregar: (producto: Producto, cantidad: number, notas: string[]) => void
}

export default function ProductoGrid({ onAgregar }: ProductoGridProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [catActiva, setCatActiva] = useState<string | null>(null)
  const [modalProducto, setModalProducto] = useState<Producto | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const sb = createClient()
      const [{ data: cats }, { data: prods }] = await Promise.all([
        sb.from('categorias').select('*').eq('activo', true).order('orden'),
        sb.from('productos').select('*').eq('activo', true),
      ])
      setCategorias(cats ?? [])
      setProductos(prods ?? [])
      if (cats && cats.length > 0) setCatActiva(cats[0].id)
    }
    fetchData()
  }, [])

  const productosFiltrados = catActiva
    ? productos.filter(p => p.categoria_id === catActiva)
    : productos

  const catActivaObj = categorias.find(c => c.id === catActiva)

  return (
    <div className="flex flex-col h-full">
      {/* Tabs de categorías */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
        {categorias.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCatActiva(cat.id)}
            className={`flex-none flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
              ${catActiva === cat.id
                ? 'text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            style={catActiva === cat.id ? { backgroundColor: cat.color } : {}}
          >
            <span>{cat.icono}</span>
            <span>{cat.nombre}</span>
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {productosFiltrados.map(prod => (
            <div key={prod.id} className="bg-gray-800 rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex-1">
                <p className="text-white font-medium text-sm leading-tight">{prod.nombre}</p>
                <p className="text-indigo-400 font-bold text-lg mt-1">{formatPrecio(prod.precio)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onAgregar(prod, 1, [])}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold
                    py-2 rounded-xl transition-all active:scale-95"
                >
                  + Agregar
                </button>
                <button
                  onClick={() => setModalProducto(prod)}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-2 rounded-xl transition-all"
                  title="Agregar con notas"
                >
                  <StickyNote className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal notas */}
      {modalProducto && (
        <NotasModal
          categoriaId={modalProducto.categoria_id}
          notasSeleccionadas={[]}
          onConfirm={(notas) => {
            onAgregar(modalProducto, 1, notas)
            setModalProducto(null)
          }}
          onClose={() => setModalProducto(null)}
        />
      )}
    </div>
  )
}
