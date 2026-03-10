/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : L'assistant magique par IA. Permet de générer automatiquement tous les détails complexes d'une recette juste avec le nom du plat.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { aiService } from '../lib/ai';
import {
    Sparkles, X, ChefHat, ArrowRight, ArrowLeft, Check,
    Clock, MapPin, Flame, Loader2, AlertCircle, BookOpen,
    Leaf, Utensils, ListOrdered, Save, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Ingredient {
    name: string;
    quantity: string;
    unit: string;
    notes?: string;
    category: string;
}

interface Step {
    order: number;
    title: string;
    description: string;
}

interface GeneratedRecipe {
    name: string;
    alias?: string;
    region?: string;
    category: string;
    difficulty: string;
    prep_time?: string;
    cook_time?: string;
    type?: string;
    style?: string;
    base?: string;
    origine_humaine?: string;
    description?: string;
    technique_title?: string;
    technique_description?: string;
    benefits?: string;
    ingredients: Ingredient[];
    steps: Step[];
    rating?: number;
    servings?: number;
}

const INGREDIENT_CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
    'Viandes & Poissons': { color: '#dc2626', bg: '#fee2e2' },
    'Légumes & Tubercules': { color: '#059669', bg: '#d1fae5' },
    'Épices & Aromates': { color: '#d97706', bg: '#fef3c7' },
    'Céréales & Légumineuses': { color: '#7c3aed', bg: '#ede9fe' },
    'Huiles & Condiments': { color: '#0891b2', bg: '#e0f2fe' },
    'Autres': { color: '#6b7280', bg: '#f3f4f6' },
};

const DIFFICULTY_COLORS: Record<string, { color: string; bg: string }> = {
    'Très Facile': { color: '#059669', bg: '#d1fae5' },
    'Facile': { color: '#10b981', bg: '#d1fae5' },
    'Intermédiaire': { color: '#f59e0b', bg: '#fef3c7' },
    'Moyen': { color: '#d97706', bg: '#fef3c7' },
    'Difficile': { color: '#ef4444', bg: '#fee2e2' },
    'Très Difficile': { color: '#dc2626', bg: '#fee2e2' },
};

interface Props {
    onClose: () => void;
    onSaved?: () => void;
}

type WizardStep = 'input' | 'generating' | 'preview' | 'saving' | 'done';

export function RecipeAIWizard({ onClose, onSaved }: Props) {
    const navigate = useNavigate();
    const [step, setStep] = useState<WizardStep>('input');
    const [dishName, setDishName] = useState('');
    const [context, setContext] = useState('');
    const [generated, setGenerated] = useState<GeneratedRecipe | null>(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'steps'>('overview');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleGenerate = async () => {
        if (!dishName.trim()) return;
        setError('');
        setStep('generating');
        const { data, error: aiError } = await aiService.generateFullRecipe(dishName.trim(), context.trim() || undefined);
        if (aiError || !data) {
            setError(aiError || 'Erreur inconnue lors de la génération.');
            setStep('input');
        } else {
            setGenerated(data as GeneratedRecipe);
            setStep('preview');
            setActiveTab('overview');
        }
    };

    const handleSaveDirect = async () => {
        if (!generated) return;
        setStep('saving');
        setError('');
        try {
            const payload: Record<string, any> = {
                id: `rec_${Date.now()}`,
                name: generated.name,
                alias: generated.alias || '',
                region: generated.region || '',
                category: generated.category || '',
                difficulty: generated.difficulty || 'Moyen',
                prep_time: generated.prep_time || '',
                cook_time: generated.cook_time || '',
                type: generated.type || '',
                style: generated.style || '',
                base: generated.base || '',
                description: generated.description || '',
                technique_title: generated.technique_title || '',
                technique_description: generated.technique_description || '',
                benefits: generated.benefits || '',
                // Colonnes enrichies — maintenant présentes en BDD
                ingredients: generated.ingredients || [],
                steps: generated.steps || [],
                rating: generated.rating ?? 4.5,
                servings: generated.servings ?? 4,
            };

            const { error: dbError } = await supabase.from('recipes').insert([payload]);
            if (dbError) throw dbError;
            setStep('done');
            onSaved?.();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la sauvegarde.');
            setStep('preview');
        } finally {
        }
    };

    const handlePrefillForm = () => {
        if (!generated) return;
        sessionStorage.setItem('ai_recipe_prefill', JSON.stringify(generated));
        navigate('/recipes/create');
    };

    /* ─────────── Styles ─────────── */
    const overlay: React.CSSProperties = {
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    };
    const modal: React.CSSProperties = {
        background: '#fff', borderRadius: '28px',
        width: '100%', maxWidth: '760px',
        maxHeight: '90vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
    };
    const headerBar: React.CSSProperties = {
        padding: '22px 28px 18px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #fff5f0 0%, #fff 60%)',
        flexShrink: 0,
    };
    const btn = (variant: 'primary' | 'secondary' | 'ghost'): React.CSSProperties => ({
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        border: 'none', borderRadius: '14px', cursor: 'pointer',
        fontWeight: 700, fontSize: '14px', padding: '12px 22px',
        transition: 'all 0.15s',
        ...(variant === 'primary' ? {
            background: 'linear-gradient(135deg, #ff7a2a, #fb5607)',
            color: '#fff', boxShadow: '0 4px 16px rgba(251,86,7,0.35)',
        } : variant === 'secondary' ? {
            background: '#f3f4f6', color: '#374151',
        } : {
            background: 'none', color: '#9ca3af',
            padding: '8px',
        }),
    });
    const pill = (color: string, bg: string): React.CSSProperties => ({
        display: 'inline-block', fontSize: '10px', fontWeight: 700,
        color, background: bg, borderRadius: '8px', padding: '3px 10px',
        whiteSpace: 'nowrap',
    });

    /* ─────────── Render ─────────── */
    return (
        <div style={overlay} onClick={onClose}>
            <div style={modal} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={headerBar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #ff7a2a, #fb5607)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(251,86,7,0.3)',
                        }}>
                            <Sparkles size={20} color="#fff" />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>
                                Générateur IA de Recette
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>
                                {step === 'input' && 'Entrez le nom du plat à générer'}
                                {step === 'generating' && 'Génération en cours…'}
                                {step === 'preview' && `Recette générée — ${generated?.name}`}
                                {step === 'saving' && 'Enregistrement…'}
                                {step === 'done' && 'Recette enregistrée avec succès !'}
                            </p>
                        </div>
                    </div>
                    <button style={btn('ghost')} onClick={onClose}><X size={20} /></button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>

                    {/* ── STEP: INPUT ── */}
                    {step === 'input' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #fff5f0, #fff)',
                                border: '1.5px solid #fed7aa', borderRadius: '20px', padding: '20px 22px',
                            }}>
                                <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 800, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    ✦ Comment ça marche
                                </p>
                                <p style={{ margin: 0, fontSize: '13px', color: '#c2410c', lineHeight: 1.6 }}>
                                    L'IA génère une fiche recette complète incluant la description culturelle,
                                    la liste d'ingrédients, les étapes de préparation et toutes les métadonnées.
                                    Vous pouvez ensuite la sauvegarder directement ou l'éditer dans le formulaire.
                                </p>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                    Nom du plat *
                                </label>
                                <input
                                    ref={inputRef}
                                    value={dishName}
                                    onChange={e => setDishName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                                    placeholder="Ex: Amiwo, Gbegiri, Aloko, Jollof Rice, Thiéboudienne…"
                                    style={{
                                        width: '100%', height: '52px', borderRadius: '14px',
                                        border: '1.5px solid #e5e7eb', fontSize: '16px',
                                        fontWeight: 600, color: '#111827', padding: '0 18px',
                                        outline: 'none', boxSizing: 'border-box',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#fb5607'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                    Contexte supplémentaire (optionnel)
                                </label>
                                <textarea
                                    value={context}
                                    onChange={e => setContext(e.target.value)}
                                    placeholder="Ex: Version béninoise avec du crabe, plat festif servi lors des mariages, version végétarienne…"
                                    rows={3}
                                    style={{
                                        width: '100%', borderRadius: '14px',
                                        border: '1.5px solid #e5e7eb', fontSize: '14px',
                                        fontWeight: 500, color: '#111827', padding: '14px 18px',
                                        outline: 'none', boxSizing: 'border-box', resize: 'vertical',
                                        lineHeight: 1.6, transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#fb5607'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                />
                            </div>

                            {error && (
                                <div style={{ display: 'flex', gap: '10px', padding: '14px 16px', background: '#fee2e2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                                    <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                                    <p style={{ margin: 0, fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>{error}</p>
                                </div>
                            )}

                            {/* Quick examples */}
                            <div>
                                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Exemples rapides</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {['Amiwo', 'Gbegiri', 'Atassi', 'Thiéboudienne', 'Jollof Rice', 'Egusi Soup', 'Fufu', 'Ndolé'].map(name => (
                                        <button key={name}
                                            onClick={() => setDishName(name)}
                                            style={{
                                                padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #e5e7eb',
                                                background: dishName === name ? '#fff5f0' : '#f9fafb',
                                                color: dishName === name ? '#fb5607' : '#6b7280',
                                                borderColor: dishName === name ? '#fed7aa' : '#e5e7eb',
                                                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                            }}
                                        >{name}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP: GENERATING ── */}
                    {step === 'generating' && (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '20px',
                                background: 'linear-gradient(135deg, #fff5f0, #ffe4d4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px',
                                boxShadow: '0 8px 24px rgba(251,86,7,0.15)',
                            }}>
                                <Sparkles size={32} color="#fb5607" />
                            </div>
                            <p style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#111827' }}>
                                Génération en cours…
                            </p>
                            <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#9ca3af' }}>
                                L'IA analyse et génère la fiche complète pour <strong style={{ color: '#fb5607' }}>{dishName}</strong>
                            </p>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {['Recherche culturelle', 'Ingrédients authentiques', 'Étapes détaillées', 'Métadonnées'].map((label, i) => (
                                    <div key={label} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '6px 14px', borderRadius: '20px',
                                        background: '#f9fafb', border: '1px solid #e5e7eb',
                                        fontSize: '12px', fontWeight: 600, color: '#6b7280',
                                        animation: `pulse-item 1.5s ease-in-out ${i * 0.3}s infinite`,
                                    }}>
                                        <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} color="#fb5607" />
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── STEP: PREVIEW ── */}
                    {step === 'preview' && generated && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

                            {/* Meta summary */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))',
                                gap: '10px', marginBottom: '20px',
                            }}>
                                {[
                                    { icon: <ChefHat size={14} />, label: generated.category?.split('(')[0].trim() || '—', color: '#fb5607', bg: '#fff5f0' },
                                    { icon: <MapPin size={14} />, label: generated.region || '—', color: '#0891b2', bg: '#e0f2fe' },
                                    { icon: <Clock size={14} />, label: `${generated.prep_time || '?'} + ${generated.cook_time || '?'}`, color: '#059669', bg: '#d1fae5' },
                                    { icon: <Flame size={14} />, label: generated.difficulty || '—', ...(DIFFICULTY_COLORS[generated.difficulty || ''] || { color: '#6b7280', bg: '#f3f4f6' }) },
                                    { icon: <Utensils size={14} />, label: `${generated.servings || 4} pers.`, color: '#7c3aed', bg: '#ede9fe' },
                                ].map((m, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 14px', borderRadius: '12px',
                                        background: m.bg, border: `1px solid ${m.color}20`,
                                    }}>
                                        <span style={{ color: m.color, flexShrink: 0 }}>{m.icon}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Alias + origin */}
                            {(generated.alias || generated.origine_humaine) && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                    {generated.alias && <span style={pill('#9a3412', '#fff5f0')}>🏷 {generated.alias}</span>}
                                    {generated.origine_humaine && <span style={pill('#5b21b6', '#ede9fe')}>👥 {generated.origine_humaine}</span>}
                                    {generated.style && <span style={pill('#0c4a6e', '#e0f2fe')}>🔥 {generated.style}</span>}
                                    {generated.type && <span style={pill('#065f46', '#d1fae5')}>🍽 {generated.type}</span>}
                                    {generated.base && <span style={pill('#78350f', '#fef3c7')}>🌾 {generated.base}</span>}
                                </div>
                            )}

                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#f3f4f6', borderRadius: '12px', padding: '4px' }}>
                                {([
                                    { id: 'overview', icon: <BookOpen size={14} />, label: 'Vue d\'ensemble' },
                                    { id: 'ingredients', icon: <Leaf size={14} />, label: `Ingrédients (${generated.ingredients?.length || 0})` },
                                    { id: 'steps', icon: <ListOrdered size={14} />, label: `Étapes (${generated.steps?.length || 0})` },
                                ] as const).map(tab => (
                                    <button key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                            gap: '6px', padding: '9px 12px', borderRadius: '9px', border: 'none',
                                            fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                                            background: activeTab === tab.id ? '#fff' : 'transparent',
                                            color: activeTab === tab.id ? '#fb5607' : '#6b7280',
                                            boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                        }}
                                    >{tab.icon}{tab.label}</button>
                                ))}
                            </div>

                            {/* Tab: overview */}
                            {activeTab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {generated.description && (
                                        <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '16px 18px' }}>
                                            <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</p>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{generated.description}</p>
                                        </div>
                                    )}
                                    {generated.technique_title && (
                                        <div style={{ background: '#fff5f0', borderRadius: '14px', padding: '16px 18px', border: '1px solid #fed7aa' }}>
                                            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 800, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Technique clé</p>
                                            <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#c2410c' }}>{generated.technique_title}</p>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{generated.technique_description}</p>
                                        </div>
                                    )}
                                    {generated.benefits && (
                                        <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '14px 18px', border: '1px solid #bbf7d0' }}>
                                            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💚 Bienfaits</p>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{generated.benefits}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab: ingredients */}
                            {activeTab === 'ingredients' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {Object.entries(
                                        (generated.ingredients || []).reduce((acc, ing) => {
                                            const cat = ing.category || 'Autres';
                                            if (!acc[cat]) acc[cat] = [];
                                            acc[cat].push(ing);
                                            return acc;
                                        }, {} as Record<string, Ingredient[]>)
                                    ).map(([cat, ings]) => {
                                        const meta = INGREDIENT_CATEGORY_COLORS[cat] || { color: '#6b7280', bg: '#f3f4f6' };
                                        return (
                                            <div key={cat} style={{ borderRadius: '14px', border: `1px solid ${meta.color}20`, overflow: 'hidden' }}>
                                                <div style={{ padding: '8px 14px', background: meta.bg, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{cat}</span>
                                                    <span style={{ fontSize: '10px', fontWeight: 600, color: meta.color, opacity: 0.7 }}>({ings.length})</span>
                                                </div>
                                                {ings.map((ing, i) => (
                                                    <div key={i} style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        padding: '9px 14px', background: '#fff',
                                                        borderTop: i > 0 ? '1px solid #f9fafb' : 'none',
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                                                            <div>
                                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{ing.name}</span>
                                                                {ing.notes && <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '6px', fontStyle: 'italic' }}>{ing.notes}</span>}
                                                            </div>
                                                        </div>
                                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                                                            {ing.quantity} {ing.unit}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Tab: steps */}
                            {activeTab === 'steps' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {(generated.steps || []).map((s, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '14px', padding: '16px', background: '#f9fafb', borderRadius: '14px', alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                                                background: 'linear-gradient(135deg, #ff7a2a, #fb5607)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontSize: '13px', fontWeight: 900,
                                            }}>{s.order || i + 1}</div>
                                            <div style={{ flex: 1 }}>
                                                {s.title && <p style={{ margin: '0 0 5px', fontSize: '14px', fontWeight: 800, color: '#111827' }}>{s.title}</p>}
                                                <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.65 }}>{s.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {error && (
                                <div style={{ marginTop: '14px', display: 'flex', gap: '10px', padding: '14px 16px', background: '#fee2e2', borderRadius: '12px' }}>
                                    <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                                    <p style={{ margin: 0, fontSize: '13px', color: '#dc2626' }}>{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP: DONE ── */}
                    {step === 'done' && (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '50%',
                                background: '#d1fae5', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', margin: '0 auto 20px',
                            }}>
                                <Check size={34} color="#059669" />
                            </div>
                            <p style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: '#111827' }}>Recette enregistrée !</p>
                            <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#6b7280' }}>
                                <strong>{generated?.name}</strong> a été ajoutée au catalogue.
                            </p>
                            <button style={btn('primary')} onClick={onClose}><Check size={16} /> Fermer</button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 28px', borderTop: '1px solid #f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#fafafa', flexShrink: 0,
                }}>
                    {step === 'input' && (
                        <>
                            <button style={btn('secondary')} onClick={onClose}>Annuler</button>
                            <button
                                style={{ ...btn('primary'), opacity: !dishName.trim() ? 0.5 : 1 }}
                                onClick={handleGenerate}
                                disabled={!dishName.trim()}
                            >
                                <Sparkles size={16} /> Générer la recette <ArrowRight size={16} />
                            </button>
                        </>
                    )}
                    {step === 'generating' && (
                        <div style={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', color: '#fb5607', fontWeight: 600, fontSize: '14px' }}>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyse et génération…
                        </div>
                    )}
                    {step === 'preview' && (
                        <>
                            <button style={btn('secondary')} onClick={() => { setStep('input'); setError(''); }}>
                                <ArrowLeft size={15} /> Recommencer
                            </button>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    style={{ ...btn('secondary'), color: '#374151' }}
                                    onClick={handlePrefillForm}
                                    title="Ouvrir dans le formulaire d'édition"
                                >
                                    <ExternalLink size={15} /> Éditer dans le formulaire
                                </button>
                                <button style={btn('primary')} onClick={handleSaveDirect}>
                                    <Save size={15} /> Enregistrer directement
                                </button>
                            </div>
                        </>
                    )}
                    {step === 'saving' && (
                        <div style={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', color: '#fb5607', fontWeight: 600, fontSize: '14px' }}>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement…
                        </div>
                    )}
                    {step === 'done' && (
                        <div style={{ margin: '0 auto' }}>
                            <button style={btn('secondary')} onClick={() => { setStep('input'); setDishName(''); setContext(''); setGenerated(null); }}>
                                <Sparkles size={15} /> Générer une autre recette
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse-item {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
