
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/AfriHub/admin-cms/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('Missing VITE_SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupProductsTable() {
    console.log('Setting up products table...');

    // Create products table
    const { error: tableError } = await supabase.rpc('exec', {
        query: `
            CREATE TABLE IF NOT EXISTS products (
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
        `
    });

    // If RPC exec fails (not enabled), try another way or just report
    if (tableError) {
        console.warn('RPC exec failed, likely not enabled or missing uuid-ossp extension. Trying direct query via REST if possible...');
        // In Supabase, if we can't use RPC exec, we usually use the SQL Editor.
        // But let's try to just insert initial data to see if it exists.
    }

    // Insert mock data if empty
    const { data: existing, error: checkError } = await supabase.from('products').select('id').limit(1);

    if (!existing || existing.length === 0) {
        console.log('Inserting initial mock products...');
        const mockProducts = [
            { name: 'Huile de Palme Bio', brand: 'NaturAfrik', price: 2800, unit: '1L', emoji: '🫙', badge: 'Populaire', color: '#fb5607' },
            { name: 'Riz Parfumé Long Grain', brand: 'Goldenrice', price: 4500, unit: '5kg', emoji: '🌾', badge: 'Promo -15%', color: '#10b981' },
            { name: 'Ndolé Séché Premium', brand: 'TasteOfCMR', price: 1800, unit: '200g', emoji: '🍃', badge: 'Nouveau', color: '#6366f1' },
            { name: 'Gingembre Frais Moulu', brand: 'SpiceLab', price: 750, unit: '100g', emoji: '🫚', badge: null, color: '#f59e0b' },
            { name: 'Piment Scotch Bonnet', brand: 'AfroSpice', price: 950, unit: '250g', emoji: '🌶️', badge: 'Best-seller', color: '#ef4444' },
            { name: 'Plantains Mûrs', brand: 'FruitDirect', price: 1200, unit: '1kg', emoji: '🍌', badge: null, color: '#f59e0b' },
        ];

        const { error: insertError } = await supabase.from('products').insert(mockProducts);
        if (insertError) {
            if (insertError.code === '42P01') {
                console.error('Table "products" does not exist. Please create it in the Supabase SQL Editor.');
            } else {
                console.error('Error inserting products:', insertError.message);
            }
        } else {
            console.log('Products table initialized!');
        }
    } else {
        console.log('Products table already contains data.');
    }
}

setupProductsTable();
