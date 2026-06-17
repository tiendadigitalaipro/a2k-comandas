import { NextRequest, NextResponse } from 'next/server'
import net from 'net'

export async function POST(req: NextRequest) {
  try {
    const bytes = await req.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const printerIp   = process.env.PRINTER_IP   ?? '192.168.1.100'
    const printerPort = parseInt(process.env.PRINTER_PORT ?? '9100')

    await new Promise<void>((resolve, reject) => {
      const socket = new net.Socket()
      const timeout = setTimeout(() => {
        socket.destroy()
        reject(new Error('Timeout conectando a impresora'))
      }, 5000)

      socket.connect(printerPort, printerIp, () => {
        socket.write(buffer, () => {
          socket.end()
          clearTimeout(timeout)
          resolve()
        })
      })
      socket.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })

    return NextResponse.json({ ok: true, metodo: 'TCP/IP' })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    )
  }
}
