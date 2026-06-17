export type EstadoMesa = 'disponible' | 'ocupado' | 'reservado' | 'limpieza'
export type EstadoComanda = 'abierta' | 'enviada' | 'en_preparacion' | 'lista' | 'pagada' | 'cancelada'
export type EstadoItem = 'pendiente' | 'preparando' | 'listo' | 'entregado'

export interface Mesero {
  id: string
  nombre: string
  codigo_pin: string
  activo: boolean
  created_at: string
}

export interface Area {
  id: string
  nombre: string
  icono: string
  orden: number
  activo: boolean
}

export interface Mesa {
  id: string
  area_id: string
  numero: string
  capacidad: number
  estado: EstadoMesa
  updated_at: string
}

export interface Categoria {
  id: string
  nombre: string
  color: string
  icono: string
  orden: number
  activo: boolean
}

export interface Producto {
  id: string
  categoria_id: string
  nombre: string
  precio: number
  descripcion: string | null
  activo: boolean
  imagen_url: string | null
}

export interface NotaRapida {
  id: string
  texto: string
  categoria_id: string | null
  activo: boolean
}

export interface Comanda {
  id: string
  mesa_id: string | null
  mesero_id: string | null
  estado: EstadoComanda
  notas_generales: string | null
  total: number
  tipo: 'mesa' | 'domicilio' | 'barra'
  cliente_nombre: string | null
  cliente_telefono: string | null
  created_at: string
  updated_at: string
  mesa?: Mesa
  mesero?: Mesero
  items?: ComandaItem[]
}

export interface ComandaItem {
  id: string
  comanda_id: string
  producto_id: string | null
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  notas: string[]
  estado: EstadoItem
  created_at: string
}
