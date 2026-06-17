'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Delete } from 'lucide-react'

const TECLAS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

interface PinLoginProps {
  onLogin: (mesero: { id: string; nombre: string }) => void
}

export default function PinLogin({ onLogin }: PinLoginProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const presionar = (tecla: string) => {
    if (tecla === '⌫') {
      setPin(p => p.slice(0, -1))
      setError('')
      return
    }
    if (pin.length >= 6) return
    const nuevo = pin + tecla
    setPin(nuevo)
    if (nuevo.length >= 4) verificar(nuevo)
  }

  const verificar = async (codigo: string) => {
    setLoading(true)
    setError('')
    const sb = createClient()
    const { data } = await sb
      .from('meseros')
      .select('id, nombre')
      .eq('codigo_pin', codigo)
      .eq('activo', true)
      .single()

    if (data) {
      onLogin(data)
    } else {
      setError('PIN incorrecto')
      setTimeout(() => { setPin(''); setError('') }, 800)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍽️</div>
          <h1 className="text-2xl font-bold text-white">A2K Comandas</h1>
          <p className="text-gray-400 text-sm mt-1">Ingresa tu PIN de mesero</p>
        </div>

        {/* Display PIN */}
        <div className={`flex justify-center gap-3 mb-8 transition-all ${error ? 'animate-pulse' : ''}`}>
          {[0,1,2,3,4,5].map(i => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all
                ${i < pin.length
                  ? error ? 'bg-red-500 border-red-400' : 'bg-indigo-500 border-indigo-400'
                  : 'bg-gray-800 border-gray-600'}`}
            >
              {i < pin.length && <div className="w-3 h-3 bg-white rounded-full" />}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-center text-sm mb-4">{error}</p>
        )}

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-3">
          {TECLAS.map((tecla, i) => {
            if (tecla === '') return <div key={i} />
            return (
              <button
                key={i}
                onClick={() => presionar(tecla)}
                disabled={loading}
                className={`h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95
                  ${tecla === '⌫'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-800 text-white hover:bg-gray-700 active:bg-indigo-600'
                  } disabled:opacity-50`}
              >
                {tecla === '⌫' ? <Delete className="mx-auto w-5 h-5" /> : tecla}
              </button>
            )
          })}
        </div>

        {loading && (
          <div className="text-center mt-6">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
      </div>
    </div>
  )
}
