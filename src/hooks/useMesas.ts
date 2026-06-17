'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Mesa } from '@/types'

export function useMesas(areaId: string) {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMesas = useCallback(async () => {
    const sb = createClient()
    const { data } = await sb
      .from('mesas')
      .select('*')
      .eq('area_id', areaId)
      .order('numero')
    setMesas(data ?? [])
    setLoading(false)
  }, [areaId])

  useEffect(() => {
    fetchMesas()

    const sb = createClient()
    const channel = sb
      .channel(`mesas-${areaId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mesas',
        filter: `area_id=eq.${areaId}`,
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setMesas(prev =>
            prev.map(m => m.id === payload.new.id ? payload.new as Mesa : m)
          )
        }
      })
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [areaId, fetchMesas])

  return { mesas, loading, refetch: fetchMesas }
}
