'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Comanda, ComandaItem } from '@/types'

export function useComanda(mesaId: string) {
  const [comanda, setComanda] = useState<Comanda | null>(null)
  const [items, setItems] = useState<ComandaItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchComanda = useCallback(async () => {
    const sb = createClient()
    const { data } = await sb
      .from('comandas')
      .select('*, mesa:mesas(*), mesero:meseros(*), items:comanda_items(*)')
      .eq('mesa_id', mesaId)
      .in('estado', ['abierta', 'enviada', 'en_preparacion', 'lista'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      const { items: rawItems, ...rest } = data as any
      setComanda(rest)
      setItems(rawItems ?? [])
    } else {
      setComanda(null)
      setItems([])
    }
    setLoading(false)
  }, [mesaId])

  useEffect(() => {
    fetchComanda()
  }, [fetchComanda])

  const agregarItem = async (
    productoId: string,
    productoNombre: string,
    precioUnitario: number,
    cantidad: number,
    notas: string[],
    comandaId: string
  ) => {
    const sb = createClient()
    const { data } = await sb
      .from('comanda_items')
      .insert({ comanda_id: comandaId, producto_id: productoId, producto_nombre: productoNombre,
                precio_unitario: precioUnitario, cantidad, notas })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data as ComandaItem])
    return data
  }

  const eliminarItem = async (itemId: string) => {
    const sb = createClient()
    await sb.from('comanda_items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  const enviarCocina = async (comandaId: string) => {
    const sb = createClient()
    const { data } = await sb
      .from('comandas')
      .update({ estado: 'enviada', updated_at: new Date().toISOString() })
      .eq('id', comandaId)
      .select()
      .single()
    if (data) setComanda(data as Comanda)
    return data
  }

  const cerrarComanda = async (comandaId: string) => {
    const sb = createClient()
    await sb.from('comandas').update({ estado: 'pagada' }).eq('id', comandaId)
    setComanda(null)
    setItems([])
  }

  return { comanda, items, loading, fetchComanda, agregarItem, eliminarItem, enviarCocina, cerrarComanda }
}
