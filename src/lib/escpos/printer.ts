import type { Comanda, ComandaItem } from '@/types'

// Comandos ESC/POS básicos
const ESC = 0x1b
const GS  = 0x1d
const LF  = 0x0a

const CMD = {
  INIT:         [ESC, 0x40],
  BOLD_ON:      [ESC, 0x45, 0x01],
  BOLD_OFF:     [ESC, 0x45, 0x00],
  CENTER:       [ESC, 0x61, 0x01],
  LEFT:         [ESC, 0x61, 0x00],
  RIGHT:        [ESC, 0x61, 0x02],
  FONT_BIG:     [GS,  0x21, 0x11],
  FONT_NORMAL:  [GS,  0x21, 0x00],
  CUT:          [GS,  0x56, 0x00],
  FEED_3:       [ESC, 0x64, 3],
}

function toBytes(cmds: number[][]): Uint8Array {
  const flat = cmds.flat()
  return new Uint8Array(flat)
}

function textBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text + '\n'))
}

function separator(char = '-', len = 32): number[] {
  return textBytes(char.repeat(len))
}

export function generarTicketCocina(comanda: Comanda, items: ComandaItem[]): Uint8Array {
  const ahora = new Date().toLocaleString('es-ES', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
  })

  const partes: number[][] = [
    CMD.INIT,
    CMD.CENTER,
    CMD.BOLD_ON,
    CMD.FONT_BIG,
    textBytes('** COCINA **'),
    CMD.FONT_NORMAL,
    CMD.BOLD_OFF,
    separator('='),
    CMD.LEFT,
    CMD.BOLD_ON,
    textBytes(`Mesa: ${comanda.mesa?.numero ?? comanda.tipo.toUpperCase()}`),
    CMD.BOLD_OFF,
    textBytes(`Hora: ${ahora}`),
    separator(),
  ]

  for (const item of items) {
    partes.push(
      CMD.BOLD_ON,
      textBytes(`${item.cantidad}x ${item.producto_nombre}`),
      CMD.BOLD_OFF
    )
    for (const nota of item.notas) {
      partes.push(textBytes(`  >> ${nota}`))
    }
  }

  if (comanda.notas_generales) {
    partes.push(
      separator(),
      CMD.BOLD_ON,
      textBytes('NOTA GENERAL:'),
      CMD.BOLD_OFF,
      textBytes(comanda.notas_generales)
    )
  }

  partes.push(
    separator('='),
    [LF, LF, LF],
    CMD.CUT
  )

  return toBytes(partes)
}

export function generarTicketCliente(comanda: Comanda, items: ComandaItem[], negocio = 'A2K Restaurante'): Uint8Array {
  const ahora = new Date().toLocaleString('es-ES')

  const partes: number[][] = [
    CMD.INIT,
    CMD.CENTER,
    CMD.BOLD_ON,
    CMD.FONT_BIG,
    textBytes(negocio),
    CMD.FONT_NORMAL,
    CMD.BOLD_OFF,
    separator('='),
    CMD.LEFT,
    textBytes(`Mesa: ${comanda.mesa?.numero ?? '-'}`),
    textBytes(`Fecha: ${ahora}`),
    separator(),
  ]

  for (const item of items) {
    const subtotal = (item.cantidad * item.precio_unitario).toFixed(2)
    const linea = `${item.cantidad}x ${item.producto_nombre}`.padEnd(22) + `$${subtotal}`
    partes.push(textBytes(linea))
    for (const nota of item.notas) {
      partes.push(textBytes(`  ${nota}`))
    }
  }

  partes.push(
    separator(),
    CMD.BOLD_ON,
    textBytes(`TOTAL:`.padEnd(22) + `$${comanda.total.toFixed(2)}`),
    CMD.BOLD_OFF,
    CMD.CENTER,
    textBytes('¡Gracias por su visita!'),
    [LF, LF, LF],
    CMD.CUT
  )

  return toBytes(partes)
}

// Imprimir via WebUSB (impresora USB conectada al dispositivo)
export async function imprimirWebUSB(bytes: Uint8Array): Promise<void> {
  if (!('usb' in navigator)) throw new Error('WebUSB no disponible en este navegador')
  const device = await (navigator as any).usb.requestDevice({ filters: [] })
  await device.open()
  await device.selectConfiguration(1)
  await device.claimInterface(0)
  await device.transferOut(1, bytes)
  await device.close()
}

// Imprimir via servidor local en red (fallback)
export async function imprimirRed(bytes: Uint8Array, serverUrl = 'http://localhost:3001'): Promise<void> {
  const response = await fetch(`${serverUrl}/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: bytes.buffer as ArrayBuffer,
  })
  if (!response.ok) throw new Error(`Error impresora: ${response.statusText}`)
}

export async function imprimir(bytes: Uint8Array): Promise<{ ok: boolean; metodo: string; error?: string }> {
  try {
    await imprimirWebUSB(bytes)
    return { ok: true, metodo: 'WebUSB' }
  } catch {
    try {
      await imprimirRed(bytes)
      return { ok: true, metodo: 'Red' }
    } catch (e2) {
      return { ok: false, metodo: 'ninguno', error: String(e2) }
    }
  }
}
