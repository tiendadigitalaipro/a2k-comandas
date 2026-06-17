'use client'
import { Trash2, ChefHat } from 'lucide-react'
import { formatPrecio, colorItem } from '@/lib/utils'
import type { ComandaItem } from '@/types'

interface ComandaItemsProps {
  items: ComandaItem[]
  total: number
  onEliminar: (itemId: string) => void
  onEnviar: () => void
  onCerrar: () => void
  enviando: boolean
}

export default function ComandaItems({ items, total, onEliminar, onEnviar, onCerrar, enviando }: ComandaItemsProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3 py-12">
        <ChefHat className="w-12 h-12 opacity-30" />
        <p className="text-sm">La comanda está vacía</p>
        <p className="text-xs">Agrega productos del menú</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Lista de items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {items.map(item => (
          <div key={item.id} className="bg-gray-800 rounded-xl p-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 font-bold text-sm">{item.cantidad}x</span>
                <span className="text-white font-medium text-sm truncate">{item.producto_nombre}</span>
              </div>
              {item.notas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.notas.map(n => (
                    <span key={n} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                      {n}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${colorItem(item.estado)}`}>
                  {item.estado}
                </span>
                <span className="text-white font-semibold text-sm">
                  {formatPrecio(item.cantidad * item.precio_unitario)}
                </span>
              </div>
            </div>
            <button
              onClick={() => onEliminar(item.id)}
              className="text-gray-600 hover:text-red-400 transition-colors mt-0.5 flex-none"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer con total y acciones */}
      <div className="px-4 py-4 bg-gray-900 border-t border-gray-800 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-medium">Total</span>
          <span className="text-white font-bold text-2xl">{formatPrecio(total)}</span>
        </div>
        <button
          onClick={onEnviar}
          disabled={enviando || items.every(i => i.estado !== 'pendiente')}
          className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white
            font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <ChefHat className="w-5 h-5" />
          {enviando ? 'Enviando...' : 'Enviar a Cocina'}
        </button>
        <button
          onClick={onCerrar}
          className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold
            py-3.5 rounded-2xl transition-all active:scale-95"
        >
          Marcar como Pagado ✓
        </button>
      </div>
    </div>
  )
}
