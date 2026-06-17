'use client'
import { useMesas } from '@/hooks/useMesas'
import MesaCard from './MesaCard'
import type { Mesa } from '@/types'

interface MesaGridProps {
  areaId: string
  onSelectMesa: (mesa: Mesa) => void
}

const LEGEND = [
  { color: 'bg-green-500', label: 'Libre' },
  { color: 'bg-red-500',   label: 'Ocupado' },
  { color: 'bg-yellow-500',label: 'Reservado' },
  { color: 'bg-blue-500',  label: 'Limpieza' },
]

export default function MesaGrid({ areaId, onSelectMesa }: MesaGridProps) {
  const { mesas, loading } = useMesas(areaId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Leyenda */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {LEGEND.map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${l.color}`} />
            <span className="text-gray-400 text-xs">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Contadores */}
      <div className="flex gap-4 mb-5 text-sm">
        <span className="text-green-400 font-semibold">
          {mesas.filter(m => m.estado === 'disponible').length} libres
        </span>
        <span className="text-red-400 font-semibold">
          {mesas.filter(m => m.estado === 'ocupado').length} ocupadas
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {mesas.map(mesa => (
          <MesaCard key={mesa.id} mesa={mesa} onClick={onSelectMesa} />
        ))}
      </div>

      {mesas.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          No hay mesas en esta área
        </div>
      )}
    </div>
  )
}
