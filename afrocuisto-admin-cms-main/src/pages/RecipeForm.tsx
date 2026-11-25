/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Formulaire massif permettant l'ajout ou la modification intégrale d'une recette (image, étapes, ingrédients, temps de cuisson, etc.).
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { AdminSelect } from '../components/AdminSelect';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, ImagePlus, X, Clock, Flame, Globe, Tag, BookOpen, Sparkles, ChefHat, Leaf, Wand2, Zap, Youtube, Crop, Plus, Trash2, ArrowUp, ArrowDown, ListOrdered, ShoppingBasket, AlertCircle } from '../components/SolarIcons';
import { aiService } from '../lib/ai';
import { ImageCropModal } from '../components/ImageCropModal';

interface IngredientItem {
    name: string;
    amount: string;
    unit: string;
    isOptional?: boolean;
    substitute?: string;
}

function normalizeIngredients(raw: any): IngredientItem[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item: any) => ({
        name: String(item?.name || ''),
        amount: String(item?.amount ?? item?.quantity ?? ''),
        unit: String(item?.unit || ''),
        isOptional: Boolean(item?.isOptional),
        substitute: item?.substitute ? String(item.substitute) : '',
    }));
}

function normalizeSteps(raw: any): string[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((s: any) =>
            typeof s === 'string'
                ? s
                : [s?.title, s?.description].filter(Boolean).join(' : ')
        )
        .filter((s: string) => s.trim().length > 0);
}

const INITIAL_STATE = {
    name: '',
    alias: '',
    region: '',
    category: '',
    difficulty: 'Moyen',
    prep_time: '',
    cook_time: '',
    image: '',
    description: '',
    technique_title: '',
    technique_description: '',
    benefits: '',
    style: '',
    type: '',
    base: '',
    origine_humaine: '',
    video_url: '',
    ingredients: [] as IngredientItem[],
    steps: [] as string[],
};

export const CATEGORIES = [
    { value: "Pâtes et Céréales (Wɔ̌)", label: "Pâtes et Céréales" },
    { value: "Sauces (Nùsúnnú)", label: "Sauces" },
    { value: "Plats de Résistance & Ragoûts", label: "Plats de Résistance" },
    { value: "Protéines & Grillades", label: "Protéines & Grillades" },
    { value: "Street Food & Snacks (Amuse-bouche)", label: "Street Food & Snacks" },
    { value: "Boissons & Douceurs", label: "Boissons & Douceurs" },
    { value: "Condiments & Accompagnements", label: "Condiments & Accompagnements" },
];

const DIFFICULTIES = ['Très Facile', 'Facile', 'Intermédiaire', 'Moyen', 'Difficile', 'Très Difficile', 'Extrême'];

/* ── reusable style tokens ── */
const inputStyle: React.CSSProperties = {
    height: '46px', width: '100%',
    borderRadius: '12px', border: '1.5px solid #e5e7eb',
    fontSize: '14px', fontWeight: 600, color: '#111827',
    backgroundColor: '#fff', padding: '0 14px', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
    ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'vertical', lineHeight: 1.6,
};

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 800,
    color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px',
};

const cardStyle: React.CSSProperties = {
    background: '#fff', borderRadius: '20px',
    border: '1px solid #f0f0f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    overflow: 'hidden',
};

const sectionHeader = (icon: React.ReactNode, title: string, subtitle: string, iconBg: string) => (
    <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
        </div>
        <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>{title}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>{subtitle}</p>
        </div>
    </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label style={labelStyle}>{label}</label>
        {children}
    </div>
);

export function RecipeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!id);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    const [aiPrefilled, setAiPrefilled] = useState(false);
    const [cropSrc, setCropSrc] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            supabaseAdmin.from('recipes').select('*').eq('id', id).single().then(({ data, error }) => {
                if (data && !error) {
                    setFormData({
                        ...INITIAL_STATE,
                        ...data,
                        ingredients: normalizeIngredients(data.ingredients),
                        steps: normalizeSteps(data.steps),
                    });
                }
                setInitialLoading(false);
            });
        } else {
            // Vérifier s'il y a des données IA à pré-remplir
            const aiData = sessionStorage.getItem('ai_recipe_prefill');
            if (aiData) {
                try {
                    const parsed = JSON.parse(aiData);
                    setFormData(prev => ({
                        ...prev,
                        ...parsed,
                        ingredients: normalizeIngredients(parsed.ingredients),
                        steps: normalizeSteps(parsed.steps),
                    }));
                    setAiPrefilled(true);
                    sessionStorage.removeItem('ai_recipe_prefill');
                } catch (_) { }
            }
        }
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const addIngredient = () => {
        setFormData(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { name: '', amount: '', unit: '', isOptional: false, substitute: '' }],
        }));
    };

    const updateIngredient = (index: number, patch: Partial<IngredientItem>) => {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)),
        }));
    };

    const removeIngredient = (index: number) => {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index),
        }));
    };

    const addStep = () => {
        setFormData(prev => ({ ...prev, steps: [...prev.steps, ''] }));
    };

    const updateStep = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.map((s, i) => (i === index ? value : s)),
        }));
    };

    const removeStep = (index: number) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index),
        }));
    };

    const moveStep = (index: number, direction: 'up' | 'down') => {
        const target = direction === 'up' ? index - 1 : index + 1;
        setFormData(prev => {
            if (target < 0 || target >= prev.steps.length) return prev;
            const next = [...prev.steps];
            const [moved] = next.splice(index, 1);
            next.splice(target, 0, moved);
            return { ...prev, steps: next };
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setCropSrc(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleCroppedUpload = async (croppedBlob: Blob) => {
        setCropSrc(null);
        const filePath = `recipe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
        setUploading(true);
        try {
            const { error: uploadError } = await supabaseAdmin.storage
                .from('recipe-images')
                .upload(filePath, croppedBlob, { contentType: 'image/jpeg' });
            if (uploadError) throw uploadError;
            const { data } = supabaseAdmin.storage.from('recipe-images').getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, image: data.publicUrl }));
        } catch (err) {
            console.error('Upload error:', err);
            alert("Erreur lors du téléchargement de l'image.");
        } finally {
            setUploading(false);
        }
    };

    const handleAIFill = async () => {
        if (!formData.name.trim()) { alert("Entrez d'abord le nom du plat."); return; }
        setAiLoading(true);
        setAiError('');
        try {
            const { data, error } = await aiService.generateFullRecipe(formData.name);
            if (data) {
                const ingredients = normalizeIngredients(data.ingredients);
                const steps = normalizeSteps(data.steps);
                setFormData(prev => ({
                    ...prev,
                    alias: data.alias ?? prev.alias,
                    region: data.region ?? prev.region,
                    category: data.category ?? prev.category,
                    difficulty: data.difficulty ?? prev.difficulty,
                    prep_time: data.prep_time ?? prev.prep_time,
                    cook_time: data.cook_time ?? prev.cook_time,
                    description: data.description ?? prev.description,
                    technique_title: data.technique_title ?? prev.technique_title,
                    technique_description: data.technique_description ?? prev.technique_description,
                    benefits: data.benefits ?? prev.benefits,
                    style: data.style ?? prev.style,
                    type: data.type ?? prev.type,
                    base: data.base ?? prev.base,
                    name: prev.name,
                    ingredients,
                    steps,
                }));
                setAiPrefilled(true);
                if (ingredients.length === 0 || steps.length === 0) {
                    setAiError('La fiche a été générée, mais les ingrédients ou les étapes sont incomplets. Réessayez pour compléter la recette.');
                }
            } else {
                setAiError(error || 'La génération IA a échoué. Réessayez.');
            }
        } catch (error: any) {
            setAiError(error?.message || 'La génération IA a échoué. Réessayez.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const cleanData = {
            ...formData,
            ingredients: (formData.ingredients || []).filter(i => i.name.trim().length > 0),
            steps: (formData.steps || []).map(s => s.trim()).filter(Boolean),
        };
        // `servings` is generated for the preview but is not a column in recipes.
        delete (cleanData as any).servings;

        let createdRecipeId: string | null = null;
        const trySave = async (data: Record<string, any>) => {
            if (id) {
                return supabaseAdmin.from('recipes').update(data).eq('id', id);
            } else {
                createdRecipeId = `rec_${Date.now()}`;
                (data as any).id = createdRecipeId;
                return supabaseAdmin.from('recipes').insert([data]);
            }
        };

        const publishNewRecipeNotification = async () => {
            if (id || !createdRecipeId) return;
            const region = cleanData.region?.trim() || 'Terroir';
            const prep = cleanData.prep_time?.trim() || '30 min';
            const desc = (cleanData.description || '').trim();
            const snippet = desc.length > 90 ? `${desc.slice(0, 87)}...` : desc;
            await supabaseAdmin.from('app_notifications').insert([{
                title: `Nouvelle recette : ${cleanData.name}`,
                body: snippet
                    ? `${region} • ${prep} — ${snippet}`
                    : `${region} • ${prep} — Découvrez ce nouveau plat authentique sur AfroCuisto.`,
                action_route: `recipe:${createdRecipeId}`,
                is_active: true,
            }]);
        };

        try {
            let { error } = await trySave({ ...cleanData });

            // Si la colonne video_url n'existe pas encore en BDD, réessayer sans elle
            if (error && (error.message?.includes('video_url') || (error as any).code === '42703')) {
                console.warn('Colonne video_url absente — sauvegarde sans le champ vidéo.');
                const dataWithoutVideo = { ...cleanData };
                delete (dataWithoutVideo as any).video_url;
                const retry = await trySave(dataWithoutVideo);
                if (!retry.error) {
                    await publishNewRecipeNotification();
                    alert('✅ Recette sauvegardée.\n\n⚠️ Le lien vidéo n\'a pas pu être enregistré car la colonne n\'existe pas encore dans la base de données.\n\nPour activer cette fonctionnalité, exécutez ce SQL dans Supabase :\nALTER TABLE recipes ADD COLUMN IF NOT EXISTS video_url TEXT;');
                    navigate('/recipes');
                    return;
                }
                error = retry.error;
            }

            if (error) throw error;
            await publishNewRecipeNotification();
            navigate('/recipes');
        } catch (err) {
            console.error('Save error:', err);
            const message = err instanceof Error ? err.message : String(err || 'Erreur inconnue');
            alert(`Erreur lors de la sauvegarde : ${message}`);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="center-content"><div className="loader"></div></div>;

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>

            {/* ── Header ── */}
            <div className="recipe-form-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to="/recipes" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: '#f3f4f6', border: 'none', color: '#374151',
                        textDecoration: 'none', transition: 'background 0.15s',
                    }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recettes</p>


                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleSubmit as any}
                    disabled={loading}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'var(--primary)', color: '#fff', border: 'none',
                        borderRadius: '14px', padding: '12px 24px',
                        fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                    }}
                >
                    {loading
                        ? <div className="loader" style={{ width: 18, height: 18, borderLeftColor: '#fff' }} />
                        : <><Save size={17} /> Enregistrer</>
                    }
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid-form-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', alignItems: 'start' }}>
                {/* ══ LEFT COLUMN ══ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Bandeau pré-remplissage IA */}
                    {aiPrefilled && (
                        <div style={{
                            borderRadius: '16px',
                            background: '#fff5f0',
                            border: '1.5px solid #fed7aa',
                            padding: '14px 18px',
                            display: 'flex', alignItems: 'center', gap: '12px',
                        }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #ff6b1a, #fb5607)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Sparkles size={16} color="#fff" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#9a3412' }}>Pré-rempli par l'Assistant IA ✨</p>
                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#ea580c' }}>Vérifiez et complétez les champs — ajoutez notamment une photo du plat.</p>
                            </div>
                            <button onClick={() => setAiPrefilled(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                                <X size={15} />
                            </button>
                        </div>
                    )}

                    {/* Panel: Identity */}
                    <div style={cardStyle}>
                        {sectionHeader(<ChefHat size={18} color="var(--primary)" />, 'Identité du Plat', 'Nom, alias et classification', '#fff5f0')}
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <Field label="Nom de la recette *">
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input required name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Amiwo, Gbegiri, Aloko..." style={{ ...inputStyle, flex: 1 }} />
                                    <button
                                        type="button"
                                        onClick={handleAIFill}
                                        disabled={aiLoading}
                                        style={{
                                            ...inputStyle,
                                            width: 'auto',
                                            padding: '0 16px',
                                            background: aiLoading ? '#f3f4f6' : 'linear-gradient(135deg, #ff8c42, #fb5607)',
                                            color: aiLoading ? '#9ca3af' : '#fff',
                                            border: 'none',
                                            cursor: aiLoading ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            boxShadow: aiLoading ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.12)',
                                        }}
                                    >
                                        {aiLoading ? <Zap size={14} className="animate-spin" /> : <Wand2 size={14} />}
                                        <span style={{ whiteSpace: 'nowrap' }}>{aiLoading ? 'IA en cours...' : 'Remplir par l\'IA'}</span>
                                    </button>
                                </div>
                                {aiError && (
                                    <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '8px', padding: '10px 12px', borderRadius: '10px', background: '#fff7ed', color: '#9a3412', fontSize: '12px', lineHeight: 1.5 }}>
                                        <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                                        <span style={{ flex: 1 }}>{aiError}</span>
                                        <button type="button" onClick={handleAIFill} disabled={aiLoading} style={{ border: 0, background: 'transparent', color: '#c2410c', fontSize: '12px', fontWeight: 800, cursor: aiLoading ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
                                            Réessayer
                                        </button>
                                    </div>
                                )}
                            </Field>
                            <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <Field label="Alias / Nom local">
                                    <input name="alias" value={formData.alias || ''} onChange={handleChange} placeholder="Nom en langue locale" style={inputStyle} />
                                </Field>
                                <Field label="Catégorie">
                                    <AdminSelect
                                        ariaLabel="Catégorie de la recette"
                                        value={formData.category || ''}
                                        onChange={value => setFormData(prev => ({ ...prev, category: value }))}
                                        options={[
                                            { value: '', label: 'Sélectionner...' },
                                            ...CATEGORIES.map(category => ({ value: category.value, label: category.label })),
                                        ]}
                                        style={{ width: '100%' }}
                                        triggerStyle={{ height: '46px' }}
                                    />
                                </Field>
                            </div>
                            <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <Field label="Type de Plat">
                                    <input name="type" value={formData.type || ''} onChange={handleChange} placeholder="Plat principal, Dessert..." style={inputStyle} />
                                </Field>
                                <Field label="Style de Cuisson">
                                    <input name="style" value={formData.style || ''} onChange={handleChange} placeholder="Braisé, Vapeur, Frit..." style={inputStyle} />
                                </Field>
                            </div>
                            <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <Field label="Ingrédient de Base">
                                    <input name="base" value={formData.base || ''} onChange={handleChange} placeholder="Maïs, Manioc, Poulet..." style={inputStyle} />
                                </Field>
                                <Field label="Origine Culturelle">
                                    <input name="origine_humaine" value={formData.origine_humaine || ''} onChange={handleChange} placeholder="Fon, Mina, Yoruba..." style={inputStyle} />
                                </Field>
                            </div>
                        </div>
                    </div>

                    {/* Panel: Description */}
                    <div style={cardStyle}>
                        {sectionHeader(<BookOpen size={18} color="var(--primary)" />, "Détails de la Recette", "Description, technique et bénéfices", "#fff5f0")}
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <Field label="Description / Introduction">
                                <textarea
                                    name="description"
                                    value={formData.description || ''}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Décrivez le plat, son histoire, son contexte culturel..."
                                    style={textareaStyle}
                                />
                            </Field>
                            <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <Field label="Technique — Titre">
                                    <input name="technique_title" value={formData.technique_title || ''} onChange={handleChange} placeholder="Ex: La cuisson à l'étouffée" style={inputStyle} />
                                </Field>
                                <Field label="Bienfaits Nutritionnels">
                                    <input name="benefits" value={formData.benefits || ''} onChange={handleChange} placeholder="Ex: Riche en fibres, protéines..." style={inputStyle} />
                                </Field>
                            </div>
                            <Field label="Technique — Description">
                                <textarea
                                    name="technique_description"
                                    value={formData.technique_description || ''}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Détaillez la technique de préparation..."
                                    style={textareaStyle}
                                />
                            </Field>

                            {/* ── Vidéo YouTube ── */}
                            <Field label="Lien Vidéo YouTube">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <Youtube size={16} color="#ff0000" style={{ position: 'absolute', left: '13px', flexShrink: 0 }} />
                                        <input
                                            name="video_url"
                                            value={(formData as any).video_url || ''}
                                            onChange={handleChange}
                                            placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                                            style={{ ...inputStyle, paddingLeft: '38px', fontSize: '13px' }}
                                        />
                                    </div>
                                    {/* Prévisualisation */}
                                    {(() => {
                                        const url = (formData as any).video_url || '';
                                        let embedId = '';
                                        if (url.includes('youtu.be/')) {
                                            embedId = url.split('youtu.be/')[1]?.split('?')[0];
                                        } else if (url.includes('v=')) {
                                            embedId = url.split('v=')[1]?.split('&')[0];
                                        }
                                        if (!embedId) return null;
                                        return (
                                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #e5e7eb', aspectRatio: '16/9', position: 'relative', background: '#000' }}>
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${embedId}`}
                                                    style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0 }}
                                                    allowFullScreen
                                                    title="Aperçu vidéo"
                                                />
                                            </div>
                                        );
                                    })()}
                                    <p style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                                        Copiez l'URL complète de la vidéo YouTube. Elle sera affichée sur la page détail du plat dans l'app.
                                    </p>
                                </div>
                            </Field>
                        </div>
                    </div>

                    {/* Panel: Ingrédients */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ShoppingBasket size={18} color="#059669" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>
                                        Ingrédients ({formData.ingredients.length})
                                    </p>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>
                                        Ajoutez, modifiez ou retirez les ingrédients du plat
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addIngredient}
                                className="btn btn-secondary"
                                style={{ padding: '8px 12px', fontSize: '12px' }}
                            >
                                <Plus size={14} /> Ajouter un ingrédient
                            </button>
                        </div>

                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {formData.ingredients.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px', borderRadius: '12px', background: '#f9fafb', border: '1px dashed #e5e7eb', color: '#9ca3af', fontSize: '13px' }}>
                                    Aucun ingrédient ajouté. Cliquez sur « Ajouter un ingrédient » pour commencer.
                                </div>
                            ) : (
                                formData.ingredients.map((ing, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '14px',
                                            border: '1px solid #e5e7eb',
                                            background: '#fafafa',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px',
                                        }}
                                    >
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                                            <input
                                                value={ing.name}
                                                onChange={(e) => updateIngredient(idx, { name: e.target.value })}
                                                placeholder="Nom de l'ingrédient"
                                                style={{ ...inputStyle, height: '40px', fontSize: '13px' }}
                                            />
                                            <input
                                                value={ing.amount}
                                                onChange={(e) => updateIngredient(idx, { amount: e.target.value })}
                                                placeholder="Qté (ex: 500)"
                                                style={{ ...inputStyle, height: '40px', fontSize: '13px' }}
                                            />
                                            <input
                                                value={ing.unit}
                                                onChange={(e) => updateIngredient(idx, { unit: e.target.value })}
                                                placeholder="Unité (g, ml...)"
                                                style={{ ...inputStyle, height: '40px', fontSize: '13px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeIngredient(idx)}
                                                title="Retirer cet ingrédient"
                                                style={{
                                                    width: '36px', height: '36px', borderRadius: '10px',
                                                    background: '#fee2e2', color: '#ef4444', border: 'none',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                }}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                            <input
                                                value={ing.substitute || ''}
                                                onChange={(e) => updateIngredient(idx, { substitute: e.target.value })}
                                                placeholder="Substitut diaspora (optionnel)"
                                                style={{ ...inputStyle, height: '34px', fontSize: '12px', flex: '1 1 200px' }}
                                            />
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#4b5563', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(ing.isOptional)}
                                                    onChange={(e) => updateIngredient(idx, { isOptional: e.target.checked })}
                                                    style={{ accentColor: 'var(--primary)' }}
                                                />
                                                Optionnel
                                            </label>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Panel: Étapes de préparation */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ListOrdered size={18} color="#2563eb" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>
                                        Étapes de préparation ({formData.steps.length})
                                    </p>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>
                                        Modifiez, réorganisez ou supprimez les étapes de cuisson
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addStep}
                                className="btn btn-secondary"
                                style={{ padding: '8px 12px', fontSize: '12px' }}
                            >
                                <Plus size={14} /> Ajouter une étape
                            </button>
                        </div>

                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {formData.steps.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px', borderRadius: '12px', background: '#f9fafb', border: '1px dashed #e5e7eb', color: '#9ca3af', fontSize: '13px' }}>
                                    Aucune étape ajoutée. Cliquez sur « Ajouter une étape » pour rédiger la préparation.
                                </div>
                            ) : (
                                formData.steps.map((stepText, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '10px',
                                            padding: '12px',
                                            borderRadius: '14px',
                                            border: '1px solid #e5e7eb',
                                            background: '#fafafa',
                                        }}
                                    >
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '9px',
                                            background: 'var(--primary)', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '12px', fontWeight: 800, flexShrink: 0, marginTop: '4px',
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <textarea
                                            rows={2}
                                            value={stepText}
                                            onChange={(e) => updateStep(idx, e.target.value)}
                                            placeholder={`Décrivez l'étape ${idx + 1}...`}
                                            style={{ ...textareaStyle, fontSize: '13px', flex: 1, minHeight: '60px' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                                            <button
                                                type="button"
                                                onClick={() => moveStep(idx, 'up')}
                                                disabled={idx === 0}
                                                title="Monter"
                                                style={{
                                                    width: '30px', height: '28px', borderRadius: '8px',
                                                    border: '1px solid #e5e7eb', background: '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1,
                                                }}
                                            >
                                                <ArrowUp size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveStep(idx, 'down')}
                                                disabled={idx === formData.steps.length - 1}
                                                title="Descendre"
                                                style={{
                                                    width: '30px', height: '28px', borderRadius: '8px',
                                                    border: '1px solid #e5e7eb', background: '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: idx === formData.steps.length - 1 ? 'not-allowed' : 'pointer',
                                                    opacity: idx === formData.steps.length - 1 ? 0.4 : 1,
                                                }}
                                            >
                                                <ArrowDown size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeStep(idx)}
                                                title="Supprimer cette étape"
                                                style={{
                                                    width: '30px', height: '28px', borderRadius: '8px',
                                                    background: '#fee2e2', color: '#ef4444', border: 'none',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                }}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ══ RIGHT COLUMN ══ */}
                <div className="sidebar-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Panel: Image */}
                    <div style={cardStyle}>
                        {sectionHeader(<Globe size={18} color="#059669" />, "Informations Culturelles", "Origine et contexte historique", "#ecfdf5")}
                        <div style={{ padding: '20px' }}>
                            {formData.image ? (
                                <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', background: '#f3f4f6', border: '1px solid var(--border)' }}>
                                    <img
                                        src={formData.image}
                                        alt="Aperçu"
                                        style={{ width: '100%', height: 'auto', maxHeight: '340px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                                        onError={e => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setCropSrc(formData.image)}
                                            title="Recadrer l'image"
                                            style={{
                                                height: '30px', padding: '0 10px', borderRadius: '999px',
                                                background: 'rgba(0,0,0,0.55)', border: 'none',
                                                cursor: 'pointer', color: '#fff', fontSize: '11.5px', fontWeight: 700,
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                backdropFilter: 'blur(4px)',
                                            }}
                                        >
                                            <Crop size={13} /> Recadrer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                            title="Supprimer l'image"
                                            style={{
                                                width: '30px', height: '30px', borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.55)', border: 'none',
                                                cursor: 'pointer', color: '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                backdropFilter: 'blur(4px)',
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    gap: '10px', padding: '32px 20px',
                                    background: '#fafafa', border: '2px dashed #e5e7eb',
                                    borderRadius: '14px', cursor: 'pointer', transition: 'border-color 0.2s',
                                }}>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                    {uploading ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                                            <div className="loader" style={{ width: 16, height: 16 }} />
                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Téléchargement...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ImagePlus size={22} color="#9ca3af" />
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151' }}>Cliquer pour uploader</p>
                                                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#9ca3af' }}>JPG, PNG, GIF — max 5 MB</p>
                                            </div>
                                        </>
                                    )}
                                </label>
                            )}

                            <div style={{ marginTop: '12px' }}>
                                <label style={labelStyle}>Ou coller une URL</label>
                                <input
                                    name="image"
                                    value={formData.image || ''}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    style={{ ...inputStyle, fontSize: '12px', color: '#6b7280' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Panel: Details */}
                    <div style={cardStyle}>
                        {sectionHeader(<Flame size={18} color="#f97316" />, "Préparation & Cuisson", "Détails de temps et difficulté", "#fff7ed")}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Field label="Région / Origine">
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <Globe size={15} color="#9ca3af" style={{ position: 'absolute', left: '13px' }} />
                                    <input name="region" value={formData.region || ''} onChange={handleChange} placeholder="Ex: Bénin Sud, Côte d'Ivoire..." style={{ ...inputStyle, paddingLeft: '36px' }} />
                                </div>
                            </Field>

                            <Field label="Niveau de difficulté">
                                <AdminSelect
                                    ariaLabel="Niveau de difficulté"
                                    value={formData.difficulty || ''}
                                    onChange={value => setFormData(prev => ({ ...prev, difficulty: value }))}
                                    options={DIFFICULTIES.map(difficulty => ({ value: difficulty, label: difficulty }))}
                                    style={{ width: '100%' }}
                                    triggerStyle={{ height: '46px' }}
                                />
                            </Field>

                            <div className="grid-2-cols">
                                <Field label="Temps de Prépa.">
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <Clock size={14} color="#9ca3af" style={{ position: 'absolute', left: '12px' }} />
                                        <input name="prep_time" value={formData.prep_time || ''} onChange={handleChange} placeholder="15 min" style={{ ...inputStyle, paddingLeft: '34px' }} />
                                    </div>
                                </Field>
                                <Field label="Temps de Cuisson">
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <Flame size={14} color="#9ca3af" style={{ position: 'absolute', left: '12px' }} />
                                        <input name="cook_time" value={formData.cook_time || ''} onChange={handleChange} placeholder="45 min" style={{ ...inputStyle, paddingLeft: '34px' }} />
                                    </div>
                                </Field>
                            </div>
                        </div>
                    </div>

                    {/* Complétude rapide */}
                    <div style={{ background: '#fff5f0', borderRadius: '16px', padding: '16px 18px', border: '1px solid #fed7aa' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <Tag size={14} color="var(--primary)" />
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Complétion du profil</span>
                        </div>
                        {[
                            { label: 'Nom', done: !!formData.name, icon: <ChefHat size={12} /> },
                            { label: 'Photo', done: !!formData.image, icon: <ImagePlus size={12} /> },
                            { label: 'Catégorie', done: !!formData.category, icon: <Tag size={12} /> },
                            { label: 'Description', done: !!formData.description, icon: <BookOpen size={12} /> },
                            { label: 'Région', done: !!formData.region, icon: <Globe size={12} /> },
                            { label: 'Bienfaits', done: !!formData.benefits, icon: <Leaf size={12} /> },
                            { label: `Ingrédients (${formData.ingredients.length})`, done: formData.ingredients.length > 0, icon: <ShoppingBasket size={12} /> },
                            { label: `Étapes (${formData.steps.length})`, done: formData.steps.length > 0, icon: <ListOrdered size={12} /> },
                        ].map(f => (
                            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
                                <div style={{
                                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                                    background: f.done ? 'var(--primary)' : 'rgba(251, 86, 7, 0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: f.done ? '#fff' : '#fb5607',
                                }}>
                                    {f.icon}
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: f.done ? '#9a3412' : '#fb5607' }}>{f.label}</span>
                                {f.done && <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 800, color: 'var(--primary)' }}>✓</span>}
                            </div>
                        ))}
                        <div style={{ marginTop: '12px', height: '6px', borderRadius: '99px', background: 'rgba(251, 86, 7, 0.1)', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: '99px', background: 'var(--primary)',
                                width: `${([formData.name, formData.image, formData.category, formData.description, formData.region, formData.benefits, formData.ingredients.length > 0, formData.steps.length > 0].filter(Boolean).length / 8) * 100}%`,
                                transition: 'width 0.3s ease',
                            }} />
                        </div>
                    </div>
                </div>

            </form>

            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    onCancel={() => setCropSrc(null)}
                    onConfirm={handleCroppedUpload}
                />
            )}
        </div>
    );
}
