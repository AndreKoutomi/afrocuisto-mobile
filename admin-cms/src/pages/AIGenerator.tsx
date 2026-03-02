import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Sparkles, CheckCircle2, ChefHat, Clock, Flame,
    Globe, BookOpen, Leaf, Tag, ArrowRight, Key, X, Wand2,
    RefreshCw, Copy, Check
} from 'lucide-react';

// ── Champs du formulaire recette (identique à RecipeForm INITIAL_STATE) ──
const RECIPE_FIELDS = [
    'name', 'alias', 'region', 'category', 'difficulty',
    'prep_time', 'cook_time', 'description',
    'technique_title', 'technique_description',
    'benefits', 'style', 'type', 'base'
] as const;

type RecipeData = Record<typeof RECIPE_FIELDS[number], string>;

const CATEGORIES = [
    "Pâtes et Céréales (Wɔ̌)",
    "Sauces (Nùsúnnú)",
    "Plats de Résistance & Ragoûts",
    "Protéines & Grillades",
    "Street Food & Snacks (Amuse-bouche)",
    "Boissons & Douceurs",
    "Condiments & Accompagnements",
];

const PROMPT_SUGGESTIONS = [
    "Crée une recette du Gbegiri, la purée de haricots béninoise, avec ses secrets de préparation.",
    "Génère une fiche complète sur le Thiéboudienne sénégalais, le riz au poisson royal.",
    "Décris le Ndolé camerounais avec ses feuilles amères et son histoire culturelle.",
    "Rédige la recette du Fufu ghanéen avec ses différentes bases (igname, plantain, manioc).",
    "Crée une fiche sur le Jollof Rice nigérian avec ses controverses culinaires.",
];


export function AIGenerator() {
    const navigate = useNavigate();
    const [apiKey, setApiKey] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');

    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<RecipeData | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [model, setModel] = useState('gemini-1.5-flash');

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        const storedModel = localStorage.getItem('gemini_model');
        if (storedKey) { setApiKey(storedKey); setApiKeyInput(storedKey); }
        if (storedModel) { setModel(storedModel); }
        if (!storedKey) setShowSettings(true);
    }, []);

    const saveApiKey = () => {
        const trimmed = apiKeyInput.trim();
        localStorage.setItem('gemini_api_key', trimmed);
        localStorage.setItem('gemini_model', model);
        setApiKey(trimmed);
        setShowSettings(false);
    };

    const handleGenerate = async () => {
        if (!apiKey) { setShowSettings(true); return; }
        if (!prompt.trim()) return;
        setLoading(true);
        setResult(null);

        const systemPrompt = `Tu es un chef cuisinier expert en gastronomie africaine.
Renvoie la recette SOUS FORME D'OBJET JSON STRICTEMENT VALIDE. NE RENVOIE QUE LE JSON, SANS MARKDOWN NI TEXTE AUTOUR.
Les clés doivent correspondre EXACTEMENT à ce format :
{
  "name": "Nom du plat",
  "alias": "Autre nom usuel ou nom en langue locale",
  "region": "Ex: Sud-Bénin, Sénégal, National",
  "category": "Choisis strictement parmi: ${CATEGORIES.join(', ')}",
  "difficulty": "Choisis parmi: Très Facile, Facile, Intermédiaire, Moyen, Difficile, Très Difficile",
  "prep_time": "ex: 15 min",
  "cook_time": "ex: 45 min",
  "description": "Une belle description commerciale et culturelle du plat (2-4 phrases)",
  "technique_title": "Nom d'une technique de préparation clé de ce plat",
  "technique_description": "Comment exécuter cette technique (2-3 phrases)",
  "benefits": "Bienfaits santé et nutritionnels du plat",
  "style": "ex: Braisé, Vapeur, Ragoût, Frit, Mijoté",
  "type": "ex: Plat Principal, Dessert, Entrée, Snack",
  "base": "Ingrédient principal, ex: Manioc, Poulet, Haricot"
}`;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt }, { text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            responseMimeType: "application/json"
                        },
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const msg = errorData.error?.message || `Erreur API Google Gemini: ${response.status}`;
                if (response.status === 429) {
                    throw new Error("Limite de requêtes atteinte (API 429). Attendez 60 secondes ou utilisez une clé 'Pay-as-you-go' sans limite.");
                }
                throw new Error(msg);
            }

            const data = await response.json();
            let text = data.candidates[0].content.parts[0].text;
            let parsed: RecipeData;
            try {
                parsed = JSON.parse(text);
            } catch {
                if (text.includes('```json')) text = text.split('```json')[1].split('```')[0].trim();
                else if (text.includes('```')) text = text.split('```')[1].split('```')[0].trim();
                parsed = JSON.parse(text);
            }
            setResult(parsed);
        } catch (err: any) {
            alert(`Erreur IA : ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRecipe = async () => {
        if (!result) return;
        setSaving(true);
        try {
            const recipeId = `rec_ai_${Date.now()}`;
            // On prépare l'objet pour l'insertion
            const payload = {
                ...result,
                id: recipeId,
                image: '' // Pas encore d'image de l'IA
            };

            const { error } = await supabase.from('recipes').insert([payload]);
            if (error) throw error;

            // Une fois créé, on navigue vers l'édition pour que l'utilisateur puisse ajouter une photo
            navigate(`/recipes/edit/${recipeId}`);
        } catch (err: any) {
            console.error('Erreur création IA:', err);
            alert(`Impossible de créer le plat : ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const copyField = (value: string, field: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 1500);
    };

    /* ── Composants de style ── */
    const cardStyle: React.CSSProperties = {
        background: '#fff',
        borderRadius: '24px',
        border: '1px solid #f0f0f0',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        overflow: 'hidden',
    };

    /* Badge de difficulté */
    const diffColors: Record<string, { bg: string; text: string }> = {
        'Très Facile': { bg: '#d1fae5', text: '#065f46' },
        'Facile': { bg: '#dcfce7', text: '#15803d' },
        'Intermédiaire': { bg: '#fef3c7', text: '#92400e' },
        'Moyen': { bg: '#fed7aa', text: '#9a3412' },
        'Difficile': { bg: '#fecdd3', text: '#9f1239' },
        'Très Difficile': { bg: '#f3e8ff', text: '#6b21a8' },
    };
    const diffStyle = result ? (diffColors[result.difficulty] ?? { bg: '#f3f4f6', text: '#374151' }) : { bg: '#f3f4f6', text: '#374151' };

    /* Champs affichés dans le résultat, dans l'ordre du formulaire */
    const resultFields: { key: keyof RecipeData; label: string; icon: React.ReactNode; multiline?: boolean }[] = [
        { key: 'alias', label: 'Alias / Nom local', icon: <Tag size={13} color="#7c3aed" /> },
        { key: 'region', label: 'Région / Origine', icon: <Globe size={13} color="#0891b2" /> },
        { key: 'category', label: 'Catégorie', icon: <Tag size={13} color="#059669" /> },
        { key: 'type', label: 'Type de Plat', icon: <ChefHat size={13} color="#d97706" /> },
        { key: 'style', label: 'Style de Cuisson', icon: <Flame size={13} color="#ef4444" /> },
        { key: 'base', label: 'Ingrédient de Base', icon: <Leaf size={13} color="#16a34a" /> },
        { key: 'prep_time', label: 'Temps de Préparation', icon: <Clock size={13} color="#6b7280" /> },
        { key: 'cook_time', label: 'Temps de Cuisson', icon: <Flame size={13} color="#f59e0b" /> },
        { key: 'description', label: 'Description', icon: <BookOpen size={13} color="#4318ff" />, multiline: true },
        { key: 'technique_title', label: 'Technique — Titre', icon: <Wand2 size={13} color="#7c3aed" /> },
        { key: 'technique_description', label: 'Technique — Description', icon: <Wand2 size={13} color="#a78bfa" />, multiline: true },
        { key: 'benefits', label: 'Bienfaits Nutritionnels', icon: <Leaf size={13} color="#059669" />, multiline: true },
    ];

    return (
        <div style={{ maxWidth: '1200px' }}>

            {/* ── Header gradient ── */}
            <div style={{
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 70%, #6366f1 100%)',
                padding: '28px 32px',
                marginBottom: '24px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Orbes décoratives */}
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: '-20px', right: '120px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <Sparkles size={26} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
                                Assistant IA — Chef Africain
                            </h1>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
                                Générez des fiches recettes complètes et culturelles avec Google Gemini
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSettings(s => !s)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: '12px', padding: '10px 16px',
                            color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                            backdropFilter: 'blur(10px)', transition: 'background 0.2s',
                        }}
                    >
                        <Key size={15} /> Clé API {apiKey ? '✓' : '—'}
                    </button>
                </div>
            </div>

            {/* ── Panneau clé API ── */}
            {showSettings && (
                <div style={{
                    ...cardStyle,
                    border: '1.5px solid #c7d2fe',
                    background: 'linear-gradient(135deg, #eef2ff, #ede9fe)',
                    marginBottom: '20px',
                }}>
                    <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Key size={16} color="#fff" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#312e81' }}>Clé Google Gemini AI</p>
                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6366f1' }}>Obtenable gratuitement sur <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: '#4338ca', fontWeight: 700 }}>Google AI Studio</a></p>
                            </div>
                        </div>
                        <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                            <X size={18} />
                        </button>
                    </div>
                    <div style={{ padding: '0 24px 20px', display: 'flex', gap: '12px' }}>
                        <input
                            type="password"
                            value={apiKeyInput}
                            onChange={e => setApiKeyInput(e.target.value)}
                            placeholder="AIzaSy..."
                            onKeyDown={e => e.key === 'Enter' && saveApiKey()}
                            style={{
                                flex: 1, height: '44px', borderRadius: '12px',
                                border: '1.5px solid #c7d2fe', background: '#fff',
                                padding: '0 14px', fontSize: '14px', fontWeight: 600, color: '#111827',
                                outline: 'none', fontFamily: 'monospace',
                            }}
                        />
                        <select
                            value={model}
                            onChange={e => setModel(e.target.value)}
                            style={{
                                height: '44px', borderRadius: '12px',
                                border: '1.5px solid #c7d2fe', background: '#fff',
                                padding: '0 10px', fontSize: '13px', fontWeight: 700, color: '#4338ca',
                                outline: 'none', cursor: 'pointer'
                            }}
                        >
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                            <option value="gemini-1.0-pro">Gemini 1.0 Pro (Legacy)</option>
                        </select>
                        <button
                            onClick={saveApiKey}
                            style={{
                                background: '#4318ff', color: '#fff', border: 'none',
                                borderRadius: '12px', padding: '0 20px',
                                fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(67,24,255,0.3)',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                        >
                            <CheckCircle2 size={15} /> Enregistrer
                        </button>
                    </div>
                </div>
            )}

            {/* ── Layout 2 colonnes ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

                {/* ── Colonne gauche : Prompt ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Card prompt */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Wand2 size={17} color="#7c3aed" />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>Formuler une demande</p>
                                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Décrivez le plat en langage naturel</p>
                            </div>
                        </div>
                        <div style={{ padding: '20px 24px' }}>
                            <textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="Ex: Génère la fiche du Gbegiri béninois, la purée de haricots dorée servie avec l'Abula..."
                                rows={6}
                                style={{
                                    width: '100%', borderRadius: '14px',
                                    border: '1.5px solid #e5e7eb',
                                    padding: '14px', fontSize: '14px',
                                    fontWeight: 500, color: '#111827', lineHeight: 1.6,
                                    resize: 'vertical', outline: 'none',
                                    transition: 'border-color 0.2s', boxSizing: 'border-box',
                                    fontFamily: 'inherit',
                                }}
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !prompt.trim()}
                                style={{
                                    width: '100%', marginTop: '12px',
                                    height: '52px', borderRadius: '14px', border: 'none',
                                    background: loading || !prompt.trim()
                                        ? '#e5e7eb'
                                        : 'linear-gradient(135deg, #4318ff, #7c3aed)',
                                    color: loading || !prompt.trim() ? '#9ca3af' : '#fff',
                                    fontSize: '15px', fontWeight: 800,
                                    cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    boxShadow: loading || !prompt.trim() ? 'none' : '0 6px 20px rgba(67,24,255,0.35)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {loading
                                    ? <><div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> Génération en cours...</>
                                    : <><Sparkles size={20} /> Générer la fiche recette</>
                                }
                            </button>
                        </div>
                    </div>

                    {/* Suggestions rapides */}
                    <div style={cardStyle}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                💡 Suggestions rapides
                            </p>
                        </div>
                        <div style={{ padding: '12px' }}>
                            {PROMPT_SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPrompt(s)}
                                    style={{
                                        width: '100%', textAlign: 'left',
                                        background: prompt === s ? 'rgba(67,24,255,0.06)' : 'transparent',
                                        border: prompt === s ? '1px solid rgba(67,24,255,0.15)' : '1px solid transparent',
                                        borderRadius: '10px', padding: '10px 12px',
                                        fontSize: '12px', fontWeight: 500, color: prompt === s ? '#4318ff' : '#374151',
                                        cursor: 'pointer', marginBottom: '4px',
                                        transition: 'all 0.15s', lineHeight: 1.5,
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Colonne droite : Résultat ── */}
                <div style={cardStyle}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChefHat size={17} color="#d97706" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>Résultat — Fiche Recette</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Prêt à importer dans le formulaire</p>
                        </div>
                        {result && (
                            <button
                                onClick={() => { setResult(null); setPrompt(''); }}
                                title="Effacer"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
                            >
                                <RefreshCw size={15} />
                            </button>
                        )}
                    </div>

                    <div style={{ padding: '24px', maxHeight: '640px', overflowY: 'auto' }}>

                        {/* État chargement */}
                        {loading && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '50%',
                                    border: '3px solid #e5e7eb', borderTopColor: '#4318ff',
                                    animation: 'spin 0.9s linear infinite',
                                }} />
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#374151' }}>Rédaction culturelle en cours…</p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Gemini analyse votre demande</p>
                            </div>
                        )}

                        {/* État vide */}
                        {!loading && !result && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px', textAlign: 'center' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Sparkles size={28} color="#d1d5db" />
                                </div>
                                <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#374151' }}>L'aperçu apparaîtra ici</p>
                                <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Décrivez un plat à gauche et cliquez sur Générer</p>
                            </div>
                        )}

                        {/* ── Résultat ── */}
                        {!loading && result && (
                            <div>
                                {/* En-tête recette */}
                                <div style={{
                                    padding: '18px 20px',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                                    marginBottom: '20px',
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                    <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                        <div>
                                            <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                                                {result.name}
                                            </h2>
                                            {result.alias && (
                                                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                                                    « {result.alias} »
                                                </p>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', background: diffStyle.bg, color: diffStyle.text }}>
                                                {result.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                        {result.region && (
                                            <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '3px 10px', borderRadius: '20px' }}>
                                                🌍 {result.region}
                                            </span>
                                        )}
                                        {result.category && (
                                            <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '3px 10px', borderRadius: '20px' }}>
                                                {result.category}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Temps */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                                    {[
                                        { label: 'Préparation', value: result.prep_time, icon: <Clock size={14} color="#6b7280" /> },
                                        { label: 'Cuisson', value: result.cook_time, icon: <Flame size={14} color="#ef4444" /> },
                                    ].map(t => (
                                        <div key={t.label} style={{ background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {t.icon}
                                            <div>
                                                <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{t.label}</p>
                                                <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 800, color: '#111827' }}>{t.value || '—'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Champs détaillés */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                    {resultFields
                                        .filter(f => !['prep_time', 'cook_time'].includes(f.key) && result[f.key])
                                        .map(f => (
                                            <div key={f.key} style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '12px 14px', position: 'relative' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        {f.icon}
                                                        <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            {f.label}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => copyField(result[f.key], f.key)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: '2px', display: 'flex' }}
                                                        title="Copier"
                                                    >
                                                        {copiedField === f.key ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                                                    </button>
                                                </div>
                                                <p style={{
                                                    margin: 0, fontSize: '13px', fontWeight: 600, color: '#374151',
                                                    lineHeight: f.multiline ? 1.6 : 1.3,
                                                    ...(f.multiline ? {} : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })
                                                }}>
                                                    {result[f.key]}
                                                </p>
                                            </div>
                                        ))
                                    }
                                </div>

                                {/* Bouton CTA principal — Création directe */}
                                <button
                                    onClick={handleCreateRecipe}
                                    disabled={saving}
                                    style={{
                                        width: '100%', height: '54px',
                                        borderRadius: '16px', border: 'none',
                                        background: 'linear-gradient(135deg, #059669, #10b981)',
                                        color: '#fff', fontSize: '15px', fontWeight: 800,
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        boxShadow: '0 6px 20px rgba(5,150,105,0.35)',
                                        transition: 'all 0.2s',
                                        opacity: saving ? 0.7 : 1,
                                    }}
                                >
                                    {saving ? (
                                        <><div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> Création du plat...</>
                                    ) : (
                                        <>
                                            <ArrowRight size={20} />
                                            Créer le plat dans la base
                                        </>
                                    )}
                                </button>
                                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#9ca3af', textAlign: 'center', fontWeight: 500 }}>
                                    Le plat sera ajouté instantanément — vous pourrez ensuite choisir une photo
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CSS animation spin */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
