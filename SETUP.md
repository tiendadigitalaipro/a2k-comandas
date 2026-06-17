# A2K Comandas — Guía de Setup

## 1. Crear proyecto Supabase

1. Ve a https://supabase.com → New Project
2. Nombre: `a2k-comandas`
3. Región: (la más cercana a tus clientes)
4. Copia la **URL** y **anon key** del proyecto

## 2. Configurar variables de entorno

Edita el archivo `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://TU_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## 3. Ejecutar migración SQL

En Supabase → SQL Editor → pegar y ejecutar:
`supabase/migrations/001_initial.sql`

Esto crea todas las tablas, datos semilla y triggers automáticos.

## 4. Habilitar Realtime en Supabase

Supabase → Database → Replication → Activar para:
- `mesas`
- `comandas`
- `comanda_items`

## 5. Iniciar en desarrollo

```bash
npm run dev
```
Abre http://localhost:3000

**PINs de prueba:**
- Admin: `0000`
- María: `1234`
- Carlos: `5678`

## 6. Deploy en Vercel (producción)

```bash
npm install -g vercel
vercel --prod
```
Agregar las variables de entorno en Vercel Dashboard.

## 7. Instalar como PWA en celular

- Chrome Android: menú → "Agregar a pantalla de inicio"
- Safari iOS: botón compartir → "Agregar a pantalla de inicio"

## 8. Impresora térmica (opcional)

**Opción A — USB:** conectar al tablet/PC de cocina, Chrome pide permiso WebUSB automáticamente.

**Opción B — Red WiFi:** agregar `PRINTER_IP` en `.env.local` con la IP de tu impresora ESC/POS.

Impresoras compatibles: Epson TM-T20, Star TSP100, BIXOLON SRP-350, y cualquier compatible ESC/POS.

## Estructura del proyecto

```
src/
├── app/page.tsx              ← App principal (router de pantallas)
├── components/
│   ├── auth/PinLogin.tsx     ← Teclado PIN
│   ├── mesas/MesaGrid.tsx    ← Grid mesas tiempo real
│   ├── comanda/
│   │   ├── ComandaView.tsx   ← Pantalla principal comanda
│   │   ├── ProductoGrid.tsx  ← Catálogo por categorías
│   │   ├── ComandaItems.tsx  ← Lista items + enviar cocina
│   │   └── NotasModal.tsx    ← Modal de notas rápidas
│   └── cocina/VistaCocina.tsx ← Pantalla cocina
├── hooks/
│   ├── useMesas.ts           ← Supabase Realtime para mesas
│   └── useComanda.ts         ← CRUD comandas
├── lib/
│   ├── supabase/client.ts    ← Cliente Supabase browser
│   └── escpos/printer.ts     ← Generador tickets ESC/POS
└── types/index.ts            ← Tipos TypeScript
```
