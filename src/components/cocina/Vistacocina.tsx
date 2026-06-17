'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { colorItem } from '@/lib/utils'
import { ChefHat, Clock } from 'lucide-react'
import type { Comanda, ComandaItem } from '@/types'

interface ComandaConItems extends Comanda {
  items: ComandaItem[]
}

export default function VistaCocina() {
  const [comandas, setComandas] = useState<ComandaConItems[]>([])

  const fetchComandas = async () => {
    const sb = createClient()
    const { data } = await sb
      .from('comandas')
      .select('*, mesa:mesas(numero), items:comanda_items(*)')
      .in('estado', ['enviada', 'en_preparacion'])
      .order('created_at')
    setComandas((data as any[]) ?? [])
  }

  useEffect(() => {
    fetchComandas()
    const sb = createClient()
    const channel = sb
      .channel('cocina-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comandas' }, fetchComandas)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comanda_items' }, fetchComandas)
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [])

  const marcarItem = async (itemId: string, estado: 'preparando' | 'listo') => {
    const sb = createClient()
    await sb.from('comanda_items').update({ estado }).eq('id', itemId)
    fetchComandas()
  }

  const marcarComandaLista = async (comandaId: string) => {
    const sb = createClient()
    await sb.from('comandas').update({ estado: 'lista' }).eq('id', comandaId)
    fetchComandas()
  }

  if (comandas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-gray-500">
        <ChefHat className="w-16 h-16 opacity-20" />
        <p className="text-lg">Sin comandas pendientes</p>
        <p className="text-sm">Las nuevas comandas aparecerán aquí automáticamente</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="flex items-center gap-3 mb-6">
        <ChefHat className="w-7 h-7 text-orange-400" />
        <h1 className="text-white text-xl font-bold">Vista Cocina</h1>
        <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
          {comandas.length} pendientes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {comandas.map(comanda => {
          const mins = Math.floor((Date.now() - new Date(comanda.created_at).getTime()) / 60000)
          return (
            <div key={comanda.id}
              className={`bg-gray-900 rounded-2xl overflow-hidden border-2
                ${comanda.estado === 'en_preparacion' ? 'border-yellow-600' : 'border-red-700'}`}
            >
              {/* Header tarjeta */}
              <div className={`px-4 py-3 flex items-center justify-between
                ${comanda.estado === 'en_preparacion' ? 'bg-yellow-900/40' : 'bg-red-900/40'}`}
              >
                <div>
                  <span className="text-white font-bold text-lg">
                    {(comanda as any).mesa?.numero ?? comanda.tipo.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-xs ml-2">#{comanda.id.slice(-4)}</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{mins}m</span>
                </div>
              </div>

              {/* Items */}
              <div className="p-3 space-y-2">
                {comanda.items.filter(i => i.estado !== 'entregado').map(item => (
                  <div key={item.id} className="bg-gray-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white font-medium text-sm">
                        {item.cantidad}x {item.producto_nombre}
                      </span>
                      <button
                        onClick={() => marcarItem(item.id, item.estado === 'pendiente' ? 'preparando' : 'listo')}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all
                          ${colorItem(item.estado)} hover:opacity-80`}
                      >
                        {item.estado}
                      </button>
                    </div>
                    {item.notas.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.notas.map(n => (
                          <span key={n} className="text-xs bg-orange-900/50 text-orange-300 px-1.5 py-0.5 rounded">
                            ⚠ {n}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Botón lista */}
              {comanda.items.every(i => i.estado === 'listo' || i.estado === 'entregado') && (
                <div className="px-3 pb-3">
                  <button
                    onClick={() => marcarComandaLista(comanda.id)}
                    className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-2.5
                      rounded-xl transition-all active:scale-95"
                  >
                    ✓ LISTA PARA SERVIR
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
