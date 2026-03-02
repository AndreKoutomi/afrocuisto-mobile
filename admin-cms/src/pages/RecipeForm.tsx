import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, ImagePlus, X, Clock, Flame, Globe, Tag, BookOpen, Sparkles, ChefHat, Leaf, Wand2, Zap } from 'lucide-react';
import { aiService } from '../lib/ai';

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
    origine_humaine: ''
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

export function RecipeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!id);
    const [aiLoading, setAiLoading] = useState(false);

    const [aiPrefilled, setAiPrefilled] = useState(false);

    useEffect(() => {
        if (id) {
            supabase.from('recipes').select('*').eq('id', id).single().then(({ data, error }) => {
                if (data && !error) setFormData({ ...INITIAL_STATE, ...data });
                setInitialLoading(false);
            });
        } else {
            // Vérifier s'il y a des données IA à pré-remplir
            const aiData = sessionStorage.getItem('ai_recipe_prefill');
            if (aiData) {
                try {
                    const parsed = JSON.parse(aiData);
                    setFormData(prev => ({ ...prev, ...parsed }));
                    setAiPrefilled(true);
                    sessionStorage.removeItem('ai_recipe_prefill');
                } catch (_) { }
            }
        }
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        const filePath = `${Math.random()}.${file.name.split('.').pop()}`;
        setUploading(true);
        try {
            const { error: uploadError } = await supabase.storage.from('recipe-images').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('recipe-images').getPublicUrl(filePath);
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
        const { data, error } = await aiService.generateRecipeDetails(formData.name);
        if (data) {
            setFormData(prev => ({ ...prev, ...data }));
            setAiPrefilled(true);
        } else if (error) {
            alert(`Erreur IA : ${error}`);
        }
        setAiLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const cleanData = { ...formData };
        delete (cleanData as any).origine_humaine;
        try {
            if (id) {
                const { error } = await supabase.from('recipes').update(cleanData).eq('id', id);
                if (error) throw error;
            } else {
                (cleanData as any).id = `rec_${Date.now()}`;
                const { error } = await supabase.from('recipes').insert([cleanData]);
                if (error) throw error;
            }
            navigate('/recipes');
        } catch (err) {
            console.error('Save error:', err);
            alert('Erreur lors de la sauvegarde.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="center-content"><div className="loader"></div></div>;

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

    const cardStyle: React.CSSProperties = {
        background: '#fff', borderRadius: '20px',
        border: '1px solid #f0f0f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        overflow: 'hidden',
    };

    const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>{label}</label>
            {children}
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
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
                        <h1 style={{ margin: '2px 0 0', fontSize: '24px', fontWeight: 800, color: '#111827' }}>
                            {id ? 'Modifier la Recette' : 'Nouvelle Recette'}
                        </h1>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleSubmit as any}
                    disabled={loading}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: '#4318ff', color: '#fff', border: 'none',
                        borderRadius: '14px', padding: '12px 24px',
                        fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        boxShadow: '0 4px 16px rgba(67,24,255,0.25)',
                    }}
                >
                    {loading
                        ? <div className="loader" style={{ width: 18, height: 18, borderLeftColor: '#fff' }} />
                        : <><Save size={17} /> Enregistrer</>
                    }
                </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', alignItems: 'start' }}>

                {/* ══ LEFT COLUMN ══ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Bandeau pré-remplissage IA */}
                    {aiPrefilled && (
                        <div style={{
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #eef2ff, #ede9fe)',
                            border: '1.5px solid #c7d2fe',
                            padding: '14px 18px',
                            display: 'flex', alignItems: 'center', gap: '12px',
                        }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #4318ff, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Sparkles size={16} color="#fff" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#312e81' }}>Pré-rempli par l'Assistant IA ✨</p>
                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6366f1' }}>Vérifiez et complétez les champs — ajoutez notamment une photo du plat.</p>
                            </div>
                            <button onClick={() => setAiPrefilled(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                                <X size={15} />
                            </button>
                        </div>
                    )}

                    {/* Panel: Identity */}
                    <div style={cardStyle}>
                        {sectionHeader(<ChefHat size={18} color="#7c3aed" />, 'Identité du Plat', 'Nom, alias et classification', '#ede9fe')}
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
                                            background: aiLoading ? '#f3f4f6' : 'linear-gradient(135deg, #7c3aed, #4318ff)',
                                            color: aiLoading ? '#9ca3af' : '#fff',
                                            border: 'none',
                                            cursor: aiLoading ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            boxShadow: aiLoading ? 'none' : '0 4px 12px rgba(124,58,237,0.2)',
                                        }}
                                    >
                                        {aiLoading ? <Zap size={14} className="animate-spin" /> : <Wand2 size={14} />}
                                        <span style={{ whiteSpace: 'nowrap' }}>{aiLoading ? 'IA en cours...' : 'Remplir par l\'IA'}</span>
                                    </button>
                                </div>
                            </Field>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <Field label="Alias / Nom local">
                                    <input name="alias" value={formData.alias || ''} onChange={handleChange} placeholder="Nom en langue locale" style={inputStyle} />
                                </Field>
                                <Field label="Catégorie">
                                    <select name="category" value={formData.category || ''} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                                        <option value="">Sélectionner...</option>
                                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </Field>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <Field label="Type de Plat">
                                    <input name="type" value={formData.type || ''} onChange={handleChange} placeholder="Plat principal, Dessert..." style={inputStyle} />
                                </Field>
                                <Field label="Style de Cuisson">
                                    <input name="style" value={formData.style || ''} onChange={handleChange} placeholder="Braisé, Vapeur, Frit..." style={inputStyle} />
                                </Field>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                        {sectionHeader(<BookOpen size={18} color="#4318ff" />, "Détails de la Recette", "Description, technique et bénéfices", "#f4f7fe")}
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                        </div>
                    </div>
                </div>

                {/* ══ RIGHT COLUMN ══ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>

                    {/* Panel: Image */}
                    <div style={cardStyle}>
                        {sectionHeader(<Globe size={18} color="#059669" />, "Informations Culturelles", "Origine et contexte historique", "#ecfdf5")}
                        <div style={{ padding: '20px' }}>
                            {formData.image ? (
                                <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', aspectRatio: '4/3', background: '#f3f4f6' }}>
                                    <img
                                        src={formData.image}
                                        alt="Aperçu"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                        onError={e => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                        style={{
                                            position: 'absolute', top: '10px', right: '10px',
                                            width: '30px', height: '30px', borderRadius: '50%',
                                            background: 'rgba(0,0,0,0.4)', border: 'none',
                                            cursor: 'pointer', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            backdropFilter: 'blur(4px)',
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
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
                                <select name="difficulty" value={formData.difficulty || ''} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </Field>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    <div style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', borderRadius: '16px', padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <Tag size={14} color="#7c3aed" />
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Complétion du profil</span>
                        </div>
                        {[
                            { label: 'Nom', done: !!formData.name, icon: <ChefHat size={12} /> },
                            { label: 'Photo', done: !!formData.image, icon: <ImagePlus size={12} /> },
                            { label: 'Catégorie', done: !!formData.category, icon: <Tag size={12} /> },
                            { label: 'Description', done: !!formData.description, icon: <BookOpen size={12} /> },
                            { label: 'Région', done: !!formData.region, icon: <Globe size={12} /> },
                            { label: 'Bienfaits', done: !!formData.benefits, icon: <Leaf size={12} /> },
                        ].map(f => (
                            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
                                <div style={{
                                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                                    background: f.done ? '#7c3aed' : 'rgba(124,58,237,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: f.done ? '#fff' : '#a78bfa',
                                }}>
                                    {f.icon}
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: f.done ? '#5b21b6' : '#a78bfa', textDecoration: f.done ? 'none' : 'none' }}>{f.label}</span>
                                {f.done && <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 800, color: '#7c3aed' }}>✓</span>}
                            </div>
                        ))}
                        <div style={{ marginTop: '12px', height: '6px', borderRadius: '99px', background: 'rgba(124,58,237,0.15)', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: '99px', background: '#7c3aed',
                                width: `${([formData.name, formData.image, formData.category, formData.description, formData.region, formData.benefits].filter(Boolean).length / 6) * 100}%`,
                                transition: 'width 0.3s ease',
                            }} />
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
}
