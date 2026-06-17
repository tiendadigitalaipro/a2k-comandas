'use client'
import type { Mesa } from '@/types'
import { colorMesa, labelMesa } from '@/lib/utils'
import { Users } from 'lucide-react'

interface MesaCardProps {
  mesa: Mesa
  onClick: (mesa: Mesa) => void
}

export default function MesaCard({ mesa, onClick }: MesaCardProps) {
  return (
    <button
      onClick={() => onClick(mesa)}
      className={`relative w-full aspect-square rounded-2xl border-2 flex flex-col items-center
        justify-center gap-1 transition-all active:scale-95 shadow-lg ${colorMesa(mesa.estado)}`}
    >
      <span className="text-white font-bold text-xl">{mesa.numero}</span>
      <span className="text-white/80 text-xs font-medium">{labelMesa(mesa.estado)}</span>
      <div className="flex items-center gap-1 text-white/60 text-xs">
        <Users className="w-3 h-3" />
        <span>{mesa.capacidad}</span>
      </div>
    </button>
  )
}
