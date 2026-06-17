-- ============================================================
-- A2K COMANDAS — Migración inicial
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. MESEROS
CREATE TABLE IF NOT EXISTS public.meseros (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL,
  codigo_pin text NOT NULL UNIQUE,
  activo     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. AREAS
CREATE TABLE IF NOT EXISTS public.areas (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  icono  text DEFAULT '🪑',
  orden  int DEFAULT 0,
  activo boolean DEFAULT true
);

-- 3. MESAS
CREATE TABLE IF NOT EXISTS public.mesas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id    uuid REFERENCES public.areas(id) ON DELETE CASCADE,
  numero     text NOT NULL,
  capacidad  int DEFAULT 4,
  estado     text DEFAULT 'disponible'
             CHECK (estado IN ('disponible','ocupado','reservado','limpieza')),
  updated_at timestamptz DEFAULT now()
);

-- 4. CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categorias (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  color  text DEFAULT '#6366f1',
  icono  text DEFAULT '🍽️',
  orden  int DEFAULT 0,
  activo boolean DEFAULT true
);

-- 5. PRODUCTOS
CREATE TABLE IF NOT EXISTS public.productos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  nombre       text NOT NULL,
  precio       numeric(10,2) NOT NULL DEFAULT 0,
  descripcion  text,
  activo       boolean DEFAULT true,
  imagen_url   text
);

-- 6. NOTAS RAPIDAS
CREATE TABLE IF NOT EXISTS public.notas_rapidas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texto        text NOT NULL,
  categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  activo       boolean DEFAULT true
);

-- 7. COMANDAS
CREATE TABLE IF NOT EXISTS public.comandas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id         uuid REFERENCES public.mesas(id) ON DELETE SET NULL,
  mesero_id       uuid REFERENCES public.meseros(id) ON DELETE SET NULL,
  estado          text DEFAULT 'abierta'
                  CHECK (estado IN ('abierta','enviada','en_preparacion','lista','pagada','cancelada')),
  notas_generales text,
  total           numeric(10,2) DEFAULT 0,
  tipo            text DEFAULT 'mesa' CHECK (tipo IN ('mesa','domicilio','barra')),
  cliente_nombre  text,
  cliente_telefono text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 8. COMANDA ITEMS
CREATE TABLE IF NOT EXISTS public.comanda_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id      uuid REFERENCES public.comandas(id) ON DELETE CASCADE,
  producto_id     uuid REFERENCES public.productos(id) ON DELETE SET NULL,
  producto_nombre text NOT NULL,
  cantidad        int DEFAULT 1,
  precio_unitario numeric(10,2) NOT NULL,
  notas           text[] DEFAULT '{}',
  estado          text DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente','preparando','listo','entregado')),
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- TRIGGER: actualizar mesa.estado cuando se crea/cierra comanda
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_mesa_estado()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.mesa_id IS NOT NULL THEN
    UPDATE public.mesas SET estado = 'ocupado', updated_at = now()
    WHERE id = NEW.mesa_id;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.estado IN ('pagada','cancelada') AND NEW.mesa_id IS NOT NULL THEN
    UPDATE public.mesas SET estado = 'disponible', updated_at = now()
    WHERE id = NEW.mesa_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_mesa_estado
  AFTER INSERT OR UPDATE ON public.comandas
  FOR EACH ROW EXECUTE FUNCTION public.sync_mesa_estado();

-- TRIGGER: recalcular total de comanda cuando cambia un item
CREATE OR REPLACE FUNCTION public.recalcular_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.comandas
  SET total = (
    SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
    FROM public.comanda_items
    WHERE comanda_id = COALESCE(NEW.comanda_id, OLD.comanda_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalcular_total
  AFTER INSERT OR UPDATE OR DELETE ON public.comanda_items
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_total();

-- ============================================================
-- REALTIME: habilitar para las tablas críticas
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.mesas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comandas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comanda_items;

-- ============================================================
-- DATOS SEMILLA
-- ============================================================
INSERT INTO public.areas (nombre, icono, orden) VALUES
  ('Salón',      '🪑', 1),
  ('Barra',      '🍺', 2),
  ('Domicilios', '🛵', 3),
  ('Terraza',    '☀️', 4);

-- Mesas para Salón (se insertarán referenciando el area_id dinámicamente)
WITH salon AS (SELECT id FROM public.areas WHERE nombre = 'Salón' LIMIT 1)
INSERT INTO public.mesas (area_id, numero, capacidad)
SELECT salon.id, 'M' || s.n, CASE WHEN s.n <= 5 THEN 4 ELSE 6 END
FROM salon, generate_series(1, 10) AS s(n);

WITH barra AS (SELECT id FROM public.areas WHERE nombre = 'Barra' LIMIT 1)
INSERT INTO public.mesas (area_id, numero, capacidad)
SELECT barra.id, 'B' || s.n, 2
FROM barra, generate_series(1, 6) AS s(n);

INSERT INTO public.categorias (nombre, color, icono, orden) VALUES
  ('Entradas',      '#f59e0b', '🥗', 1),
  ('Platos Fuertes','#ef4444', '🍖', 2),
  ('Bebidas',       '#3b82f6', '🥤', 3),
  ('Postres',       '#ec4899', '🍰', 4),
  ('Especiales',    '#8b5cf6', '⭐', 5);

WITH ent AS (SELECT id FROM public.categorias WHERE nombre='Entradas' LIMIT 1),
     pla AS (SELECT id FROM public.categorias WHERE nombre='Platos Fuertes' LIMIT 1),
     beb AS (SELECT id FROM public.categorias WHERE nombre='Bebidas' LIMIT 1),
     pos AS (SELECT id FROM public.categorias WHERE nombre='Postres' LIMIT 1)
INSERT INTO public.productos (categoria_id, nombre, precio) VALUES
  ((SELECT id FROM ent), 'Ensalada César',       8.50),
  ((SELECT id FROM ent), 'Sopa del Día',         5.00),
  ((SELECT id FROM ent), 'Tostones con Hogao',   6.00),
  ((SELECT id FROM pla), 'Pollo a la Plancha',  12.00),
  ((SELECT id FROM pla), 'Churrasco 300g',      18.00),
  ((SELECT id FROM pla), 'Pasta Carbonara',     11.00),
  ((SELECT id FROM pla), 'Hamburguesa Clásica',  9.00),
  ((SELECT id FROM beb), 'Agua Mineral',         2.00),
  ((SELECT id FROM beb), 'Refresco Natural',     3.50),
  ((SELECT id FROM beb), 'Cerveza',              4.00),
  ((SELECT id FROM beb), 'Café Americano',       2.50),
  ((SELECT id FROM pos), 'Flan de la Casa',      4.50),
  ((SELECT id FROM pos), 'Helado 3 Bolas',       5.00);

INSERT INTO public.notas_rapidas (texto, categoria_id) VALUES
  ('Sin azúcar',     NULL),
  ('Sin sal',        NULL),
  ('Sin hielo',      NULL),
  ('Extra salsa',    NULL),
  ('Sin cebolla',    NULL),
  ('Sin picante',    NULL),
  ('Término medio',  (SELECT id FROM public.categorias WHERE nombre='Platos Fuertes' LIMIT 1)),
  ('Bien cocido',    (SELECT id FROM public.categorias WHERE nombre='Platos Fuertes' LIMIT 1)),
  ('Término rojo',   (SELECT id FROM public.categorias WHERE nombre='Platos Fuertes' LIMIT 1)),
  ('Con limón',      (SELECT id FROM public.categorias WHERE nombre='Bebidas' LIMIT 1));

INSERT INTO public.meseros (nombre, codigo_pin) VALUES
  ('Admin',    '0000'),
  ('María',    '1234'),
  ('Carlos',   '5678'),
  ('Valentina','9999');
