import React, { useState, useEffect } from 'react';
import {
    Plus, Search, RefreshCw, ShoppingBag,
    Edit3, Trash2, X, Camera, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
    id: string;
    name: string;
    brand: string;
    price: number;
    unit: string;
    emoji: string;
    image_url: string;
    badge: string | null;
    color: string;
    category: string;
    created_at: string;
    merchant_id?: string;
    description?: string;
}

interface Merchant {
    id: string;
    name: string;
}

const CATEGORIES = [
    'Alimentation', 'Épices', 'Boissons', 'Huiles',
    'Féculents', 'Légumes', 'Viandes', 'Poissons'
];

const PRESET_COLORS = [
    '#fb5607', '#ff006e', '#8338ec', '#3a86ff',
    '#10b981', '#f59e0b', '#ef4444', '#6366f1'
];

export function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [processing, setProcessing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Advanced Filter State
    const [filterCategory, setFilterCategory] = useState('Tous');
    const [filterBadge, setFilterBadge] = useState('Tous');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        price: '',
        unit: '',
        image_url: '',
        badge: '',
        color: '#fb5607',
        category: 'Alimentation',
        merchant_id: '',
        description: ''
    });

    const [merchants, setMerchants] = useState<Merchant[]>([]);

    useEffect(() => {
        fetchProducts();
        fetchMerchants();
    }, []);

    const fetchMerchants = async () => {
        try {
            const { data, error } = await supabase
                .from('merchants')
                .select('id, name')
                .eq('status', 'active');
            if (data) setMerchants(data);
            if (error) throw error;
        } catch (err: any) {
            console.error('Error fetching merchants:', err.message);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setProducts(data);
            if (error) throw error;
        } catch (err: any) {
            console.error('Error fetching products:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const payload = {
                ...formData,
                price: parseInt(formData.price as string),
                badge: formData.badge || null,
                merchant_id: formData.merchant_id || null,
                updated_at: new Date().toISOString()
            };

            if (isEditing && selectedProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(payload)
                    .eq('id', selectedProduct.id);
                if (error) throw error;
                alert('Produit mis à jour !');
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([payload]);
                if (error) throw error;
                alert('Produit ajouté au store !');
            }

            resetForm();
            fetchProducts();
        } catch (err: any) {
            alert('Erreur: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            fetchProducts();
        } catch (err: any) {
            alert('Erreur suppression: ' + err.message);
        }
    };

    const handleEditClick = (product: Product) => {
        setSelectedProduct(product);
        setIsEditing(true);
        setFormData({
            name: product.name,
            brand: product.brand,
            price: product.price.toString(),
            unit: product.unit,
            image_url: product.image_url || '',
            badge: product.badge || '',
            color: product.color || '#fb5607',
            category: product.category || 'Alimentation',
            merchant_id: product.merchant_id || '',
            description: product.description || ''
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setIsModalOpen(false);
        setIsEditing(false);
        setSelectedProduct(null);
        setFormData({
            name: '', brand: '', price: '', unit: '',
            image_url: '', badge: '',
            color: '#fb5607', category: 'Alimentation',
            merchant_id: '', description: ''
        });
    };

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.brand.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === 'Tous' || p.category === filterCategory;
        const matchesPriceMin = minPrice === '' || p.price >= parseInt(minPrice);
        const matchesPriceMax = maxPrice === '' || p.price <= parseInt(maxPrice);
        const matchesBadge = filterBadge === 'Tous' ? true :
            filterBadge === 'Avec badge' ? p.badge !== null :
                p.badge === null;

        return matchesSearch && matchesCategory && matchesPriceMin && matchesPriceMax && matchesBadge;
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        return 0;
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `product-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setFormData({ ...formData, image_url: publicUrl });
        } catch (err: any) {
            alert('Erreur upload: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="flex-responsive" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '12px 24px', borderRadius: '16px',
                        background: 'var(--primary)', color: '#fff',
                        border: 'none', fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 6px 16px rgba(251, 86, 7, 0.25)', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <Plus size={18} /> Ajouter un Produit
                </button>
            </div>

            <div className="flex-responsive" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par nom ou marque..."
                        style={{
                            width: '100%', height: '48px', borderRadius: '16px',
                            border: '1.5px solid #e5e7eb', background: '#fff',
                            paddingLeft: '42px', paddingRight: '16px',
                            fontSize: '14px', fontWeight: 500, outline: 'none',
                        }}
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        padding: '0 20px', height: '48px', borderRadius: '16px',
                        border: '1.5px solid #e5e7eb', background: showFilters ? '#fb560710' : '#fff',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', color: showFilters ? '#fb5607' : '#6b7280',
                        fontWeight: 700, fontSize: '14px', transition: 'all 0.2s'
                    }}
                >
                    <Plus size={18} style={{ transform: showFilters ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                    Filtres {(!showFilters && (filterCategory !== 'Tous' || filterBadge !== 'Tous' || minPrice !== '' || maxPrice !== '')) && '●'}
                </button>
                <button
                    onClick={fetchProducts}
                    style={{
                        width: '48px', height: '48px', borderRadius: '16px',
                        border: '1.5px solid #e5e7eb', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#6b7280'
                    }}
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div style={{
                    background: '#f9fafb', borderRadius: '20px', padding: '24px',
                    marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px', border: '1px solid #f0f0f0'
                }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Catégorie</label>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 600 }}
                        >
                            <option>Tous</option>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Badge</label>
                        <select
                            value={filterBadge}
                            onChange={e => setFilterBadge(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 600 }}
                        >
                            <option>Tous</option>
                            <option>Avec badge</option>
                            <option>Sans badge</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Prix Range (XOF)</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={e => setMinPrice(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px' }}
                            />
                            <span style={{ color: '#d1d5db' }}>-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={e => setMaxPrice(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Trier par</label>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 600 }}
                        >
                            <option value="newest">Plus récent</option>
                            <option value="oldest">Plus ancien</option>
                            <option value="price_asc">Prix croissant</option>
                            <option value="price_desc">Prix décroissant</option>
                        </select>
                    </div>

                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => {
                                setFilterCategory('Tous');
                                setFilterBadge('Tous');
                                setMinPrice('');
                                setMaxPrice('');
                                setSortBy('newest');
                            }}
                            style={{ background: 'none', border: 'none', color: '#fb5607', fontSize: '12px', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Réinitialiser tous les filtres
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#9ca3af' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#fb5607', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: 600 }}>Synchronisation du store...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '32px', padding: '80px', textAlign: 'center', border: '1px dashed #e5e7eb' }}>
                    <div style={{ width: 64, height: 64, background: '#f3f4f6', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#d1d5db' }}>
                        <ShoppingBag size={32} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Aucun produit en rayon</h3>
                    <p style={{ color: '#9ca3af', maxWidth: '300px', margin: '8px auto 24px' }}>Commencez par ajouter des produits pour vos clients.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map(product => (
                        <div key={product.id} className="list-item-responsive" style={{
                            background: '#fff', borderRadius: '20px', border: '1px solid #f0f0f0',
                            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '20px',
                            position: 'relative', transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '16px',
                                background: (product.color || '#fb5607') + '15',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', flexShrink: 0, position: 'relative'
                            }}>
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <ShoppingBag size={24} color={product.color || '#fb5607'} />
                                )}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h4>
                                    {product.badge && (
                                        <span style={{
                                            background: (product.color || '#fb5607') + '20',
                                            color: product.color || '#fb5607',
                                            fontSize: '9px', fontWeight: 900, padding: '2px 8px',
                                            borderRadius: '6px', textTransform: 'uppercase',
                                            border: `1px solid ${product.color}33`
                                        }}>
                                            {product.badge}
                                        </span>
                                    )}
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '6px', background: '#f8fafc',
                                        fontSize: '10px', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap'
                                    }}>
                                        {product.category}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>{product.brand}</p>
                            </div>

                            <div style={{ textAlign: 'right', minWidth: '120px' }}>
                                <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prix</p>
                                <p style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: product.color || '#fb5607' }}>
                                    {product.price.toLocaleString()} <span style={{ fontSize: '10px', opacity: 0.6 }}>XOF / {product.unit}</span>
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                                <button
                                    onClick={() => handleEditClick(product)}
                                    style={{
                                        width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #f0f0f0',
                                        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: '#fb5607', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fff5f0'; e.currentTarget.style.borderColor = '#fb560733'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#f0f0f0'; }}
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    style={{
                                        width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #f0f0f0',
                                        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: '#ef4444', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#ef444433'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#f0f0f0'; }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Création / Édition */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '32px 40px 0', position: 'relative' }}>
                            <button onClick={resetForm} style={{ position: 'absolute', top: '28px', right: '32px', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={24} /></button>
                            <h3 style={{ fontSize: '24px', fontWeight: 900, margin: 0, color: '#111827' }}>
                                {isEditing ? 'Modifier le Produit' : 'Ajouter un Produit'}
                            </h3>
                            <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Renseignez les détails du produit pour le store mobile.</p>
                        </div>

                        <div style={{ padding: '24px 40px 40px', overflowY: 'auto' }}>
                            <form onSubmit={handleCreateOrUpdate} className="grid-modal-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="grid-full-width">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Nom du Produit</label>
                                    <input required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Riz Parfumé Long Grain" />
                                </div>
                                <div className="mobile-full-width">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Marque / Enseigne</label>
                                    <input required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px' }} value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Ex: NaturAfrik" />
                                </div>
                                <div className="mobile-full-width">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Catégorie</label>
                                    <select style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px', background: '#fff' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="mobile-full-width">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Prix (XOF)</label>
                                    <input type="number" required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px' }} value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="Ex: 2500" />
                                </div>
                                <div className="mobile-full-width">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Unité de vente</label>
                                    <input required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px' }} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="Ex: 1kg, 500g, 1L" />
                                </div>

                                <div className="grid-full-width">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Photo du Produit</label>
                                    <div style={{
                                        border: '2px dashed #e5e7eb',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        textAlign: 'center',
                                        position: 'relative',
                                        background: formData.image_url ? '#f8fafc' : '#fff',
                                        transition: 'all 0.2s'
                                    }}>
                                        {formData.image_url ? (
                                            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
                                                <img src={formData.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, image_url: '' })}
                                                    style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ cursor: 'pointer' }} onClick={() => document.getElementById('image-upload')?.click()}>
                                                <div style={{ width: '48px', height: '48px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#9ca3af' }}>
                                                    {uploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                                                </div>
                                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#6b7280', margin: 0 }}>
                                                    {uploading ? 'Chargement...' : 'Cliquer pour choisir une photo'}
                                                </p>
                                                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>PNG, JPG jusqu'à 5MB</p>
                                            </div>
                                        )}
                                        <input
                                            id="image-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </div>
                                <div className="mobile-full-width">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Badge (Optionnel)</label>
                                    <input style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px' }} value={formData.badge} onChange={e => setFormData({ ...formData, badge: e.target.value })} placeholder="Ex: Promo, Bio..." />
                                </div>

                                <div className="grid-full-width">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Marchand Propriétaire</label>
                                    <select
                                        required
                                        style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px', background: '#fff' }}
                                        value={formData.merchant_id}
                                        onChange={e => setFormData({ ...formData, merchant_id: e.target.value })}
                                    >
                                        <option value="">Sélectionner un marchand...</option>
                                        {merchants.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Ce produit sera rattaché à ce marchand pour les stocks et commandes.</p>
                                </div>

                                <div className="grid-full-width">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Description du Produit</label>
                                    <textarea
                                        style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px', minHeight: '100px', resize: 'vertical', background: '#fff' }}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Décrivez les caractéristiques, bienfaits ou conseils d'utilisation du produit..."
                                    />
                                </div>

                                <button disabled={processing} type="submit" className="grid-full-width" style={{ background: 'var(--primary)', color: '#fff', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: 800, fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 16px rgba(251, 86, 7, 0.25)', marginTop: '12px' }}>
                                    {processing ? 'Chargement...' : isEditing ? 'Sauvegarder les modifications' : 'Ajouter le produit'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
