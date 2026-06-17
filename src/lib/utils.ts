import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { EstadoMesa, EstadoComanda, EstadoItem } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function colorMesa(estado: EstadoMesa): string {
  const map: Record<EstadoMesa, string> = {
    disponible: 'bg-green-500 hover:bg-green-400 border-green-600',
    ocupado:    'bg-red-500   hover:bg-red-400   border-red-600',
    reservado:  'bg-yellow-500 hover:bg-yellow-400 border-yellow-600',
    limpieza:   'bg-blue-500  hover:bg-blue-400  border-blue-600',
  }
  return map[estado]
}

export function labelMesa(estado: EstadoMesa): string {
  const map: Record<EstadoMesa, string> = {
    disponible: 'Libre',
    ocupado:    'Ocupado',
    reservado:  'Reservado',
    limpieza:   'Limpieza',
  }
  return map[estado]
}

export function labelComanda(estado: EstadoComanda): string {
  const map: Record<EstadoComanda, string> = {
    abierta:        'Abierta',
    enviada:        'Enviada a Cocina',
    en_preparacion: 'En Preparación',
    lista:          'Lista para Servir',
    pagada:         'Pagada',
    cancelada:      'Cancelada',
  }
  return map[estado]
}

export function colorItem(estado: EstadoItem): string {
  const map: Record<EstadoItem, string> = {
    pendiente:  'bg-gray-700 text-gray-300',
    preparando: 'bg-yellow-900 text-yellow-300',
    listo:      'bg-green-900 text-green-300',
    entregado:  'bg-blue-900 text-blue-300',
  }
  return map[estado]
}

export function formatPrecio(valor: number): string {
  return `$${valor.toFixed(2)}`
}
