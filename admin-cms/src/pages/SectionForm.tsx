/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Permet de créer ou de modifier visuellement une rubrique dynamique de l'accueil (ex: 'Plats épicés', 'Recettes du mois').
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Search, Utensils, Info, Sparkles, LayoutGrid, CheckCircle2, Store, ShoppingBag } from 'lucide-react';

interface Recipe {
    id: string;
    name: string;
    category: string;
    image: string;
    region: string;
    prep_time: string;
}

const INITIAL_STATE = {
    title: '',
    subtitle: '',
    recipe_ids: [] as string[],
    merchant_ids: [] as string[],
    order_index: 0,
    type: 'dynamic_carousel',
    config: {
        page: 'home',
        icon: '',
        design_style: 'design_1'
    } as Record<string, any>
};



const PAGES = [
    { value: 'home', label: 'Page d\'accueil' },
    { value: 'explorer', label: 'Page Explorer' },
    { value: 'shopping', label: 'Page Shopping' },
];

export function SectionForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [merchants, setMerchants] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isAIPrefilled, setIsAIPrefilled] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: recipeData } = await supabase
                    .from('recipes')
                    .select('id, name, category, image, region, prep_time')
                    .order('name');

                if (recipeData) setRecipes(recipeData);

                const { data: merchantData } = await supabase
                    .from('merchants')
                    .select('id, name, logo_url, category, city')
                    .order('name');

                if (merchantData) setMerchants(merchantData);

                const { data: productData } = await supabase
                    .from('products')
                    .select('id, name, image_url, category, brand, merchant_id')
                    .order('name');

                if (productData) setProducts(productData);

                if (id) {
                    const { data: sectionData, error } = await supabase
                        .from('home_sections')
                        .select('*')
                        .eq('id', id)
                        .single();

                    if (sectionData && !error) {
                        const config = { ...INITIAL_STATE.config, ...sectionData.config };
                        setFormData({
                            ...INITIAL_STATE,
                            ...sectionData,
                            merchant_ids: sectionData.merchant_ids || config.merchant_ids || [],
                            config
                        });
                    }
                } else {
                    // Check for AI prefill data
                    const aiPrefill = sessionStorage.getItem('ai_section_prefill');
                    if (aiPrefill) {
                        try {
                            const aiData = JSON.parse(aiPrefill);
                            setFormData(prev => ({
                                ...prev,
                                title: aiData.title || '',
                                subtitle: aiData.subtitle || '',
                                type: aiData.type || 'dynamic_carousel',
                                recipe_ids: aiData.recipe_ids || [],
                                config: {
                                    ...prev.config,
                                    page: aiData.page || 'home',
                                },
                            }));
                            setIsAIPrefilled(true);
                            sessionStorage.removeItem('ai_section_prefill');
                        } catch {
                            // ignore invalid prefill
                        }
                    }
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setInitialLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('config.')) {
            const configKey = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                config: { ...prev.config, [configKey]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, icon: reader.result as string }
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleToggleRecipe = (recipeId: string) => {
        setFormData(prev => {
            if (prev.recipe_ids.includes(recipeId)) {
                return { ...prev, recipe_ids: prev.recipe_ids.filter(rid => rid !== recipeId) };
            }
            return { ...prev, recipe_ids: [...prev.recipe_ids, recipeId] };
        });
    };

    const handleToggleMerchant = (merchantId: string) => {
        setFormData(prev => {
            if (prev.merchant_ids?.includes(merchantId)) {
                return { ...prev, merchant_ids: prev.merchant_ids.filter(mid => mid !== merchantId) };
            }
            return { ...prev, merchant_ids: [...(prev.merchant_ids || []), merchantId] };
        });
    };

    const handleSlideChange = (merchantId: string, field: string, value: any) => {
        setFormData(prev => {
            const currentSlides = prev.config.slides || {};
            const merchantSlide = currentSlides[merchantId] || {};
            return {
                ...prev,
                config: {
                    ...prev.config,
                    slides: {
                        ...currentSlides,
                        [merchantId]: {
                            ...merchantSlide,
                            [field]: value
                        }
                    }
                }
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                title: formData.title,
                subtitle: formData.subtitle,
                type: formData.type,
                config: {
                    ...formData.config,
                    merchant_ids: formData.merchant_ids || []
                },
                recipe_ids: formData.recipe_ids,
                order_index: formData.order_index
            };

            if (id) {
                const { error } = await supabase
                    .from('home_sections')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const newId = `${Date.now()}`;
                const { error } = await supabase
                    .from('home_sections')
                    .insert([{ ...payload, id: newId }]);
                if (error) throw error;
            }
            navigate('/sections');
        } catch (err) {
            console.error('Save error:', err);
            alert('Erreur lors de la sauvegarde.');
        } finally {
            setLoading(false);
        }
    };

    const filteredRecipes = recipes.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredMerchants = merchants.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.category && m.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (initialLoading) {
        return <div className="center-content"><div className="loader"></div></div>;
    }

    const inputStyle: React.CSSProperties = {
        height: '48px',
        borderRadius: '12px',
        border: '1.5px solid #e5e7eb',
        fontSize: '14px',
        fontWeight: 600,
        color: '#111827',
        backgroundColor: '#ffffff',
        padding: '0 16px',
        width: '100%',
        outline: 'none',
        transition: 'border-color 0.2s',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '11px',
        fontWeight: 800,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        marginBottom: '8px',
        display: 'block',
    };

    const cardStyle: React.CSSProperties = {
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #f0f0f0',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        overflow: 'hidden',
    };

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
            {/* AI Prefill Banner */}
            {isAIPrefilled && (
                <div style={{
                    marginBottom: '24px', padding: '16px 20px',
                    background: '#fff5f0',
                    borderRadius: '16px', border: '1.5px solid #fed7aa',
                    display: 'flex', alignItems: 'center', gap: '14px',
                }}>
                    <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #ff6b1a, #fb5607)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Sparkles size={18} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#9a3412' }}>Section pré-remplie par l'IA ✦</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#ea580c', fontWeight: 500 }}>
                            Vérifiez le titre, le type et les recettes sélectionnées avant de sauvegarder.
                        </p>
                    </div>
                </div>
            )}
            {/* Page Header */}
            <div className="flex-responsive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to="/sections" style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: '#f3f4f6', border: 'none', cursor: 'pointer',
                        color: '#374151', transition: 'background 0.15s',
                        textDecoration: 'none',
                    }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                            Sections
                        </p>

                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleSubmit as any}
                    disabled={loading}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'var(--primary)', color: '#fff',
                        border: 'none', borderRadius: '14px',
                        padding: '12px 24px', fontSize: '14px', fontWeight: 700,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                        transition: 'all 0.2s',
                    }}
                >
                    {loading
                        ? <div className="loader" style={{ width: 18, height: 18, borderLeftColor: '#fff' }}></div>
                        : <><Save size={17} /> Enregistrer</>
                    }
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid-form-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Panel 1: Identité de la section */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #fff5f0, #ffebd8)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Sparkles size={16} color="var(--primary)" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>Identité</h3>
                                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>Titre, description et page cible</p>
                            </div>
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="flex-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>{formData.type === 'advertising' ? 'Titre de la publicité' : 'Titre de la section'}</label>
                                    <input
                                        required
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder={formData.type === 'advertising' ? "Ex: Offre Spéciale Boutique" : "Ex: Spécialités du Sud"}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Page de destination</label>
                                    <select
                                        name="config.page"
                                        value={formData.config?.page || 'home'}
                                        onChange={(e) => setFormData(prev => ({ ...prev, config: { ...prev.config, page: e.target.value } }))}
                                        style={{ ...inputStyle, cursor: 'pointer' }}
                                    >
                                        {PAGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>{formData.type === 'advertising' ? 'Texte d\'accroche (Appel à l\'action)' : 'Description / Sous-titre'}</label>
                                <input
                                    name="subtitle"
                                    value={formData.subtitle}
                                    onChange={handleChange}
                                    placeholder={formData.type === 'advertising' ? "Ex: Découvrez nos produits frais" : "Une courte description de la section..."}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>{formData.type === 'advertising' ? 'Image de la publicité' : 'Icône de la section'}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <label style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        background: '#f9fafb', border: '1.5px dashed #d1d5db',
                                        borderRadius: '12px', padding: '10px 18px',
                                        fontSize: '13px', fontWeight: 600, color: '#6b7280',
                                        cursor: 'pointer',
                                    }}>
                                        📎 {formData.type === 'advertising' ? 'Choisir l\'image' : 'Choisir un fichier'}
                                        <input type="file" accept="image/*" onChange={handleIconChange} style={{ display: 'none' }} />
                                    </label>
                                    {formData.config?.icon && (
                                        <img src={formData.config.icon} alt="icon" style={{ height: '44px', width: '44px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #e5e7eb' }} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Panel 2: Type de la section */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LayoutGrid size={16} color="#d97706" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>Type d'affichage</h3>
                                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>Choisissez le format de rendu sur l'app mobile</p>
                            </div>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '14px' }}>                                {/* ── DYNAMIC CAROUSEL (new bank-card style) ── */}
                                {(() => {
                                    const isActive = formData.type === 'dynamic_carousel';
                                    return (
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'dynamic_carousel' }))}
                                            style={{ border: isActive ? '2.5px solid var(--primary)' : '2px solid #f0f0f0', background: isActive ? '#fff5f0' : '#fafafa', borderRadius: '18px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: 'all 0.2s', position: 'relative' }}>
                                            {isActive && <div style={{ position: 'absolute', top: '8px', right: '8px', color: 'var(--primary)' }}><CheckCircle2 size={14} /></div>}
                                            {/* Premium bank-card style mockup */}
                                            <div style={{ width: '100%', aspectRatio: '9/7', position: 'relative', overflow: 'hidden', borderRadius: '10px' }}>
                                                {/* Main card */}
                                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', borderRadius: '10px' }}>
                                                    {/* Blob decoration */}
                                                    <div style={{ position: 'absolute', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(196,181,253,0.25)', top: '-10px', right: '-10px' }} />
                                                    {/* Left text content */}
                                                    <div style={{ position: 'absolute', left: '8px', top: '10px', right: '42%' }}>
                                                        <div style={{ width: '55%', height: '3px', background: 'rgba(255,255,255,0.5)', borderRadius: '2px', marginBottom: '4px' }} />
                                                        <div style={{ width: '80%', height: '5px', background: '#fff', borderRadius: '2px', marginBottom: '3px' }} />
                                                        <div style={{ width: '65%', height: '5px', background: '#fff', borderRadius: '2px', marginBottom: '8px' }} />
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '6px' }}>
                                                            <div style={{ width: '55%', height: '2px', background: 'rgba(255,255,255,0.55)', borderRadius: '1px' }} />
                                                            <div style={{ width: '45%', height: '2px', background: 'rgba(255,255,255,0.55)', borderRadius: '1px' }} />
                                                        </div>
                                                        <div style={{ width: '30px', height: '8px', background: 'rgba(255,255,255,0.22)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.35)' }} />
                                                    </div>
                                                    {/* Right image circle */}
                                                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '42%', borderRadius: '0 10px 10px 0', overflow: 'hidden' }}>
                                                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', filter: 'brightness(0.75)' }} />
                                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #7C3AED, transparent 60%)' }} />
                                                    </div>
                                                </div>
                                                {/* Next card peek */}
                                                <div style={{ position: 'absolute', right: '-8px', top: '6px', bottom: '6px', width: '22px', borderRadius: '8px', background: 'linear-gradient(135deg, #fb5607, #C2410C)', opacity: 0.5 }} />
                                                {/* Dots */}
                                                <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '3px' }}>
                                                    <div style={{ width: '10px', height: '3px', borderRadius: '2px', background: '#7C3AED' }} />
                                                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#d1d5db' }} />
                                                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#d1d5db' }} />
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: isActive ? 'var(--primary)' : '#374151' }}>Carrousel</p>
                                                <p style={{ margin: 0, fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>Défilement</p>
                                            </div>
                                        </button>
                                    );
                                })()}

                                {/* ── BANNIERE (works exactly like dynamic_carousel) ── */}
                                {(() => {
                                    const isActive = formData.type === 'banner';
                                    return (
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'banner' }))}
                                            style={{ border: isActive ? '2.5px solid #ec4899' : '2px solid #f0f0f0', background: isActive ? '#fdf2f8' : '#fafafa', borderRadius: '18px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: 'all 0.2s', position: 'relative' }}>
                                            {isActive && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#ec4899' }}><CheckCircle2 size={14} /></div>}
                                            {/* Premium banner mockup */}
                                            <div style={{ width: '100%', aspectRatio: '9/7', position: 'relative', overflow: 'hidden', borderRadius: '10px' }}>
                                                {/* Main area */}
                                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #ec4899, #be185d)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                    <div style={{ width: '70%', height: '4px', background: '#fff', borderRadius: '2px' }} />
                                                    <div style={{ width: '50%', height: '3px', background: 'rgba(255,255,255,0.7)', borderRadius: '2px' }} />
                                                    <div style={{ position: 'absolute', bottom: '8px', display: 'flex', gap: '3px' }}>
                                                        <div style={{ width: '10px', height: '3px', borderRadius: '2px', background: '#fff' }} />
                                                        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
                                                        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: isActive ? '#ec4899' : '#374151' }}>Bannière</p>
                                                <p style={{ margin: 0, fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>Pleine largeur</p>
                                            </div>
                                        </button>
                                    );
                                })()}

                                {/* ── HORIZONTAL LIST ── */}
                                {(() => {
                                    const isActive = formData.type === 'horizontal_list';
                                    return (
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'horizontal_list' }))}
                                            style={{ border: isActive ? '2.5px solid #0ea5e9' : '2px solid #f0f0f0', background: isActive ? '#f0f9ff' : '#fafafa', borderRadius: '18px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: 'all 0.2s', position: 'relative' }}>
                                            {isActive && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#0ea5e9' }}><CheckCircle2 size={14} /></div>}
                                            {/* Mockup — food delivery card style */}
                                            <div style={{ width: '100%', aspectRatio: '9/7', display: 'flex', justifyContent: 'center', gap: '5px', overflow: 'hidden', padding: '4px 0' }}>
                                                {[
                                                    'linear-gradient(135deg, #f64f59, #c0392b)',
                                                    'linear-gradient(135deg, #667eea, #764ba2)',
                                                ].map((bg, i) => (
                                                    <div key={i} style={{
                                                        flexShrink: 0, width: '46%', borderRadius: '10px',
                                                        background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                                                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                                                        border: '1px solid #f0f0f0',
                                                    }}>
                                                        {/* Image area */}
                                                        <div style={{ height: '52%', background: bg, position: 'relative' }}>
                                                            {/* Price badge */}
                                                            <div style={{ position: 'absolute', top: '3px', left: '3px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '1px 4px' }}>
                                                                <div style={{ width: '12px', height: '3px', background: '#fff', borderRadius: '1px' }} />
                                                            </div>
                                                            {/* Heart */}
                                                            <div style={{ position: 'absolute', top: '3px', right: '3px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                                                            {/* Rating badge */}
                                                            <div style={{ position: 'absolute', bottom: '3px', left: '3px', background: 'rgba(255,255,255,0.85)', borderRadius: '3px', padding: '1px 3px' }}>
                                                                <div style={{ width: '10px', height: '2px', background: '#f59e0b', borderRadius: '1px' }} />
                                                            </div>
                                                        </div>
                                                        {/* Text content */}
                                                        <div style={{ padding: '4px 4px 5px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <div style={{ width: '80%', height: '3px', background: '#1a1a1a', borderRadius: '1px' }} />
                                                            <div style={{ width: '55%', height: '2px', background: '#d1d5db', borderRadius: '1px' }} />
                                                            <div style={{ width: '70%', height: '2px', background: '#e5e7eb', borderRadius: '1px' }} />
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                                                <div style={{ width: '35%', height: '3px', background: '#111827', borderRadius: '1px' }} />
                                                                <div style={{ display: 'flex', gap: '1px' }}>
                                                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444' }} />
                                                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#fecaca' }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: isActive ? '#0ea5e9' : '#374151' }}>Horizontal</p>
                                                <p style={{ margin: 0, fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>Scroll latéral</p>
                                            </div>
                                        </button>
                                    );
                                })()}

                                {/* ── HORIZONTAL LIST V2 ── */}
                                {(() => {
                                    const isActive = formData.type === 'horizontal_list_v2';
                                    return (
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'horizontal_list_v2' }))}
                                            style={{ border: isActive ? '2.5px solid #8b5cf6' : '2px solid #f0f0f0', background: isActive ? '#f5f3ff' : '#fafafa', borderRadius: '18px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: 'all 0.2s', position: 'relative' }}>
                                            {isActive && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#8b5cf6' }}><CheckCircle2 size={14} /></div>}
                                            {/* Mockup — Nos suggestions style */}
                                            <div style={{ width: '100%', aspectRatio: '9/7', display: 'flex', gap: '8px', padding: '4px 0', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                                                <div style={{ width: '85%', height: '65%', background: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', display: 'flex', position: 'relative', flexShrink: 0 }}>
                                                    <div style={{ flex: 1, padding: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', maxWidth: '60%' }}>
                                                        <div style={{ width: '90%', height: '3px', background: '#111827', borderRadius: '2px' }} />
                                                        <div style={{ width: '60%', height: '2px', background: '#9ca3af', borderRadius: '1px' }} />
                                                        <div style={{ width: '40%', height: '4px', background: '#111827', borderRadius: '2px', marginTop: '4px' }} />
                                                    </div>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #11998e, #38ef7d)', position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', border: '2px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
                                                </div>
                                                <div style={{ width: '30%', height: '65%', background: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', flexShrink: 0, padding: '6px' }}>
                                                    <div style={{ width: '90%', height: '3px', background: '#111827', borderRadius: '2px' }} />
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: isActive ? '#8b5cf6' : '#374151' }}>Horizontal v2</p>
                                                <p style={{ margin: 0, fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>Scroll latéral</p>
                                            </div>
                                        </button>
                                    );
                                })()}


                                {/* ── VERTICAL LIST 1 (1 col) ── */}
                                {(() => {
                                    const isActive = formData.type === 'vertical_list_1';
                                    return (
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'vertical_list_1' }))}
                                            style={{ border: isActive ? '2.5px solid #10b981' : '2px solid #f0f0f0', background: isActive ? '#f0fdf4' : '#fafafa', borderRadius: '18px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: 'all 0.2s', position: 'relative' }}>
                                            {isActive && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#10b981' }}><CheckCircle2 size={14} /></div>}
                                            {/* Mockup — food delivery vertical list */}
                                            <div style={{ width: '100%', aspectRatio: '9/7', display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'center' }}>
                                                {[
                                                    'linear-gradient(135deg, #f64f59, #c0392b)',
                                                    'linear-gradient(135deg, #667eea, #764ba2)',
                                                    'linear-gradient(135deg, #11998e, #38ef7d)',
                                                ].map((bg, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fff', borderRadius: '8px', padding: '4px 5px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
                                                        {/* Image */}
                                                        <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: bg, flexShrink: 0 }} />
                                                        {/* Infos */}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ width: '65%', height: '2.5px', background: '#111827', borderRadius: '1px', marginBottom: '2px' }} />
                                                            <div style={{ width: '45%', height: '2px', background: '#9ca3af', borderRadius: '1px', marginBottom: '2px' }} />
                                                            <div style={{ width: '55%', height: '2px', background: '#d1d5db', borderRadius: '1px' }} />
                                                        </div>
                                                        {/* Right: chevron */}
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: isActive ? '#10b981' : '#374151' }}>Liste</p>
                                                <p style={{ margin: 0, fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>1 colonne</p>
                                            </div>
                                        </button>
                                    );
                                })()}

                                {/* ── VERTICAL LIST 2 (grid 2 col) ── */}
                                {(() => {
                                    const isActive = formData.type === 'vertical_list_2';
                                    return (
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'vertical_list_2' }))}
                                            style={{ border: isActive ? '2.5px solid #f59e0b' : '2px solid #f0f0f0', background: isActive ? '#fffbeb' : '#fafafa', borderRadius: '18px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: 'all 0.2s', position: 'relative' }}>
                                            {isActive && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#f59e0b' }}><CheckCircle2 size={14} /></div>}
                                            {/* Mockup — grille 2 colonnes style card */}
                                            <div style={{ width: '100%', aspectRatio: '9/7', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', alignContent: 'center' }}>
                                                {[
                                                    'linear-gradient(135deg, #f64f59, #c0392b)',
                                                    'linear-gradient(135deg, #667eea, #764ba2)',
                                                    'linear-gradient(135deg, #11998e, #38ef7d)',
                                                    'linear-gradient(135deg, #f7971e, #ffd200)',
                                                ].map((bg, i) => (
                                                    <div key={i} style={{
                                                        borderRadius: '8px', background: '#fff',
                                                        boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                                                        overflow: 'hidden', border: '1px solid #f0f0f0',
                                                        display: 'flex', flexDirection: 'column',
                                                    }}>
                                                        {/* Image area */}
                                                        <div style={{ aspectRatio: '4/3', background: bg, position: 'relative' }}>
                                                            {/* Heart */}
                                                            <div style={{ position: 'absolute', top: '2px', right: '2px', width: '7px', height: '7px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
                                                            {/* Rating */}
                                                            <div style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(255,255,255,0.85)', borderRadius: '3px', padding: '1px 3px' }}>
                                                                <div style={{ width: '10px', height: '2px', background: '#f59e0b', borderRadius: '1px' }} />
                                                            </div>
                                                        </div>
                                                        {/* Text content */}
                                                        <div style={{ padding: '3px 4px 4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <div style={{ width: '80%', height: '2.5px', background: '#111827', borderRadius: '1px' }} />
                                                            <div style={{ width: '55%', height: '2px', background: '#d1d5db', borderRadius: '1px' }} />
                                                            <div style={{ width: '70%', height: '2px', background: '#e5e7eb', borderRadius: '1px' }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: isActive ? '#f59e0b' : '#374151' }}>Grille</p>
                                                <p style={{ margin: 0, fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>2 colonnes</p>
                                            </div>
                                        </button>
                                    );
                                })()}

                                {/* ── ADVERTISING ── */}
                                {(() => {
                                    const isActive = formData.type === 'advertising';
                                    return (
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'advertising' }))}
                                            style={{ border: isActive ? '2.5px solid #f59e0b' : '2px solid #f0f0f0', background: isActive ? '#fffbeb' : '#fafafa', borderRadius: '18px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: 'all 0.2s', position: 'relative' }}>
                                            {isActive && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#f59e0b' }}><CheckCircle2 size={14} /></div>}
                                            {/* Advertising mockup */}
                                            <div style={{ width: '100%', aspectRatio: '9/7', position: 'relative', overflow: 'hidden', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px', width: '80%' }}>
                                                    <div style={{ width: '100%', height: '4px', background: '#fff', borderRadius: '2px' }} />
                                                    <div style={{ width: '60%', height: '3px', background: 'rgba(255,255,255,0.7)', borderRadius: '2px' }} />
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                        <div style={{ width: '40%', height: '12px', background: '#fff', borderRadius: '4px', marginTop: '4px' }} />
                                                    </div>
                                                </div>
                                                <div style={{ position: 'absolute', top: '4px', left: '4px', fontSize: '8px', fontWeight: 900, color: '#fff' }}>AD</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: isActive ? '#f59e0b' : '#374151' }}>Publicité</p>
                                                <p style={{ margin: 0, fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>Boutique Shop</p>
                                            </div>
                                        </button>
                                    );
                                })()}


                            </div>

                            {/* Description contextuelle du type sélectionné */}
                            <div style={{ marginTop: '16px', background: '#f9fafb', borderRadius: '14px', padding: '14px 16px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <Info size={15} color="#9ca3af" style={{ flexShrink: 0, marginTop: '1px' }} />
                                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: 500, lineHeight: 1.6 }}>
                                    {formData.type === 'dynamic_carousel' && "Carrousel de cartes premium style bancaire — dégradé coloré, image à droite, contenu à gauche, aperçu de la carte suivante. Style moderne pour les sections vedettes."}
                                    {formData.type === 'banner' && "Bannière promotionnelle ou de mise en avant — similaire au carrousel dynamique visuellement, offrant un format grand écran immersif."}
                                    {formData.type === 'horizontal_list' && "Rangée de cards défilantes en scroll horizontal. Format compact adapté aux sections secondaires avec beaucoup de plats."}
                                    {formData.type === 'horizontal_list_v2' && "Scroll horizontal premium avec cards élégantes et image circulaire débordante. Idéal pour mettre en avant une sélection ciblée comme des suggestions."}
                                    {formData.type === 'vertical_list_1' && "Liste verticale avec une seule colonne. Format épuré avec image, nom et infos complémentaires sur chaque ligne."}
                                    {formData.type === 'vertical_list_2' && "Grille à 2 colonnes pour une vue compacte et visuelle. Parfait pour les pages de découverte avec de nombreuses recettes."}
                                    {formData.type === 'advertising' && "Bannière publicitaire immersive pour promouvoir des produits de la boutique ou des partenaires marchands."}
                                </p>
                            </div>

                            {/* Options conditionnelles */}
                            {(formData.type === 'dynamic_carousel' || formData.type === 'banner') && (() => {
                                const isAutoplay = formData.config?.autoplay === true || formData.config?.autoplay === 'true';
                                const intervalMs = parseInt(formData.config?.autoplay_interval) || 3000;
                                const intervalSec = intervalMs / 1000;

                                const TIMING_OPTIONS = [
                                    { value: 2000, label: '2s', desc: 'Rapide' },
                                    { value: 3000, label: '3s', desc: 'Normal' },
                                    { value: 4000, label: '4s', desc: 'Lent' },
                                    { value: 5000, label: '5s', desc: 'Très lent' },
                                    { value: 7000, label: '7s', desc: 'Pause' },
                                    { value: 10000, label: '10s', desc: 'Manuel' },
                                ];

                                return (
                                    <div style={{ marginTop: '16px', background: '#fafafa', borderRadius: '16px', padding: '18px', border: '1px solid #f0f0f0' }}>
                                        {/* Header row */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <p style={{ ...labelStyle, margin: 0 }}>Options du Carrousel</p>
                                            {isAutoplay && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff5f0', borderRadius: '20px', padding: '4px 10px' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s infinite' }} />
                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>AUTO · {intervalSec}s</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Row 1: toggles */}
                                        <div className="flex-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                                            {/* Autoplay toggle */}
                                            <label htmlFor="autoplay" style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                background: isAutoplay ? 'rgba(67,24,255,0.04)' : '#fff',
                                                borderRadius: '12px', padding: '12px 14px',
                                                border: isAutoplay ? '1.5px solid rgba(67,24,255,0.18)' : '1px solid #e5e7eb',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                            }}>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: isAutoplay ? 'var(--primary)' : '#374151' }}>Défilement auto</p>
                                                    <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af' }}>Avance seul</p>
                                                </div>
                                                <input
                                                    type="checkbox" id="autoplay"
                                                    checked={isAutoplay}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, config: { ...prev.config, autoplay: e.target.checked } }))}
                                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                                />
                                            </label>
                                            {/* Show dots toggle */}
                                            <label htmlFor="show_dots" style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                background: '#fff', borderRadius: '12px', padding: '12px 14px',
                                                border: '1px solid #e5e7eb', cursor: 'pointer',
                                            }}>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151' }}>Points de nav</p>
                                                    <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af' }}>Indicateurs</p>
                                                </div>
                                                <input
                                                    type="checkbox" id="show_dots"
                                                    checked={formData.config?.show_dots === true || formData.config?.show_dots === 'true'}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, config: { ...prev.config, show_dots: e.target.checked } }))}
                                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                                />
                                            </label>
                                        </div>

                                        {/* Row 2: Timing pills — visible only when autoplay ON */}
                                        {isAutoplay && (
                                            <div>
                                                <p style={{ ...labelStyle, marginBottom: '10px', color: 'var(--primary)' }}>⏱ Intervalle de défilement</p>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {TIMING_OPTIONS.map(opt => {
                                                        const active = intervalMs === opt.value;
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, config: { ...prev.config, autoplay_interval: opt.value } }))}
                                                                style={{
                                                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                                    padding: '8px 14px', borderRadius: '12px', cursor: 'pointer',
                                                                    border: active ? '2px solid var(--primary)' : '1.5px solid #e5e7eb',
                                                                    background: active ? 'linear-gradient(135deg, #fff5f0, #ffebd8)' : '#fff',
                                                                    transition: 'all 0.15s', minWidth: '52px',
                                                                }}
                                                            >
                                                                <span style={{ fontSize: '14px', fontWeight: 800, color: active ? 'var(--primary)' : '#374151' }}>{opt.label}</span>
                                                                <span style={{ fontSize: '9px', color: active ? 'var(--primary)' : '#9ca3af', marginTop: '2px', fontWeight: 600 }}>{opt.desc}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {/* Progress bar preview */}
                                                <div style={{ marginTop: '14px', background: '#e5e7eb', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                                                    <div
                                                        style={{
                                                            height: '100%', borderRadius: '4px',
                                                            background: 'linear-gradient(90deg, #fb5607, #ff8c42)',
                                                            width: `${Math.round((intervalMs / 10000) * 100)}%`,
                                                            transition: 'width 0.3s ease',
                                                        }}
                                                    />
                                                </div>
                                                <p style={{ margin: '6px 0 0', fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>
                                                    La card suivante s'affiche après <strong style={{ color: 'var(--primary)' }}>{intervalSec} secondes</strong>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                        </div>
                    </div>

                    {/* Panel 3: Éléments sélectionnés (Plats ou Produits) */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', background: formData.type === 'advertising' ? 'linear-gradient(135deg, #fb560710, #fb560720)' : 'linear-gradient(135deg, #fef2f2, #fecaca)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {formData.type === 'advertising' ? <ShoppingBag size={16} color="var(--primary)" /> : <Utensils size={16} color="#ef4444" />}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>
                                        {formData.type === 'advertising' ? 'Produits en vedette' : 'Plats sélectionnés'}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>
                                        {formData.type === 'advertising'
                                            ? ((formData.merchant_ids?.length || 0) === 0 ? 'Aucun produit sélectionné' : `${formData.merchant_ids?.length || 0} produit${(formData.merchant_ids?.length || 0) > 1 ? 's' : ''} sélectionné${(formData.merchant_ids?.length || 0) > 1 ? 's' : ''}`)
                                            : (formData.recipe_ids.length === 0 ? 'Aucun plat — sélectionnez dans le catalogue' : `${formData.recipe_ids.length} plat${formData.recipe_ids.length > 1 ? 's' : ''} épinglé${formData.recipe_ids.length > 1 ? 's' : ''}`)
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {formData.type === 'advertising' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                                    {formData.merchant_ids?.map(pid => {
                                        const p = products.find(prod => prod.id === pid);
                                        return p ? (
                                            <div key={pid} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ height: '80px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                                                    {p.image_url ? <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ShoppingBag size={32} color="#d1d5db" />}
                                                </div>
                                                <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#111827', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                                    {formData.recipe_ids.map(rid => {
                                        const r = recipes.find(rec => rec.id === rid);
                                        return r ? (
                                            <div key={rid} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <img src={r.image} style={{ height: '100px', borderRadius: '14px', objectFit: 'cover' }} />
                                                <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#111827' }}>{r.name}</p>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel 4: Configuration spécifique par Slide (uniquement pour Publicité) */}
                    {formData.type === 'advertising' && (formData.merchant_ids?.length || 0) > 0 && (
                        <div style={cardStyle}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #fb560710, #fb560720)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <LayoutGrid size={16} color="var(--primary)" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>Configuration des Slides</h3>
                            </div>
                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {formData.merchant_ids?.map((itemId, idx) => {
                                    const item = formData.type === 'advertising'
                                        ? products.find(p => p.id === itemId)
                                        : merchants.find(mer => mer.id === itemId);
                                    if (!item) return null;
                                    const slideConfig = formData.config?.slides?.[itemId] || {};
                                    return (
                                        <div key={itemId} style={{ border: '1.5px solid #f3f4f6', borderRadius: '16px', overflow: 'hidden' }}>
                                            <div style={{ background: '#f9fafb', padding: '12px 16px', borderBottom: '1.5px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900 }}>
                                                    {idx + 1}
                                                </div>
                                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#111827' }}>{item.name}</p>
                                            </div>
                                            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                                <div>
                                                    <label style={labelStyle}>Titre sur la slide</label>
                                                    <input
                                                        type="text"
                                                        placeholder={formData.type === 'advertising' ? "Ex: Achetez maintenant" : "Ex: -20% sur tout le rayon"}
                                                        value={slideConfig.title || ''}
                                                        onChange={(e) => handleSlideChange(itemId, 'title', e.target.value)}
                                                        style={inputStyle}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Sous-titre / Description</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: Uniquement ce weekend..."
                                                        value={slideConfig.subtitle || ''}
                                                        onChange={(e) => handleSlideChange(itemId, 'subtitle', e.target.value)}
                                                        style={inputStyle}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Texte du bouton (CTA)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: Voir plus"
                                                        value={slideConfig.button_text || (formData.type === 'advertising' ? 'Acheter' : 'Boutique')}
                                                        onChange={(e) => handleSlideChange(itemId, 'button_text', e.target.value)}
                                                        style={inputStyle}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Badge (ex: PROMO)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: OFFRE"
                                                        value={slideConfig.tag || ''}
                                                        onChange={(e) => handleSlideChange(itemId, 'tag', e.target.value)}
                                                        style={inputStyle}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Couleur / Dégradé (CSS)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: linear-gradient(...)"
                                                        value={slideConfig.background || ''}
                                                        onChange={(e) => handleSlideChange(itemId, 'background', e.target.value)}
                                                        style={inputStyle}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN — Catalogue */}
                <div className="sidebar-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 20px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>
                                    {formData.type === 'advertising' ? 'Catalogue des Produits' : 'Catalogue des Plats'}
                                </h3>
                                {formData.type !== 'featured' && (
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            type="button"
                                            title="Tout sélectionner"
                                            onClick={() => {
                                                const listToCheck = formData.type === 'advertising' ? filteredProducts : filteredRecipes;
                                                const fieldToId = formData.type === 'advertising' ? 'merchant_ids' : 'recipe_ids';
                                                const filteredIds = listToCheck.map(item => item.id);
                                                const newIds = Array.from(new Set([...(formData[fieldToId] || []), ...filteredIds]));
                                                setFormData(prev => ({ ...prev, [fieldToId]: newIds }));
                                            }}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                                                background: '#f0fdf4', color: '#16a34a',
                                                border: '1.5px solid #bbf7d0', cursor: 'pointer',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <CheckCircle2 size={12} /> Tout
                                        </button>
                                        <button
                                            type="button"
                                            title="Tout désélectionner"
                                            onClick={() => {
                                                const listToCheck = formData.type === 'advertising' ? filteredProducts : filteredRecipes;
                                                const fieldToId = formData.type === 'advertising' ? 'merchant_ids' : 'recipe_ids';
                                                const filteredIds = new Set(listToCheck.map(item => item.id));
                                                setFormData(prev => ({
                                                    ...prev,
                                                    [fieldToId]: (prev[fieldToId] || []).filter(id => !filteredIds.has(id))
                                                }));
                                            }}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                                                background: '#fff5f5', color: '#dc2626',
                                                border: '1.5px solid #fecaca', cursor: 'pointer',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <Trash2 size={12} /> Aucun
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>
                                {formData.type === 'advertising'
                                    ? <>{filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} affiché{filteredProducts.length !== 1 ? 's' : ''}</>
                                    : <>{filteredRecipes.length} plat{filteredRecipes.length !== 1 ? 's' : ''} affiché{filteredRecipes.length !== 1 ? 's' : ''}</>
                                }
                                {(formData.type === 'advertising' ? (formData.merchant_ids?.length || 0) : formData.recipe_ids.length) > 0 && (
                                    <span style={{ marginLeft: '6px', fontWeight: 700, color: '#16a34a' }}>
                                        · {formData.type === 'advertising' ? (formData.merchant_ids?.length || 0) : formData.recipe_ids.length} sélectionné{(formData.type === 'advertising' ? (formData.merchant_ids?.length || 0) : formData.recipe_ids.length) > 1 ? 's' : ''}
                                    </span>
                                )}
                            </p>
                            {formData.type === 'featured' && (
                                <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1.5px solid #86efac', borderRadius: '10px', padding: '8px 12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '14px' }}>⭐</span>
                                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#16a34a', lineHeight: 1.4 }}>
                                        Mode <strong>Mise en avant</strong> — 1 seul plat autorisé.
                                    </p>
                                </div>
                            )}
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px' }} />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ ...inputStyle, paddingLeft: '40px', background: '#f9fafb', border: '1.5px solid #f0f0f0' }}
                                />
                            </div>
                        </div>

                        <div style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto', padding: '8px 12px 12px' }}>
                            {formData.type === 'advertising' ? (
                                filteredProducts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                                        <ShoppingBag size={28} color="#d1d5db" style={{ marginBottom: '8px' }} />
                                        <p style={{ color: '#9ca3af', fontSize: '13px', fontWeight: 600, margin: 0 }}>Aucun produit</p>
                                    </div>
                                ) : filteredProducts.map(product => {
                                    const selected = formData.merchant_ids?.includes(product.id);
                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => handleToggleMerchant(product.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 8px',
                                                borderRadius: '12px', cursor: 'pointer',
                                                background: selected ? 'rgba(251,86,7,0.06)' : 'transparent',
                                                border: selected ? '1px solid rgba(251,86,7,0.2)' : '1px solid transparent',
                                                marginBottom: '4px', transition: 'all 0.15s',
                                            }}
                                        >
                                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f0f0f0', flexShrink: 0 }}>
                                                {product.image_url ? <img src={product.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ShoppingBag size={20} color="#d1d5db" />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: selected ? 'var(--primary)' : '#111827', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {product.name}
                                                </p>
                                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>{product.brand || product.category || 'Article'}</p>
                                            </div>
                                            <div style={{
                                                width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                                                background: selected ? 'var(--primary)' : '#f3f4f6',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s',
                                            }}>
                                                <CheckCircle2 size={15} color={selected ? '#fff' : '#d1d5db'} fill="none" />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                filteredRecipes.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                                        <Utensils size={28} color="#d1d5db" style={{ marginBottom: '8px' }} />
                                        <p style={{ color: '#9ca3af', fontSize: '13px', fontWeight: 600, margin: 0 }}>Aucun résultat</p>
                                    </div>
                                ) : filteredRecipes.map(recipe => {
                                    const selected = formData.recipe_ids.includes(recipe.id);
                                    return (
                                        <div
                                            key={recipe.id}
                                            onClick={() => handleToggleRecipe(recipe.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 8px',
                                                borderRadius: '12px',
                                                cursor: (formData.type === 'featured' && !selected && formData.recipe_ids.length >= 1) ? 'not-allowed' : 'pointer',
                                                opacity: (formData.type === 'featured' && !selected && formData.recipe_ids.length >= 1) ? 0.4 : 1,
                                                background: selected ? 'rgba(22,163,74,0.06)' : 'transparent',
                                                border: selected ? '1px solid rgba(22,163,74,0.2)' : '1px solid transparent',
                                                marginBottom: '4px', transition: 'all 0.15s',
                                            }}
                                        >
                                            <img src={recipe.image} style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: selected ? '2px solid #16a34a' : '2px solid transparent', transition: 'border 0.15s' }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: selected ? '#16a34a' : '#111827', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {recipe.name}
                                                </p>
                                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>{recipe.category}</p>
                                            </div>
                                            <div style={{
                                                width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                                                background: selected ? '#16a34a' : '#f3f4f6',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s',
                                            }}>
                                                <CheckCircle2 size={15} color={selected ? '#fff' : '#d1d5db'} fill="none" />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px', border: '1px solid #f0f0f0' }}>
                        <Info size={15} color="#9ca3af" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 500, lineHeight: 1.5 }}>
                            L'ordre d'affichage des sections se gère depuis la liste des sections.
                        </p>
                    </div>
                </div>
            </form >
        </div >
    );
}
