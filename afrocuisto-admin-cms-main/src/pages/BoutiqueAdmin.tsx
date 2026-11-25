import { useCallback, useEffect, useState } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import { AdminSelect } from '../components/AdminSelect';
import {
  Plus,
  RefreshCw,
  Search,
  Save,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Edit2,
  X,
} from '../components/SolarIcons';

type Section = 'products' | 'orders' | 'delivery';

type Product = {
  id: string;
  name: string;
  subtitle: string;
  origin: string;
  category: string;
  unit_label: string;
  price_fcfa: number;
  is_organic: boolean;
  in_stock: boolean;
  culinary_tip: string;
  description: string;
  image_url: string;
};

type Order = {
  id: string;
  items: Array<{ product?: { name?: string }; quantity: number; note?: string }>;
  subtotal_fcfa: number;
  delivery_fee_fcfa: number;
  total_fcfa: number;
  delivery_slot: string;
  address: string;
  payment_method: string;
  status: string;
  created_at: string;
};

type DeliverySettings = {
  delivery_fee_fcfa: number;
  enabled: boolean;
  slots: string[];
};

const sections: Record<Section, { title: string; description: string }> = {
  products: {
    title: 'Produits boutique',
    description: 'Gérez le catalogue d’ingrédients, fruits, légumes et épices disponibles dans l’application.',
  },
  orders: {
    title: 'Commandes boutique',
    description: 'Suivez les commandes Mobile Money et mettez à jour leur statut de livraison.',
  },
  delivery: {
    title: 'Paramètres de livraison',
    description: 'Configurez les frais de livraison, l’activation de la boutique et les créneaux proposés.',
  },
};

const CATEGORY_OPTIONS = [
  { value: 'vegetables', label: 'Légumes' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'spices', label: 'Épices' },
  { value: 'grains', label: 'Céréales' },
  { value: 'oils', label: 'Huiles' },
  { value: 'proteins', label: 'Poissons & Viandes' },
];

const CATEGORY_LABEL_MAP: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map(c => [c.value, c.label])
);

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)' },
  { value: 'confirmed', label: 'Confirmée', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.14)' },
  { value: 'preparing', label: 'En préparation', color: '#fb5607', bg: 'rgba(251, 86, 7, 0.14)' },
  { value: 'out_for_delivery', label: 'En livraison', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.14)' },
  { value: 'delivered', label: 'Livrée', color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)' },
  { value: 'cancelled', label: 'Annulée', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)' },
];

const emptyProduct: Product = {
  id: '',
  name: '',
  subtitle: '',
  origin: '',
  category: 'vegetables',
  unit_label: '',
  price_fcfa: 0,
  is_organic: false,
  in_stock: true,
  culinary_tip: '',
  description: '',
  image_url: '',
};

const defaultDelivery: DeliverySettings = {
  delivery_fee_fcfa: 1000,
  enabled: true,
  slots: ['Express 45 min', 'Ce soir 18h-20h', 'Demain 9h-12h'],
};

const DEFAULT_CATALOG_SEED: Product[] = [
  {
    id: 'bout_gombo',
    name: 'Gombo Frais du Terroir',
    subtitle: 'Jeunes gombos croquants récoltés le matin',
    origin: "Vallée de l'Ouémé",
    category: 'vegetables',
    unit_label: '500 g',
    price_fcfa: 950,
    is_organic: true,
    in_stock: true,
    culinary_tip: 'Idéal pour votre Sauce Gombo (Févi) ou Dékoun.',
    description: 'Gombos frais sélectionnés à la main, tendres et riches en fibres naturelles.',
    image_url: 'https://images.unsplash.com/photo-1622205313162-be1d5712a43c?w=600&q=80',
  },
  {
    id: 'bout_tomates',
    name: 'Tomates Grappes Mûres',
    subtitle: 'Charnues et parfumées pour sauces rouges',
    origin: 'Sud-Bénin',
    category: 'vegetables',
    unit_label: '1 kg',
    price_fcfa: 1100,
    is_organic: true,
    in_stock: true,
    culinary_tip: "Parfaites pour la base tomatée de l'Amiwô et de la Sauce Monyo.",
    description: 'Tomates rouges cueillies à pleine maturité.',
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80',
  },
  {
    id: 'bout_piment',
    name: 'Piment Habanero Frais',
    subtitle: 'Arôme fruité et piquant authentique',
    origin: 'Cotonou & Abomey',
    category: 'vegetables',
    unit_label: '250 g',
    price_fcfa: 650,
    is_organic: false,
    in_stock: true,
    culinary_tip: 'À écraser avec oignon et gingembre pour une pimentade maison.',
    description: 'Piments frais rigoureusement triés pour parfumer vos grillades et sauces.',
    image_url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&q=80',
  },
  {
    id: 'bout_plantain',
    name: 'Bananes Plantain Mûres',
    subtitle: 'Chair dorée et sucrée pour Alloco',
    origin: 'Allada',
    category: 'fruits',
    unit_label: '1,2 kg',
    price_fcfa: 1350,
    is_organic: false,
    in_stock: true,
    culinary_tip: 'Couper en dés biseautés et frire à 175°C.',
    description: 'Bananes plantain mûres à point, parfaites pour Alloco ou grillées.',
    image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80',
  },
  {
    id: 'bout_ananas',
    name: 'Ananas Pain de Sucre',
    subtitle: 'Douceur exceptionnelle, cœur tendre',
    origin: "Plateau d'Allada",
    category: 'fruits',
    unit_label: '1 pièce (~1,4 kg)',
    price_fcfa: 1200,
    is_organic: true,
    in_stock: true,
    culinary_tip: 'À associer au gingembre et à la menthe pour un jus tonique.',
    description: "L'ananas emblématique du Bénin, célèbre pour sa chair blanche sucrée.",
    image_url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&q=80',
  },
  {
    id: 'bout_afitin',
    name: 'Afitin / Soumbala Artisanal',
    subtitle: 'Graines de néré fermentées traditionnelles',
    origin: 'Abomey',
    category: 'spices',
    unit_label: '200 g',
    price_fcfa: 900,
    is_organic: true,
    in_stock: true,
    culinary_tip: 'Apporte une profondeur umami authentique aux sauces légumes et gombo.',
    description: 'Condiment fermenté naturel préparé selon le savoir-faire traditionnel.',
    image_url: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80',
  },
  {
    id: 'bout_gari',
    name: 'Gari Fin Blanc du Bénin',
    subtitle: 'Semoule de manioc torréfiée croquante',
    origin: 'Savalou',
    category: 'grains',
    unit_label: '1 kg',
    price_fcfa: 1100,
    is_organic: false,
    in_stock: true,
    culinary_tip: 'Parfait en accompagnement du Haricot (Abobo) ou délayé bien frais.',
    description: 'Gari artisanal de Savalou, grain fin et léger.',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
  },
  {
    id: 'bout_zomi',
    name: 'Huile de Palme Rouge Zomi',
    subtitle: 'Première pression artisanale non raffinée',
    origin: 'Pobè',
    category: 'oils',
    unit_label: '75 cl',
    price_fcfa: 1950,
    is_organic: true,
    in_stock: true,
    culinary_tip: "Sublime le Dékoun, l'Atassi et les sauces traditionnelles.",
    description: 'Huile rouge parfumée issue de noix de palme fraîches.',
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',
  },
  {
    id: 'bout_poisson_fume',
    name: 'Poisson Fumé Kpanman',
    subtitle: 'Fumage traditionnel au bois aromatique',
    origin: 'Lac Nokoué',
    category: 'proteins',
    unit_label: '400 g',
    price_fcfa: 2800,
    is_organic: false,
    in_stock: true,
    culinary_tip: 'Effeuiller et ajouter en fin de cuisson dans votre sauce graine.',
    description: "Poisson d'eau douce fumé lentement pour une saveur boisée incomparable.",
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
  },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 13px',
  border: '1px solid var(--border)',
  borderRadius: 11,
  background: 'var(--surface)',
  color: 'var(--text-main)',
  font: 'inherit',
  fontSize: 13,
  outline: 'none',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 18,
  boxShadow: 'var(--shadow-soft)',
};

const cellStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'middle',
};

export function BoutiqueAdmin({ section }: { section: Section }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<DeliverySettings>(defaultDelivery);
  const [newSlot, setNewSlot] = useState('');
  const [product, setProduct] = useState<Product>(emptyProduct);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (section === 'products') {
        const { data, error: err } = await supabaseAdmin
          .from('boutique_products')
          .select('*')
          .order('name');
        if (err) throw err;
        setProducts((data || []) as Product[]);
      } else if (section === 'orders') {
        const { data, error: err } = await supabaseAdmin
          .from('boutique_orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (err) throw err;
        setOrders((data || []) as Order[]);
      } else {
        const { data, error: err } = await supabaseAdmin
          .from('boutique_delivery_settings')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();
        if (err) throw err;
        if (data) {
          setSettings({
            delivery_fee_fcfa: Number(data.delivery_fee_fcfa),
            enabled: Boolean(data.enabled),
            slots: Array.isArray(data.slots) ? data.slots : defaultDelivery.slots,
          });
        }
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Chargement impossible. Appliquez la migration Supabase boutique.'
      );
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    setNotice('');
    setEditing(false);
    setQuery('');
    void load();
  }, [load]);

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const row = { ...product, id: product.id || `bout_${crypto.randomUUID()}` };
    try {
      const { error: err } = await supabaseAdmin.from('boutique_products').upsert(row);
      if (err) throw err;
      setEditing(false);
      setProduct(emptyProduct);
      setNotice('Produit enregistré avec succès.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const seedDefaultCatalog = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const { error: err } = await supabaseAdmin.from('boutique_products').upsert(DEFAULT_CATALOG_SEED);
      if (err) throw err;
      setNotice(`${DEFAULT_CATALOG_SEED.length} produits du terroir importés.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Importation impossible.');
    } finally {
      setSaving(false);
    }
  };

  const toggleProductStock = async (item: Product) => {
    const next = !item.in_stock;
    const { error: err } = await supabaseAdmin
      .from('boutique_products')
      .update({ in_stock: next })
      .eq('id', item.id);
    if (err) {
      setError(err.message);
    } else {
      setProducts(prev => prev.map(p => (p.id === item.id ? { ...p, in_stock: next } : p)));
      setNotice(`Stock mis à jour pour « ${item.name} ».`);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Supprimer ce produit du catalogue ?')) return;
    const { error: err } = await supabaseAdmin.from('boutique_products').delete().eq('id', id);
    if (err) {
      setError(err.message);
    } else {
      setProducts(items => items.filter(item => item.id !== id));
      setNotice('Produit supprimé.');
    }
  };

  const updateOrder = async (id: string, status: string) => {
    const { error: err } = await supabaseAdmin.from('boutique_orders').update({ status }).eq('id', id);
    if (err) {
      setError(err.message);
    } else {
      setOrders(items => items.map(order => (order.id === id ? { ...order, status } : order)));
      setNotice(`Statut de la commande ${id} mis à jour.`);
    }
  };

  const addDeliverySlot = () => {
    const trimmed = newSlot.trim();
    if (!trimmed) return;
    if (!settings.slots.includes(trimmed)) {
      setSettings({ ...settings, slots: [...settings.slots, trimmed] });
    }
    setNewSlot('');
  };

  const removeDeliverySlot = (slot: string) => {
    setSettings({ ...settings, slots: settings.slots.filter(s => s !== slot) });
  };

  const saveDelivery = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const { error: err } = await supabaseAdmin
      .from('boutique_delivery_settings')
      .upsert({ id: 'default', ...settings, updated_at: new Date().toISOString() });
    if (err) {
      setError(err.message);
    } else {
      setNotice('Paramètres de livraison enregistrés.');
    }
    setSaving(false);
  };

  const filteredProducts = products.filter(item => {
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesQuery = `${item.name} ${item.origin} ${item.subtitle}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const filteredOrders = orders.filter(
    order => orderStatusFilter === 'all' || order.status === orderStatusFilter
  );

  const heading = sections[section];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* En-tête de section */}
      <section
        style={{
          ...cardStyle,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{heading.title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{heading.description}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => void load()}
            className="btn btn-secondary"
          >
            <RefreshCw size={15} /> Actualiser
          </button>
          {section === 'products' && !editing && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setProduct(emptyProduct);
                setEditing(true);
              }}
            >
              <Plus size={16} /> Ajouter un produit
            </button>
          )}
        </div>
      </section>

      {error && (
        <div
          role="alert"
          style={{
            ...cardStyle,
            padding: 14,
            color: 'var(--danger)',
            borderColor: 'var(--danger)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <AlertCircle size={18} />
          <div>
            <div style={{ fontWeight: 600 }}>{error}</div>
            {error.includes('boutique_') && (
              <p style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
                Exécutez le fichier <code>supabase/migrations/07_boutique_delivery.sql</code> dans
                Supabase SQL Editor.
              </p>
            )}
          </div>
        </div>
      )}

      {notice && (
        <div
          role="status"
          style={{
            ...cardStyle,
            padding: 14,
            color: 'var(--success)',
            borderColor: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <CheckCircle2 size={17} />
          <span>{notice}</span>
        </div>
      )}

      {section === 'products' && (
        <>
          <section style={{ ...cardStyle, padding: 20, display: 'grid', gap: 16 }}>
            {!editing ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      ...inputStyle,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      maxWidth: 420,
                    }}
                  >
                    <Search size={16} color="var(--text-muted)" />
                    <input
                      aria-label="Rechercher un produit"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Rechercher un produit, une origine…"
                      style={{
                        border: 0,
                        outline: 0,
                        background: 'transparent',
                        color: 'var(--text-main)',
                        width: '100%',
                        font: 'inherit',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
                    </span>
                    {products.length === 0 && !loading && (
                      <button
                        type="button"
                        disabled={saving}
                        className="btn btn-outline-primary"
                        onClick={() => void seedDefaultCatalog()}
                      >
                        <Sparkles size={15} /> Importer le catalogue par défaut
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[{ value: 'all', label: 'Tout' }, ...CATEGORY_OPTIONS].map(cat => {
                    const active = categoryFilter === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategoryFilter(cat.value)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 999,
                          border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                          background: active ? 'var(--primary)' : 'var(--surface-muted)',
                          color: active ? '#fff' : 'var(--text-secondary)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.16s ease',
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <form
                onSubmit={saveProduct}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    gridColumn: '1/-1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 800 }}>
                    {product.id ? 'Modifier le produit' : 'Nouveau produit'}
                  </h3>
                  <button
                    type="button"
                    className="btn btn-icon"
                    onClick={() => setEditing(false)}
                    aria-label="Fermer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <label className="form-label">Nom du produit *</label>
                  <input
                    required
                    placeholder="Ex: Gombo Frais du Terroir"
                    value={product.name}
                    onChange={e => setProduct({ ...product, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="form-label">Sous-titre</label>
                  <input
                    placeholder="Ex: Récolté le matin"
                    value={product.subtitle}
                    onChange={e => setProduct({ ...product, subtitle: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="form-label">Origine</label>
                  <input
                    placeholder="Ex: Abomey, Savalou"
                    value={product.origin}
                    onChange={e => setProduct({ ...product, origin: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="form-label">Catégorie</label>
                  <AdminSelect
                    ariaLabel="Catégorie du produit"
                    value={product.category}
                    onChange={val => setProduct({ ...product, category: val })}
                    options={CATEGORY_OPTIONS}
                  />
                </div>

                <div>
                  <label className="form-label">Unité *</label>
                  <input
                    required
                    placeholder="Ex: 500 g, 1 kg, 1 botte"
                    value={product.unit_label}
                    onChange={e => setProduct({ ...product, unit_label: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="form-label">Prix (FCFA) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Ex: 1000"
                    value={product.price_fcfa || ''}
                    onChange={e => setProduct({ ...product, price_fcfa: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="form-label">URL de l’image</label>
                  <input
                    placeholder="https://..."
                    value={product.image_url}
                    onChange={e => setProduct({ ...product, image_url: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="form-label">Conseil culinaire</label>
                  <input
                    placeholder="Idéal pour..."
                    value={product.culinary_tip}
                    onChange={e => setProduct({ ...product, culinary_tip: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Description</label>
                  <textarea
                    placeholder="Décrivez le produit..."
                    value={product.description}
                    onChange={e => setProduct({ ...product, description: e.target.value })}
                    style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={product.is_organic}
                    onChange={e => setProduct({ ...product, is_organic: e.target.checked })}
                  />
                  Produit bio / terroir
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={product.in_stock}
                    onChange={e => setProduct({ ...product, in_stock: e.target.checked })}
                  />
                  Disponible à la vente
                </label>

                <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'end', gap: 10, paddingTop: 6 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditing(false)}
                  >
                    Annuler
                  </button>
                  <button disabled={saving} className="btn btn-primary">
                    <Save size={15} />
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section style={{ ...cardStyle, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 740 }}>
              <thead>
                <tr>
                  {['Produit', 'Catégorie', 'Origine', 'Prix', 'Stock', 'Actions'].map(label => (
                    <th
                      key={label}
                      style={{
                        padding: '14px 16px',
                        textAlign: 'left',
                        color: 'var(--text-muted)',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(item => (
                  <tr key={item.id}>
                    <td style={cellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 10,
                              objectFit: 'cover',
                              border: '1px solid var(--border)',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 10,
                              background: 'var(--surface-muted)',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div>
                          <strong style={{ fontSize: 13.5 }}>{item.name}</strong>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                            {item.unit_label}
                            {item.is_organic ? ' • Bio / Terroir' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: 'var(--surface-muted)',
                          fontSize: 11.5,
                          fontWeight: 700,
                        }}
                      >
                        {CATEGORY_LABEL_MAP[item.category] || item.category}
                      </span>
                    </td>
                    <td style={{ ...cellStyle, fontSize: 13 }}>{item.origin || '—'}</td>
                    <td style={{ ...cellStyle, fontWeight: 700, color: 'var(--primary)' }}>
                      {Number(item.price_fcfa).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td style={cellStyle}>
                      <button
                        type="button"
                        onClick={() => void toggleProductStock(item)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 999,
                          border: 0,
                          cursor: 'pointer',
                          fontSize: 11.5,
                          fontWeight: 700,
                          background: item.in_stock
                            ? 'rgba(16, 185, 129, 0.14)'
                            : 'rgba(239, 68, 68, 0.14)',
                          color: item.in_stock ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {item.in_stock ? 'Disponible' : 'Épuisé'}
                      </button>
                    </td>
                    <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setProduct(item);
                            setEditing(true);
                          }}
                        >
                          <Edit2 size={14} /> Modifier
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          aria-label="Supprimer"
                          onClick={() => void deleteProduct(item.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: 34, textAlign: 'center', color: 'var(--text-muted)' }}
                    >
                      Aucun produit trouvé. Ajoutez un article ou importez le catalogue par défaut.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}

      {section === 'orders' && (
        <>
          <section style={{ ...cardStyle, padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[{ value: 'all', label: 'Toutes' }, ...ORDER_STATUS_OPTIONS].map(st => {
              const active = orderStatusFilter === st.value;
              return (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setOrderStatusFilter(st.value)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 999,
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    background: active ? 'var(--primary)' : 'var(--surface-muted)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.16s ease',
                  }}
                >
                  {st.label}
                </button>
              );
            })}
          </section>

          <section style={{ ...cardStyle, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
              <thead>
                <tr>
                  {['Référence / Date', 'Articles', 'Adresse / Créneau', 'Paiement', 'Total', 'Statut'].map(
                    label => (
                      <th
                        key={label}
                        style={{
                          padding: '14px 16px',
                          textAlign: 'left',
                          color: 'var(--text-muted)',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const statusMeta =
                    ORDER_STATUS_OPTIONS.find(s => s.value === order.status) || ORDER_STATUS_OPTIONS[0];
                  return (
                    <tr key={order.id}>
                      <td style={cellStyle}>
                        <strong>{order.id}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(order.created_at).toLocaleString('fr-FR')}
                        </div>
                      </td>
                      <td style={{ ...cellStyle, fontSize: 13 }}>
                        {(order.items || []).map((i, idx) => (
                          <div key={idx}>
                            {i.quantity} × {i.product?.name || 'Article'}
                            {i.note ? (
                              <span style={{ color: 'var(--primary)', fontSize: 11 }}>
                                {' '}
                                ({i.note})
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </td>
                      <td style={{ ...cellStyle, fontSize: 13 }}>
                        {order.address}
                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                          {order.delivery_slot}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            background: 'var(--surface-muted)',
                            fontSize: 11.5,
                            fontWeight: 700,
                          }}
                        >
                          {order.payment_method || 'Mobile Money'}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, fontWeight: 700, color: 'var(--primary)' }}>
                        {Number(order.total_fcfa).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td style={{ ...cellStyle, minWidth: 190 }}>
                        <div style={{ display: 'grid', gap: 6 }}>
                          <span
                            style={{
                              display: 'inline-block',
                              width: 'fit-content',
                              padding: '3px 9px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                              background: statusMeta.bg,
                              color: statusMeta.color,
                            }}
                          >
                            {statusMeta.label}
                          </span>
                          <AdminSelect
                            ariaLabel={`Statut de la commande ${order.id}`}
                            value={order.status}
                            onChange={val => void updateOrder(order.id, val)}
                            options={ORDER_STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: 34, textAlign: 'center', color: 'var(--text-muted)' }}
                    >
                      Aucune commande enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}

      {section === 'delivery' && (
        <form
          onSubmit={saveDelivery}
          style={{ ...cardStyle, padding: 24, display: 'grid', gap: 20, maxWidth: 760 }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'var(--primary-50)',
              border: '1px solid var(--primary-200)',
              fontSize: 12.5,
              color: '#181615',
              fontWeight: 600,
            }}
          >
            Mode de paiement actif dans l’application : <strong>Mobile Money uniquement</strong> (pas de livraison gratuite).
          </div>

          <div>
            <label className="form-label">Frais standard de livraison (FCFA)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={settings.delivery_fee_fcfa}
              onChange={e =>
                setSettings({ ...settings, delivery_fee_fcfa: Number(e.target.value) })
              }
              style={{ ...inputStyle, maxWidth: 260 }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={e => setSettings({ ...settings, enabled: e.target.checked })}
            />
            Boutique et livraison activées
          </label>

          <div>
            <label className="form-label">Créneaux proposés</label>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>
              Ajoutez ou retirez des créneaux rapides (les clients peuvent aussi choisir une date et heure personnalisée).
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {settings.slots.map(slot => (
                <span
                  key={slot}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {slot}
                  <button
                    type="button"
                    onClick={() => removeDeliverySlot(slot)}
                    aria-label={`Supprimer ${slot}`}
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      padding: 0,
                    }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, maxWidth: 420 }}>
              <input
                placeholder="Ex: Demain 14h-16h"
                value={newSlot}
                onChange={e => setNewSlot(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDeliverySlot();
                  }
                }}
                style={inputStyle}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addDeliverySlot}
              >
                <Plus size={15} /> Ajouter
              </button>
            </div>
          </div>

          <div>
            <button disabled={saving} className="btn btn-primary">
              <Save size={15} />
              {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
            </button>
          </div>
        </form>
      )}

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement…</p>}
    </div>
  );
}
