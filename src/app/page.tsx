'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PinLogin from '@/components/auth/PinLogin'
import MesaGrid from '@/components/mesas/MesaGrid'
import ComandaView from '@/components/comanda/ComandaView'
import VistaCocina from '@/components/cocina/Vistacocina'
import type { Mesa, Area } from '@/types'
import { ChefHat, LogOut, ArrowLeft } from 'lucide-react'

type Pantalla = 'login' | 'areas' | 'mesas' | 'comanda' | 'cocina'

interface Mesero { id: string; nombre: string }

export default function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('login')
  const [mesero, setMesero] = useState<Mesero | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [areaActiva, setAreaActiva] = useState<Area | null>(null)
  const [mesaActiva, setMesaActiva] = useState<Mesa | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('a2k_mesero')
    if (saved) { setMesero(JSON.parse(saved)); setPantalla('areas') }
  }, [])

  useEffect(() => {
    if (pantalla === 'areas') {
      const fetchAreas = async () => {
        const sb = createClient()
        const { data } = await sb.from('areas').select('*').eq('activo', true).order('orden')
        setAreas(data ?? [])
      }
      fetchAreas()
    }
  }, [pantalla])

  const handleLogin = (m: Mesero) => {
    setMesero(m)
    localStorage.setItem('a2k_mesero', JSON.stringify(m))
    setPantalla('areas')
  }

  const handleLogout = () => {
    setMesero(null)
    localStorage.removeItem('a2k_mesero')
    setPantalla('login')
  }

  const handleSelectArea = (area: Area) => {
    setAreaActiva(area)
    setPantalla('mesas')
  }

  const handleSelectMesa = (mesa: Mesa) => {
    setMesaActiva(mesa)
    setPantalla('comanda')
  }

  const handleBack = () => {
    if (pantalla === 'comanda') { setPantalla('mesas'); setMesaActiva(null) }
    else if (pantalla === 'mesas') { setPantalla('areas'); setAreaActiva(null) }
    else if (pantalla === 'cocina') setPantalla('areas')
  }

  const showBack = ['mesas', 'comanda', 'cocina'].includes(pantalla)
  const showHeader = pantalla !== 'login'

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      {showHeader && (
        <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 flex-none">
          <div className="flex items-center gap-3">
            {showBack && (
              <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-lg">🍽️</span>
              <div>
                <span className="text-white font-semibold text-sm">A2K Comandas</span>
                {mesero && <p className="text-gray-400 text-xs">{mesero.nombre}</p>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pantalla === 'areas' && (
              <button
                onClick={() => setPantalla('cocina')}
                className="flex items-center gap-1.5 bg-orange-600/20 text-orange-400 px-3 py-1.5
                  rounded-xl text-xs font-medium hover:bg-orange-600/30 transition-colors"
              >
                <ChefHat className="w-3.5 h-3.5" />
                Cocina
              </button>
            )}
            <button onClick={handleLogout} className="text-gray-500 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Contenido principal */}
      <main className="flex-1 overflow-hidden">
        {pantalla === 'login' && <PinLogin onLogin={handleLogin} />}

        {pantalla === 'areas' && (
          <div className="p-4">
            <h2 className="text-white font-semibold text-lg mb-4">Selecciona un área</h2>
            <div className="grid grid-cols-2 gap-3">
              {areas.map(area => (
                <button
                  key={area.id}
                  onClick={() => handleSelectArea(area)}
                  className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-6 flex flex-col items-center
                    gap-3 transition-all active:scale-95 border border-gray-700 hover:border-indigo-500"
                >
                  <span className="text-4xl">{area.icono}</span>
                  <span className="text-white font-semibold">{area.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {pantalla === 'mesas' && areaActiva && (
          <div className="h-full overflow-y-auto">
            <div className="px-4 pt-3 pb-1">
              <h2 className="text-white font-semibold">
                {areaActiva.icono} {areaActiva.nombre}
              </h2>
            </div>
            <MesaGrid areaId={areaActiva.id} onSelectMesa={handleSelectMesa} />
          </div>
        )}

        {pantalla === 'comanda' && mesaActiva && mesero && (
          <ComandaView
            mesa={mesaActiva}
            meseroId={mesero.id}
            onBack={() => { setPantalla('mesas'); setMesaActiva(null) }}
          />
        )}

        {pantalla === 'cocina' && <VistaCocina />}
      </main>
    </div>
  )
}
