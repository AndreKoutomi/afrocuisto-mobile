-- Catalogue, commandes et réglages de livraison partagés par le CMS et l’app.
CREATE TABLE IF NOT EXISTS public.boutique_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  origin TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('vegetables', 'fruits', 'spices', 'grains', 'oils', 'proteins')),
  unit_label TEXT NOT NULL DEFAULT '',
  price_fcfa NUMERIC(12, 0) NOT NULL DEFAULT 0 CHECK (price_fcfa >= 0),
  rating NUMERIC(3, 2) NOT NULL DEFAULT 4.80,
  reviews_count INTEGER NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  is_organic BOOLEAN NOT NULL DEFAULT false,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  culinary_tip TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.boutique_orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_fcfa NUMERIC(12, 0) NOT NULL CHECK (subtotal_fcfa >= 0),
  delivery_fee_fcfa NUMERIC(12, 0) NOT NULL DEFAULT 0 CHECK (delivery_fee_fcfa >= 0),
  total_fcfa NUMERIC(12, 0) NOT NULL CHECK (total_fcfa >= 0),
  delivery_slot TEXT NOT NULL,
  address TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.boutique_delivery_settings (
  id TEXT PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  delivery_fee_fcfa NUMERIC(12, 0) NOT NULL DEFAULT 1000 CHECK (delivery_fee_fcfa >= 0),
  enabled BOOLEAN NOT NULL DEFAULT true,
  slots JSONB NOT NULL DEFAULT '["Express 45 min", "Ce soir 18h-20h", "Demain 9h-12h"]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.boutique_delivery_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_boutique_products_category ON public.boutique_products(category);
CREATE INDEX IF NOT EXISTS idx_boutique_products_stock ON public.boutique_products(in_stock);
CREATE INDEX IF NOT EXISTS idx_boutique_orders_created ON public.boutique_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_boutique_orders_status ON public.boutique_orders(status);

DROP TRIGGER IF EXISTS trg_boutique_products_updated_at ON public.boutique_products;
CREATE TRIGGER trg_boutique_products_updated_at BEFORE UPDATE ON public.boutique_products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_boutique_orders_updated_at ON public.boutique_orders;
CREATE TRIGGER trg_boutique_orders_updated_at BEFORE UPDATE ON public.boutique_orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.boutique_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boutique_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boutique_delivery_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boutique_products_public_read" ON public.boutique_products;
CREATE POLICY "boutique_products_public_read" ON public.boutique_products
FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "boutique_products_admin_write" ON public.boutique_products;
CREATE POLICY "boutique_products_admin_write" ON public.boutique_products
FOR ALL TO authenticated
USING ((auth.jwt() ->> 'email') IN ('andre.koutomi98@gmail.com', 'deodadefassinou@gmail.com'))
WITH CHECK ((auth.jwt() ->> 'email') IN ('andre.koutomi98@gmail.com', 'deodadefassinou@gmail.com'));

DROP POLICY IF EXISTS "boutique_orders_customer_insert" ON public.boutique_orders;
CREATE POLICY "boutique_orders_customer_insert" ON public.boutique_orders
FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "boutique_orders_admin_read" ON public.boutique_orders;
CREATE POLICY "boutique_orders_admin_read" ON public.boutique_orders
FOR SELECT TO authenticated
USING ((auth.jwt() ->> 'email') IN ('andre.koutomi98@gmail.com', 'deodadefassinou@gmail.com'));
DROP POLICY IF EXISTS "boutique_orders_admin_update" ON public.boutique_orders;
CREATE POLICY "boutique_orders_admin_update" ON public.boutique_orders
FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'email') IN ('andre.koutomi98@gmail.com', 'deodadefassinou@gmail.com'))
WITH CHECK ((auth.jwt() ->> 'email') IN ('andre.koutomi98@gmail.com', 'deodadefassinou@gmail.com'));

DROP POLICY IF EXISTS "boutique_delivery_public_read" ON public.boutique_delivery_settings;
CREATE POLICY "boutique_delivery_public_read" ON public.boutique_delivery_settings
FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "boutique_delivery_admin_write" ON public.boutique_delivery_settings;
CREATE POLICY "boutique_delivery_admin_write" ON public.boutique_delivery_settings
FOR ALL TO authenticated
USING ((auth.jwt() ->> 'email') IN ('andre.koutomi98@gmail.com', 'deodadefassinou@gmail.com'))
WITH CHECK ((auth.jwt() ->> 'email') IN ('andre.koutomi98@gmail.com', 'deodadefassinou@gmail.com'));

GRANT SELECT ON public.boutique_products, public.boutique_delivery_settings TO anon, authenticated;
GRANT INSERT ON public.boutique_orders TO anon, authenticated;
GRANT SELECT, UPDATE ON public.boutique_orders TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.boutique_products, public.boutique_delivery_settings TO authenticated;
