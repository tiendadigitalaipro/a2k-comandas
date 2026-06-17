'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Plus } from 'lucide-react'
import type { NotaRapida } from '@/types'

interface NotasModalProps {
  categoriaId: string | null
  notasSeleccionadas: string[]
  onConfirm: (notas: string[]) => void
  onClose: () => void
}

export default function NotasModal({ categoriaId, notasSeleccionadas, onConfirm, onClose }: NotasModalProps) {
  const [notas, setNotas] = useState<NotaRapida[]>([])
  const [seleccionadas, setSeleccionadas] = useState<string[]>(notasSeleccionadas)
  const [custom, setCustom] = useState('')

  useEffect(() => {
    const fetchNotas = async () => {
      const sb = createClient()
      const query = sb.from('notas_rapidas').select('*').eq('activo', true)
      if (categoriaId) query.or(`categoria_id.is.null,categoria_id.eq.${categoriaId}`)
      else query.is('categoria_id', null)
      const { data } = await query
      setNotas(data ?? [])
    }
    fetchNotas()
  }, [categoriaId])

  const toggle = (texto: string) => {
    setSeleccionadas(prev =>
      prev.includes(texto) ? prev.filter(n => n !== texto) : [...prev, texto]
    )
  }

  const agregarCustom = () => {
    const t = custom.trim()
    if (!t || seleccionadas.includes(t)) return
    setSeleccionadas(prev => [...prev, t])
    setCustom('')
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
      <div className="bg-gray-900 w-full max-w-md rounded-t-3xl p-6 pb-safe">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Notas del ítem</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chips de notas rápidas */}
        <div className="flex flex-wrap gap-2 mb-4">
          {notas.map(nota => (
            <button
              key={nota.id}
              onClick={() => toggle(nota.texto)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${seleccionadas.includes(nota.texto)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {nota.texto}
            </button>
          ))}
        </div>

        {/* Nota personalizada */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregarCustom()}
            placeholder="Nota personalizada..."
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm
              placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={agregarCustom}
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-xl px-3 py-2.5"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Seleccionadas */}
        {seleccionadas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {seleccionadas.map(n => (
              <span key={n} className="bg-indigo-600/30 text-indigo-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                {n}
                <button onClick={() => toggle(n)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => onConfirm(seleccionadas)}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-95"
        >
          Confirmar notas
        </button>
      </div>
    </div>
  )
}
