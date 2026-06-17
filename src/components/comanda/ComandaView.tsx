'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useComanda } from '@/hooks/useComanda'
import ProductoGrid from './ProductoGrid'
import ComandaItems from './ComandaItems'
import { generarTicketCocina, imprimir } from '@/lib/escpos/printer'
import type { Mesa, Producto } from '@/types'
import { ShoppingCart, UtensilsCrossed } from 'lucide-react'

interface ComandaViewProps {
  mesa: Mesa
  meseroId: string
  onBack: () => void
}

type Tab = 'menu' | 'comanda'

export default function ComandaView({ mesa, meseroId, onBack }: ComandaViewProps) {
  const { comanda, items, fetchComanda, agregarItem, eliminarItem, enviarCocina, cerrarComanda } = useComanda(mesa.id)
  const [tab, setTab] = useState<Tab>('menu')
  const [enviando, setEnviando] = useState(false)

  const crearComandaSiNoExiste = async (): Promise<string> => {
    if (comanda) return comanda.id
    const sb = createClient()
    const { data } = await sb
      .from('comandas')
      .insert({ mesa_id: mesa.id, mesero_id: meseroId, tipo: 'mesa' })
      .select()
      .single()
    await fetchComanda()
    return data!.id
  }

  const handleAgregar = async (producto: Producto, cantidad: number, notas: string[]) => {
    const comandaId = await crearComandaSiNoExiste()
    await agregarItem(producto.id, producto.nombre, producto.precio, cantidad, notas, comandaId)
    setTab('comanda')
  }

  const handleEnviar = async () => {
    if (!comanda) return
    setEnviando(true)
    try {
      await enviarCocina(comanda.id)
      // Intentar imprimir ticket cocina
      const ticketBytes = generarTicketCocina(comanda, items)
      const resultado = await imprimir(ticketBytes)
      if (!resultado.ok) console.warn('Impresión falló:', resultado.error)
    } finally {
      setEnviando(false)
    }
  }

  const handleCerrar = async () => {
    if (!comanda) return
    await cerrarComanda(comanda.id)
    onBack()
  }

  const pendientes = items.filter(i => i.estado === 'pendiente').length

  return (
    <div className="h-full flex flex-col">
      {/* Info mesa */}
      <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 flex items-center justify-between flex-none">
        <div>
          <span className="text-white font-bold">Mesa {mesa.numero}</span>
          {comanda && (
            <span className="text-gray-400 text-xs ml-2">#{comanda.id.slice(-4)}</span>
          )}
        </div>
        {comanda && (
          <span className="text-indigo-400 font-bold text-sm">
            ${comanda.total.toFixed(2)}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 flex-none">
        <button
          onClick={() => setTab('menu')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors
            ${tab === 'menu' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500'}`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Menú
        </button>
        <button
          onClick={() => setTab('comanda')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors
            ${tab === 'comanda' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500'}`}
        >
          <ShoppingCart className="w-4 h-4" />
          Comanda
          {items.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${pendientes > 0 ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
              {items.length}
            </span>
          )}
        </button>
      </div>

      {/* Contenido tabs */}
      <div className="flex-1 overflow-hidden">
        {tab === 'menu' && <ProductoGrid onAgregar={handleAgregar} />}
        {tab === 'comanda' && (
          <ComandaItems
            items={items}
            total={comanda?.total ?? 0}
            onEliminar={eliminarItem}
            onEnviar={handleEnviar}
            onCerrar={handleCerrar}
            enviando={enviando}
          />
        )}
      </div>
    </div>
  )
}
