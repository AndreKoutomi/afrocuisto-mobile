
-- SQL to create the products table for the AfroCuisto store
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    brand TEXT,
    price INTEGER NOT NULL,
    unit TEXT,
    emoji TEXT,
    image_url TEXT,
    badge TEXT,
    color TEXT DEFAULT '#fb5607',
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Insert initial mock products if you want them in the DB
INSERT INTO public.products (name, brand, price, unit, emoji, badge, color, category)
VALUES 
('Huile de Palme Bio', 'NaturAfrik', 2800, '1L', '🫙', 'Populaire', '#fb5607', 'Huiles'),
('Riz Parfumé Long Grain', 'Goldenrice', 4500, '5kg', '🌾', 'Promo -15%', '#10b981', 'Alimentation'),
('Ndolé Séché Premium', 'TasteOfCMR', 1800, '200g', '🍃', 'Nouveau', '#6366f1', 'Alimentation'),
('Gingembre Frais Moulu', 'SpiceLab', 750, '100g', '🫚', NULL, '#f59e0b', 'Épices'),
('Piment Scotch Bonnet', 'AfroSpice', 950, '250g', '🌶️', 'Best-seller', '#ef4444', 'Épices'),
('Plantains Mûrs', 'FruitDirect', 1200, '1kg', '🍌', NULL, '#f59e0b', 'Alimentation');
