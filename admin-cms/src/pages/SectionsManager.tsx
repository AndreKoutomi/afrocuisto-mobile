import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus, Edit2, Trash2, ArrowUp, ArrowDown, LayoutGrid, GalleryHorizontal,
    List, AlignJustify, Smartphone, Compass, Sparkles, RefreshCw,
    X, Zap, Brain, CheckCircle2, Star, Key,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const TYPE_META: Record<string, { label: string; icon: any; color: string; bg: string; description: string }> = {
    dynamic_carousel: { label: 'Carrousel', icon: GalleryHorizontal, color: '#7c3aed', bg: '#ede9fe', description: 'Défilement fluide et cinématique de recettes' },
    horizontal_list: { label: 'Horizontal', icon: AlignJustify, color: '#0891b2', bg: '#e0f2fe', description: 'Liste à défilement horizontal compact' },
    vertical_list_1: { label: 'Liste simple', icon: List, color: '#059669', bg: '#d1fae5', description: 'Cartes verticales avec image et détails' },
    vertical_list_2: { label: 'Grille 2col', icon: LayoutGrid, color: '#d97706', bg: '#fef3c7', description: 'Grille en deux colonnes, style magazine' },
    featured: { label: 'Mise en avant', icon: Star, color: '#e11d48', bg: '#fff1f2', description: 'Plat unique mis en avant en grand format hero' },
};

const AI_GOALS = [
    { id: 'discovery', label: '🌍 Découverte Régionale', description: 'Section mettant en valeur les plats d\'une région spécifique', prompt: 'Crée une magnifique section thématique de découverte régionale pour notre app de cuisine béninoise. Choisis une région du Bénin (Sud, Centre, Nord) et sélectionne les recettes les plus représentatives.' },
    { id: 'trending', label: '🔥 Tendances du Moment', description: 'Section inspirée des plats les plus populaires et demandés', prompt: 'Génère une section "Tendances du Moment" avec des plats populaires et très demandés. Choisis un mix de plats facilement préparables et gourmands.' },
    { id: 'quick', label: '⚡ Recettes Rapides', description: 'Section pour les plats préparables en moins de 30 minutes', prompt: 'Crée une section "Vite fait, bien fait" avec des recettes rapides à préparer, idéales pour les jours de semaine chargés. Priorise les plats avec un temps de préparation court.' },
    { id: 'beginner', label: '🌱 Pour Débutants', description: 'Section adaptée aux personnes qui apprennent à cuisiner', prompt: 'Génère une section idéale pour les débutants en cuisine africaine. Sélectionne des recettes marquées "Très Facile" ou "Facile" avec des ingrédients courants.' },
    { id: 'featured_hero', label: '⭐ Plat du Jour / Hero', description: 'Une section de mise en avant spectaculaire pour UN plat emblématique', prompt: 'Sélectionne le plat le plus emblématique et visuellement impressionnant de notre catalogue pour une mise en avant "hero" spectaculaire. Il doit avoir une forte identité culturelle béninoise.' },
    { id: 'cultural', label: '🎭 Patrimoine Culturel', description: 'Section sur les recettes à forte valeur culturelle et historique', prompt: 'Crée une section sur le patrimoine culinaire béninois. Choisis des recettes authentiques avec une forte historia culturelle et des anecdotes intéressantes.' },
    { id: 'festive', label: '🎉 Cuisine de Fête', description: 'Plats préparés lors des grandes occasions et célébrations', prompt: 'Génère une section "Cuisine de Fête" avec des plats préparés lors des grandes occasions, mariages, et célébrations au Bénin. Choisis des recettes généreuses et festives.' },
    { id: 'healthy', label: '💚 Sain & Équilibré', description: 'Section sur les plats nutritifs et bénéfiques pour la santé', prompt: 'Crée une section "Sain & Équilibré" mettant en valeur les recettes les plus nutritives et bénéfiques pour la santé dans notre catalogue africain.' },
];

function getTypeMeta(type: string) {
    return TYPE_META[type] || { label: type, icon: LayoutGrid, color: '#6b7280', bg: '#f3f4f6', description: '' };
}

interface AIGeneratedSection {
    title: string;
    subtitle: string;
    type: string;
    page: string;
    recipe_ids: string[];
    reasoning: string;
    theme_color?: string;
}

export function SectionsManager() {
    const navigate = useNavigate();
    const [sections, setSections] = useState<any[]>([]);
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // AI Panel state
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [aiStep, setAiStep] = useState<'goal' | 'generating' | 'result'>('goal');
    const [selectedGoal, setSelectedGoal] = useState<typeof AI_GOALS[0] | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const [aiResult, setAiResult] = useState<AIGeneratedSection | null>(null);
    const [aiError, setAiError] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [model, setModel] = useState('gemini-1.5-flash');

    useEffect(() => {
        const stored = localStorage.getItem('gemini_api_key');
        const storedModel = localStorage.getItem('gemini_model');
        if (stored) { setApiKey(stored); setApiKeyInput(stored); }
        if (storedModel) { setModel(storedModel); }
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoading(true);
            const [sectionRes, recipeRes] = await Promise.all([
                supabase.from('home_sections').select('*').order('order_index'),
                supabase.from('recipes').select('id, name, category, region, difficulty, prep_time, cook_time, image').order('name'),
            ]);
            if (sectionRes.data) setSections(sectionRes.data);
            if (recipeRes.data) setRecipes(recipeRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!window.confirm('Supprimer cette section ?')) return;
        setDeletingId(id);
        try {
            const { error } = await supabase.from('home_sections').delete().eq('id', id);
            if (error) throw error;
            setSections(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error('Failed to delete:', err);
            alert('Erreur lors de la suppression.');
        } finally {
            setDeletingId(null);
        }
    }

    async function handleMoveGroup(id: string, direction: 'up' | 'down', group: any[]) {
        const index = group.findIndex(s => s.id === id);
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= group.length) return;
        const newGroup = [...group];
        [newGroup[index], newGroup[targetIndex]] = [newGroup[targetIndex], newGroup[index]];
        const newSections = sections.map(s => {
            const groupItem = newGroup.find(g => g.id === s.id);
            if (groupItem) return { ...s, order_index: newGroup.indexOf(groupItem) };
            return s;
        });
        newSections.sort((a, b) => a.order_index - b.order_index);
        setSections(newSections);
        try {
            const updates = newGroup.map((s, i) => ({ id: s.id, title: s.title, subtitle: s.subtitle, recipe_ids: s.recipe_ids, type: s.type, config: s.config, order_index: i }));
            const { error } = await supabase.from('home_sections').upsert(updates);
            if (error) throw error;
        } catch (err) {
            fetchData();
        }
    }

    // ── AI Section Generation ──────────────────────────────────────────────────
    async function handleGenerateAI() {
        const key = apiKey || localStorage.getItem('gemini_api_key') || '';
        if (!key) { setShowApiKeyInput(true); return; }

        const goal = selectedGoal;
        const basePrompt = goal ? goal.prompt : customPrompt;
        if (!basePrompt.trim()) return;

        setAiStep('generating');
        setAiError('');

        const recipeContext = recipes.slice(0, 80).map(r =>
            `ID:${r.id}|Nom:${r.name}|Catégorie:${r.category}|Région:${r.region}|Difficulté:${r.difficulty}|Préparation:${r.prep_time}`
        ).join('\n');

        const systemPrompt = `Tu es un expert en marketing culinaire et en UX design pour une application de cuisine africaine (béninoise).

Tu dois générer une section thématique pour la page d'accueil ou Explorer de l'application mobile.

Voici le catalogue complet des recettes disponibles (utilise UNIQUEMENT ces IDs) :
${recipeContext}

Types de sections disponibles:
- "dynamic_carousel" : Carrousel cinématique (3-8 recettes, visuellement immersif)
- "horizontal_list" : Liste horizontale rapide (4-10 recettes, navigation rapide)
- "vertical_list_1" : Liste verticale simple (3-6 recettes, lecture approfondie)
- "vertical_list_2" : Grille 2 colonnes (4-8 recettes, style magazine)
- "featured" : Mise en avant hero (1 seule recette, impact maximal)

Renvoie UNIQUEMENT un JSON valide, sans markdown, avec cette structure exacte :
{
  "title": "Titre accrocheur et court (max 4 mots)",
  "subtitle": "Description inspirante (max 8 mots)",
  "type": "dynamic_carousel" | "horizontal_list" | "vertical_list_1" | "vertical_list_2" | "featured",
  "page": "home" | "explorer",
  "recipe_ids": ["id1", "id2", ...],
  "reasoning": "Explication courte de tes choix (1-2 phrases)"
}`;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt }, { text: basePrompt }] }],
                        generationConfig: {
                            temperature: 0.85,
                            maxOutputTokens: 1024,
                            responseMimeType: "application/json"
                        },
                    })
                }
            );
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const msg = errorData.error?.message || `Erreur API: ${response.status}`;
                if (response.status === 429) {
                    throw new Error("Limite de requêtes atteinte (API 429). Attendez 60 secondes ou utilisez une clé 'Pay-as-you-go' sans limite.");
                }
                throw new Error(msg);
            }
            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            let parsed: AIGeneratedSection;
            try {
                parsed = JSON.parse(text);
            } catch {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
            }

            // Validate recipe_ids against known recipes
            const knownIds = new Set(recipes.map(r => r.id));
            parsed.recipe_ids = (parsed.recipe_ids || []).filter((id: string) => knownIds.has(id));

            setAiResult(parsed);
            setAiStep('result');
        } catch (err: any) {
            setAiError(err.message || 'Erreur inconnue lors de la génération.');
            setAiStep('goal');
        }
    }

    async function handleSaveAISection() {
        if (!aiResult) return;
        setIsSaving(true);
        try {
            const newId = `ai_${Date.now()}`;
            const maxOrder = sections.reduce((max, s) => Math.max(max, s.order_index || 0), -1);
            const { error } = await supabase.from('home_sections').insert([{
                id: newId,
                title: aiResult.title,
                subtitle: aiResult.subtitle,
                type: aiResult.type,
                recipe_ids: aiResult.recipe_ids,
                config: { page: aiResult.page || 'home', design_style: 'design_1', ai_generated: true },
                order_index: maxOrder + 1,
            }]);
            if (error) throw error;
            setShowAIPanel(false);
            setAiStep('goal');
            setAiResult(null);
            setSelectedGoal(null);
            setCustomPrompt('');
            fetchData();
        } catch (err: any) {
            alert('Erreur lors de la sauvegarde: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    }

    function handleEditAISection() {
        if (!aiResult) return;
        // Pre-fill the section form via sessionStorage
        sessionStorage.setItem('ai_section_prefill', JSON.stringify(aiResult));
        navigate('/sections/create');
    }

    const homeSections = sections.filter(s => !s.config?.page || s.config.page === 'home');
    const explorerSections = sections.filter(s => s.config?.page === 'explorer');

    // ── Sub-components ─────────────────────────────────────────────────────────
    const SectionCard = ({ section, idx, group }: { section: any; idx: number; group: any[] }) => {
        const meta = getTypeMeta(section.type);
        const Icon = meta.icon;
        const isFirst = idx === 0;
        const isLast = idx === group.length - 1;
        const isDeleting = deletingId === section.id;
        const isAIGenerated = section.config?.ai_generated;

        return (
            <div style={{
                background: '#ffffff', borderRadius: '18px',
                border: isAIGenerated ? '1.5px solid #ddd6fe' : '1px solid #f0f0f0',
                boxShadow: isAIGenerated ? '0 2px 12px rgba(124,58,237,0.08)' : '0 1px 6px rgba(0,0,0,0.04)',
                padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'box-shadow 0.2s, transform 0.15s',
                opacity: isDeleting ? 0.5 : 1,
            }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = isAIGenerated ? '0 2px 12px rgba(124,58,237,0.08)' : '0 1px 6px rgba(0,0,0,0.04)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
            >
                <div style={{ width: '32px', height: '32px', flexShrink: 0, background: '#f9fafb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#9ca3af', border: '1px solid #f0f0f0' }}>
                    {idx + 1}
                </div>
                <div style={{ width: '44px', height: '44px', flexShrink: 0, background: meta.bg, borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <Icon size={20} color={meta.color} />
                    {isAIGenerated && (
                        <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: 'linear-gradient(135deg, #7c3aed, #4318ff)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                            <Sparkles size={8} color="#fff" />
                        </div>
                    )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {section.title || 'Sans titre'}
                        </span>
                        <span style={{ flexShrink: 0, fontSize: '10px', fontWeight: 700, background: meta.bg, color: meta.color, borderRadius: '8px', padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            {meta.label}
                        </span>
                        {isAIGenerated && (
                            <span style={{ flexShrink: 0, fontSize: '9px', fontWeight: 700, background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', color: '#7c3aed', borderRadius: '8px', padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                ✦ IA
                            </span>
                        )}
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {section.subtitle || 'Aucune description'}
                        {section.recipe_ids?.length > 0 && <span style={{ marginLeft: '8px', color: '#6b7280', fontWeight: 600 }}> · {section.recipe_ids.length} plat{section.recipe_ids.length > 1 ? 's' : ''}</span>}
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => handleMoveGroup(section.id, 'up', group)} disabled={isFirst}
                        style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #e5e7eb', background: isFirst ? '#f9fafb' : '#fff', cursor: isFirst ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isFirst ? '#d1d5db' : '#6b7280' }}>
                        <ArrowUp size={14} />
                    </button>
                    <button onClick={() => handleMoveGroup(section.id, 'down', group)} disabled={isLast}
                        style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #e5e7eb', background: isLast ? '#f9fafb' : '#fff', cursor: isLast ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLast ? '#d1d5db' : '#6b7280' }}>
                        <ArrowDown size={14} />
                    </button>
                </div>
                <div style={{ width: '1px', height: '40px', background: '#f0f0f0', flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <Link to={`/sections/edit/${section.id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#f3f4f6', border: '1px solid #e5e7eb', fontSize: '12px', fontWeight: 700, color: '#374151', textDecoration: 'none', transition: 'all 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#e5e7eb'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#f3f4f6'}
                    >
                        <Edit2 size={13} /> Modifier
                    </Link>
                    <button onClick={() => handleDelete(section.id)} disabled={isDeleting}
                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #fee2e2', background: '#fff5f5', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fee2e2'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff5f5'}
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>
        );
    };

    const GroupPanel = ({ title, description, icon: GIcon, iconColor, iconBg, groupSections }: any) => (
        <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GIcon size={18} color={iconColor} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#111827' }}>{title}</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>{description}</p>
                    </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', background: '#f3f4f6', borderRadius: '10px', padding: '4px 12px' }}>
                    {groupSections.length} section{groupSections.length !== 1 ? 's' : ''}
                </span>
            </div>
            {groupSections.length === 0 ? (
                <div style={{ background: '#fafafa', border: '2px dashed #e5e7eb', borderRadius: '18px', padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ width: '52px', height: '52px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <LayoutGrid size={24} color="#d1d5db" />
                    </div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#374151' }}>Aucune section</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>Créez ou générez une section via le bouton IA ci-dessus.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {groupSections.map((section: any, idx: number) => (
                        <SectionCard key={section.id} section={section} idx={idx} group={groupSections} />
                    ))}
                </div>
            )}
        </div>
    );

    // ── Rendered recipe preview card for IA result ─────────────────────────────
    const RecipePreviewChip = ({ recipeId }: { recipeId: string }) => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return null;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f9fafb', borderRadius: '12px', padding: '8px 12px', border: '1px solid #f0f0f0' }}>
                <img src={recipe.image} alt={recipe.name} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />
                <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{recipe.name}</p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>{recipe.category}</p>
                </div>
            </div>
        );
    };

    return (
        <div style={{ maxWidth: '1000px' }}>
            {/* Page Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Administration</p>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: '2px 0 6px' }}>Sections de l'Application</h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>Gérez les thématiques affichées sur les pages de l'application mobile.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={fetchData}
                        style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f3f4f6', border: '1px solid #e5e7eb', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Rafraîchir">
                        <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                    {/* ── AI Button ── */}
                    <button
                        onClick={() => { setShowAIPanel(true); setAiStep('goal'); setAiResult(null); setSelectedGoal(null); }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: 'linear-gradient(135deg, #7c3aed, #4318ff)',
                            color: '#fff', border: 'none', borderRadius: '14px',
                            padding: '10px 20px', fontSize: '14px', fontWeight: 700,
                            cursor: 'pointer', textDecoration: 'none',
                            boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                        }}>
                        <Brain size={17} /> Générer avec l'IA
                    </button>
                    <Link to="/sections/create"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: '#4318ff', color: '#fff', border: 'none', borderRadius: '14px',
                            padding: '10px 20px', fontSize: '14px', fontWeight: 700,
                            cursor: 'pointer', textDecoration: 'none',
                            boxShadow: '0 4px 16px rgba(67,24,255,0.25)',
                        }}>
                        <Plus size={17} /> Nouvelle Section
                    </Link>
                </div>
            </div>

            {/* Stats bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
                {[
                    { label: 'Total sections', value: sections.length, icon: LayoutGrid, color: '#4318ff', bg: '#ede9fe' },
                    { label: 'Page Accueil', value: homeSections.length, icon: Smartphone, color: '#059669', bg: '#d1fae5' },
                    { label: 'Page Explorer', value: explorerSections.length, icon: Compass, color: '#d97706', bg: '#fef3c7' },
                ].map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.03)' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={18} color={stat.color} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{stat.value}</p>
                                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ height: '80px', borderRadius: '18px', background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                    ))}
                </div>
            ) : (
                <>
                    <GroupPanel title="Page d'Accueil" description="Sections affichées sur l'écran principal de l'app" icon={Smartphone} iconColor="#059669" iconBg="#d1fae5" groupSections={homeSections} />
                    <GroupPanel title="Page Explorer" description="Sections affichées sur l'écran d'exploration" icon={Compass} iconColor="#d97706" iconBg="#fef3c7" groupSections={explorerSections} />
                </>
            )}

            {/* Footer */}
            <div style={{ marginTop: '24px', background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', borderRadius: '18px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '38px', height: '38px', background: '#7c3aed', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={18} color="#fff" />
                </div>
                <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#5b21b6' }}>Synchronisation en temps réel</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7c3aed', fontWeight: 500 }}>
                        Les sections gérées ici apparaissent sur l'application mobile instantanément.
                    </p>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                ██████╗   AI  PANEL  (SLIDE-IN RIGHT DRAWER)
            ═══════════════════════════════════════════════════════ */}
            {showAIPanel && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }} onClick={() => setShowAIPanel(false)}>
                    {/* Backdrop */}
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} />

                    {/* Drawer */}
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '560px', maxWidth: '100vw',
                            background: '#fff',
                            boxShadow: '-20px 0 60px rgba(0,0,0,0.18)',
                            display: 'flex', flexDirection: 'column',
                            animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)',
                        }}
                    >
                        {/* Drawer Header */}
                        <div style={{
                            padding: '24px 28px', borderBottom: '1px solid #f0f0f0',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #4318ff 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <Brain size={22} color="#fff" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Intelligence Artificielle</p>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff' }}>Générateur de Sections</h2>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                                    style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                                    title="Clé API Gemini"
                                >
                                    <Key size={16} />
                                </button>
                                <button onClick={() => setShowAIPanel(false)}
                                    style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* API Key Panel */}
                        {showApiKeyInput && (
                            <div style={{ padding: '16px 28px', background: '#faf5ff', borderBottom: '1px solid #ede9fe', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <Key size={16} color="#7c3aed" style={{ flexShrink: 0 }} />
                                <input
                                    type="password"
                                    value={apiKeyInput}
                                    onChange={e => setApiKeyInput(e.target.value)}
                                    placeholder="Votre clé API Google Gemini..."
                                    style={{ flex: 1, height: '38px', borderRadius: '10px', border: '1.5px solid #ddd6fe', padding: '0 12px', fontSize: '13px', outline: 'none' }}
                                />
                                <select
                                    value={model}
                                    onChange={e => setModel(e.target.value)}
                                    style={{
                                        height: '38px', borderRadius: '10px',
                                        border: '1.5px solid #ddd6fe', background: '#fff',
                                        padding: '0 8px', fontSize: '12px', fontWeight: 700, color: '#7c3aed',
                                        outline: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <option value="gemini-1.5-flash">1.5 Flash</option>
                                    <option value="gemini-1.5-pro">1.5 Pro</option>
                                    <option value="gemini-1.0-pro">1.0 Pro</option>
                                </select>
                                <button onClick={() => {
                                    localStorage.setItem('gemini_api_key', apiKeyInput.trim());
                                    localStorage.setItem('gemini_model', model);
                                    setApiKey(apiKeyInput.trim());
                                    setShowApiKeyInput(false);
                                }} style={{ height: '38px', padding: '0-16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', paddingLeft: '16px', paddingRight: '16px' }}>
                                    Sauvegarder
                                </button>
                            </div>
                        )}

                        {/* Drawer Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

                            {/* STEP: goal selection */}
                            {aiStep === 'goal' && (
                                <div>
                                    <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#6b7280', fontWeight: 500, lineHeight: 1.6 }}>
                                        Choisissez un objectif thématique. L'IA analysera votre catalogue de <strong style={{ color: '#111827' }}>{recipes.length} recettes</strong> et construira une section optimisée pour l'engagement utilisateur.
                                    </p>

                                    {/* Goal grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                                        {AI_GOALS.map(goal => (
                                            <button
                                                key={goal.id}
                                                onClick={() => setSelectedGoal(selectedGoal?.id === goal.id ? null : goal)}
                                                style={{
                                                    textAlign: 'left', padding: '14px 16px',
                                                    borderRadius: '14px',
                                                    border: selectedGoal?.id === goal.id ? '2px solid #7c3aed' : '1.5px solid #f0f0f0',
                                                    background: selectedGoal?.id === goal.id ? '#faf5ff' : '#fafafa',
                                                    cursor: 'pointer', transition: 'all 0.15s',
                                                    boxShadow: selectedGoal?.id === goal.id ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
                                                }}>
                                                <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 800, color: selectedGoal?.id === goal.id ? '#5b21b6' : '#111827' }}>{goal.label}</p>
                                                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 500, lineHeight: 1.4 }}>{goal.description}</p>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Divider */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <div style={{ flex: 1, height: '1px', background: '#f0f0f0' }} />
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>ou décrivez votre idée</span>
                                        <div style={{ flex: 1, height: '1px', background: '#f0f0f0' }} />
                                    </div>

                                    <textarea
                                        value={customPrompt}
                                        onChange={e => { setCustomPrompt(e.target.value); setSelectedGoal(null); }}
                                        placeholder="Ex: Crée une section 'Street Food béninois' avec des recettes populaires et accessibles, idéale pour les amateurs de cuisine de rue..."
                                        rows={4}
                                        style={{
                                            width: '100%', borderRadius: '14px', border: '1.5px solid #e5e7eb',
                                            padding: '14px 16px', fontSize: '14px', fontWeight: 500, color: '#111827',
                                            resize: 'none', outline: 'none', lineHeight: 1.6,
                                            boxSizing: 'border-box', fontFamily: 'inherit',
                                        }}
                                    />

                                    {aiError && (
                                        <div style={{ marginTop: '16px', padding: '12px 16px', background: '#fff5f5', border: '1px solid #fee2e2', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: '16px' }}>⚠️</span>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>{aiError}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP: generating */}
                            {aiStep === 'generating' && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '360px', gap: '24px' }}>
                                    <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4318ff)', animation: 'spin 1.5s linear infinite', opacity: 0.15 }} />
                                        <div style={{ position: 'absolute', inset: '6px', borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Brain size={32} color="#7c3aed" />
                                        </div>
                                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#7c3aed', animation: 'spin 1s linear infinite' }} />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#111827' }}>Génération en cours…</p>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>L'IA analyse vos {recipes.length} recettes et construit la section parfaite.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {['Analyse du catalogue', 'Sélection thématique', 'Optimisation UX'].map((step, i) => (
                                            <div key={step} style={{ padding: '6px 12px', background: '#f9fafb', borderRadius: '20px', fontSize: '11px', fontWeight: 600, color: '#6b7280', border: '1px solid #f0f0f0', animation: `pulse 1.5s ease ${i * 0.3}s infinite` }}>
                                                {step}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP: result */}
                            {aiStep === 'result' && aiResult && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <div style={{ width: '36px', height: '36px', background: '#d1fae5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CheckCircle2 size={20} color="#059669" />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#111827' }}>Section générée avec succès !</p>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Vérifiez et personnalisez avant de publier.</p>
                                        </div>
                                    </div>

                                    {/* Result preview card */}
                                    <div style={{ background: 'linear-gradient(135deg, #faf5ff, #f5f3ff)', border: '1.5px solid #ddd6fe', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                            {(() => {
                                                const meta = getTypeMeta(aiResult.type);
                                                const TIcon = meta.icon;
                                                return (
                                                    <div style={{ width: '40px', height: '40px', background: meta.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <TIcon size={20} color={meta.color} />
                                                    </div>
                                                );
                                            })()}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>{aiResult.title}</p>
                                                    <span style={{ fontSize: '10px', fontWeight: 700, background: '#ddd6fe', color: '#7c3aed', borderRadius: '8px', padding: '2px 8px', textTransform: 'uppercase' }}>
                                                        {getTypeMeta(aiResult.type).label}
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '13px', color: '#7c3aed', fontWeight: 600 }}>{aiResult.subtitle}</p>
                                            </div>
                                        </div>

                                        {/* Page target */}
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', background: '#f3f4f6', borderRadius: '8px', padding: '3px 10px' }}>
                                                📱 {aiResult.page === 'home' ? "Page d'Accueil" : "Page Explorer"}
                                            </span>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#d1fae5', borderRadius: '8px', padding: '3px 10px' }}>
                                                {aiResult.recipe_ids.length} plat{aiResult.recipe_ids.length > 1 ? 's' : ''} sélectionné{aiResult.recipe_ids.length > 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {/* AI Reasoning */}
                                        <div style={{ background: 'rgba(124,58,237,0.06)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', display: 'flex', gap: '10px' }}>
                                            <Sparkles size={16} color="#7c3aed" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <p style={{ margin: 0, fontSize: '12px', color: '#5b21b6', fontWeight: 500, lineHeight: 1.6 }}>{aiResult.reasoning}</p>
                                        </div>

                                        {/* Recipe chips */}
                                        <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recettes sélectionnées</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            {aiResult.recipe_ids.map(rid => (
                                                <RecipePreviewChip key={rid} recipeId={rid} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div style={{ padding: '20px 28px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '10px' }}>
                            {aiStep === 'goal' && (
                                <>
                                    <button onClick={() => setShowAIPanel(false)}
                                        style={{ flex: 1, height: '48px', borderRadius: '14px', border: '1.5px solid #e5e7eb', background: '#fff', fontSize: '14px', fontWeight: 700, color: '#374151', cursor: 'pointer' }}>
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleGenerateAI}
                                        disabled={!selectedGoal && !customPrompt.trim()}
                                        style={{
                                            flex: 2, height: '48px', borderRadius: '14px', border: 'none',
                                            background: selectedGoal || customPrompt.trim() ? 'linear-gradient(135deg, #7c3aed, #4318ff)' : '#f3f4f6',
                                            color: selectedGoal || customPrompt.trim() ? '#fff' : '#9ca3af',
                                            fontSize: '14px', fontWeight: 700, cursor: selectedGoal || customPrompt.trim() ? 'pointer' : 'not-allowed',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            boxShadow: selectedGoal || customPrompt.trim() ? '0 4px 16px rgba(124,58,237,0.35)' : 'none',
                                            transition: 'all 0.2s',
                                        }}>
                                        <Zap size={17} /> Générer la Section
                                    </button>
                                </>
                            )}
                            {aiStep === 'result' && aiResult && (
                                <>
                                    <button onClick={() => { setAiStep('goal'); setAiResult(null); }}
                                        style={{ flex: 1, height: '48px', borderRadius: '14px', border: '1.5px solid #e5e7eb', background: '#fff', fontSize: '14px', fontWeight: 700, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <RefreshCw size={15} /> Regénérer
                                    </button>
                                    <button onClick={handleEditAISection}
                                        style={{ flex: 1, height: '48px', borderRadius: '14px', border: '1.5px solid #4318ff', background: '#fff', fontSize: '14px', fontWeight: 700, color: '#4318ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <Edit2 size={15} /> Personnaliser
                                    </button>
                                    <button onClick={handleSaveAISection} disabled={isSaving}
                                        style={{
                                            flex: 2, height: '48px', borderRadius: '14px', border: 'none',
                                            background: 'linear-gradient(135deg, #059669, #047857)',
                                            color: '#fff', fontSize: '14px', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            boxShadow: '0 4px 16px rgba(5,150,105,0.3)', opacity: isSaving ? 0.7 : 1,
                                        }}>
                                        {isSaving ? <RefreshCw size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={17} />}
                                        {isSaving ? 'Publication...' : 'Publier la Section'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
            `}</style>
        </div>
    );
}
