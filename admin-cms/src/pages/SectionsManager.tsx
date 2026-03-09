import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus, Trash2, ArrowUp, ArrowDown, LayoutGrid, GalleryHorizontal,
    List, AlignJustify, Smartphone, Compass, Sparkles, RefreshCw,
    Star
} from 'lucide-react';
import { aiService } from '../lib/ai';
import { Link } from 'react-router-dom';

const TYPE_META: Record<string, { label: string; icon: any; color: string; bg: string; description: string }> = {
    dynamic_carousel: { label: 'Carrousel', icon: GalleryHorizontal, color: '#7c3aed', bg: '#ede9fe', description: 'Défilement fluide et cinématique de recettes' },
    horizontal_list: { label: 'Horizontal', icon: AlignJustify, color: '#0891b2', bg: '#e0f2fe', description: 'Liste à défilement horizontal compact' },
    vertical_list_1: { label: 'Liste simple', icon: List, color: '#059669', bg: '#d1fae5', description: 'Cartes verticales avec image et détails' },
    vertical_list_2: { label: 'Grille 2col', icon: LayoutGrid, color: '#d97706', bg: '#fef3c7', description: 'Grille en deux colonnes, style magazine' },
};

function getTypeMeta(type: string) {
    return TYPE_META[type] || { label: type, icon: LayoutGrid, color: '#6b7280', bg: '#f3f4f6', description: '' };
}

const SectionCard = ({ section, idx, group, handleMoveGroup, handleDelete, deletingId }: any) => {
    const meta = getTypeMeta(section.type);
    const Icon = meta.icon;
    const isFirst = idx === 0;
    const isLast = idx === group.length - 1;
    const isDeleting = deletingId === section.id;
    const isAIGenerated = section.config?.ai_generated;

    return (
        <div style={{
            background: '#fff', borderRadius: '18px',
            border: isAIGenerated ? '1.5px solid #ffd8c2' : '1px solid #f0f0f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px',
            opacity: isDeleting ? 0.5 : 1,
        }}>
            <div style={{ width: '32px', height: '32px', flexShrink: 0, background: '#f9fafb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#9ca3af' }}>
                {idx + 1}
            </div>
            <div style={{ width: '44px', height: '44px', flexShrink: 0, background: meta.bg, borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={meta.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{section.title}</span>
                    {isAIGenerated && <Sparkles size={12} color="#fb5607" />}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>{section.subtitle}</p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => handleMoveGroup(section.id, 'up', group)} disabled={isFirst} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #eee', background: '#fff', cursor: isFirst ? 'not-allowed' : 'pointer' }}><ArrowUp size={14} /></button>
                <button onClick={() => handleMoveGroup(section.id, 'down', group)} disabled={isLast} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #eee', background: '#fff', cursor: isLast ? 'not-allowed' : 'pointer' }}><ArrowDown size={14} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link to={`/sections/edit/${section.id}`} style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--primary)', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>Modifier</Link>
                <button onClick={() => handleDelete(section.id)} style={{ padding: '8px', borderRadius: '10px', background: '#fff5f5', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
            </div>
        </div>
    );
};

const GroupPanel = ({ title, description, icon: GIcon, iconColor, iconBg, groupSections, handleMoveGroup, handleDelete, deletingId }: any) => (
    <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GIcon size={18} color={iconColor} />
            </div>
            <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#111827' }}>{title}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{description}</p>
            </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {groupSections.map((section: any, idx: number) => (
                <SectionCard
                    key={section.id}
                    section={section}
                    idx={idx}
                    group={groupSections}
                    handleMoveGroup={handleMoveGroup}
                    handleDelete={handleDelete}
                    deletingId={deletingId}
                />
            ))}
        </div>
    </div>
);

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
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // AI logic state
    // 🎩 AI Section Creation Wizard state
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [selectedType, setSelectedType] = useState<string>('dynamic_carousel');
    const [theme, setTheme] = useState('');
    const [generatedSection, setGeneratedSection] = useState<AIGeneratedSection | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedSubtitle, setEditedSubtitle] = useState('');
    const [editedRecipeIds, setEditedRecipeIds] = useState<string[]>([]);


    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoading(true);
            const [sectionRes] = await Promise.all([
                supabase.from('home_sections').select('*').order('order_index'),
            ]);
            if (sectionRes.data) setSections(sectionRes.data);
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
            const updates = newGroup.map((s, i) => ({
                id: s.id,
                title: s.title,
                subtitle: s.subtitle,
                recipe_ids: s.recipe_ids,
                type: s.type,
                config: s.config,
                order_index: i
            }));
            const { error } = await supabase.from('home_sections').upsert(updates);
            if (error) throw error;
        } catch (err) {
            fetchData();
        }
    }



    const homeSections = sections.filter(s => !s.config?.page || s.config.page === 'home');
    const explorerSections = sections.filter(s => s.config?.page === 'explorer');

    return (
        <div style={{ maxWidth: '1100px', padding: '0 20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0 }}>Gestion des Sections</h1>
                    <p style={{ color: '#9ca3af', margin: '4px 0 0' }}>Organisez le contenu de votre application mobile</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>

                    <button onClick={() => {
                        setWizardStep(1);
                        setTheme('');
                        setWizardOpen(true);
                    }} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #ff6b1a, #fb5607)',
                        color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)'
                    }}>
                        <Sparkles size={18} /> Créer avec IA
                    </button>

                    <Link to="/sections/create" style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px',
                        background: 'var(--primary)', color: '#fff', textDecoration: 'none', fontWeight: 700,
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)'
                    }}>
                        <Plus size={18} /> Nouvelle Section
                    </Link>
                </div>
            </div>



            {/* Main Sections */}
            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Chargement...</div>
            ) : (
                <>
                    <GroupPanel
                        title="Page d'Accueil"
                        description="Sections du flux principal"
                        icon={Smartphone}
                        iconColor="#059669"
                        iconBg="#d1fae5"
                        groupSections={homeSections}
                        handleMoveGroup={handleMoveGroup}
                        handleDelete={handleDelete}
                        deletingId={deletingId}
                    />
                    <GroupPanel
                        title="Page Explorer"
                        description="Sections de recherche et découverte"
                        icon={Compass}
                        iconColor="#d97706"
                        iconBg="#fef3c7"
                        groupSections={explorerSections}
                        handleMoveGroup={handleMoveGroup}
                        handleDelete={handleDelete}
                        deletingId={deletingId}
                    />
                </>
            )}


            {/* AI Section Creation Wizard Modal */}
            {wizardOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setWizardOpen(false)}>
                    <div style={{
                        background: 'rgba(255,255,255,0.85)', borderRadius: '20px', padding: '30px',
                        width: '90%', maxWidth: '500px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        animation: 'fadeIn 0.3s ease-out',
                    }} onClick={e => e.stopPropagation()}>
                        {/* Step navigation */}
                        {wizardStep === 1 && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Magie de Création</h2>
                                    <button onClick={() => setWizardOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <RefreshCw size={18} color="#9ca3af" />
                                    </button>
                                </div>
                                <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>Quel type d'expérience voulez-vous créer ?</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                    {Object.keys(TYPE_META).map(k => {
                                        const meta = TYPE_META[k];
                                        const Icon = meta.icon;
                                        return (
                                            <button
                                                key={k}
                                                onClick={() => { setSelectedType(k); setWizardStep(2); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '15px', padding: '15px',
                                                    background: selectedType === k ? meta.bg : '#fff',
                                                    border: `1.5px solid ${selectedType === k ? meta.color : '#f3f4f6'}`,
                                                    borderRadius: '15px', cursor: 'pointer', textAlign: 'left',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ width: '40px', height: '40px', background: meta.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Icon size={20} color={meta.color} />
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#111827' }}>{meta.label}</p>
                                                    <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>{meta.description}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {wizardStep === 2 && (
                            <div>
                                <h2 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 800 }}>Thème de la section</h2>
                                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>Dites à l'IA ce que vous imaginez.</p>
                                <input
                                    autoFocus
                                    type="text"
                                    value={theme}
                                    onChange={e => setTheme(e.target.value)}
                                    placeholder="ex: Spécialités épicées du Sénégal"
                                    style={{
                                        width: '100%', padding: '15px', borderRadius: '15px',
                                        border: '1.5px solid #ffd8c2', background: '#fff5f0',
                                        fontSize: '15px', color: '#111827', outline: 'none',
                                        marginBottom: '20px'
                                    }}
                                />
                                <button
                                    onClick={() => setWizardStep(3)}
                                    style={{
                                        width: '100%', padding: '15px', borderRadius: '15px',
                                        background: '#fb5607', color: '#fff', border: 'none',
                                        fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                    }}
                                >
                                    Suivant
                                </button>
                            </div>
                        )}
                        {wizardStep === 3 && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <Sparkles
                                        size={40}
                                        color={aiLoading ? "#fb5607" : "#d1d5db"}
                                        style={{ animation: aiLoading ? 'spin 1.5s linear infinite' : 'none' }}
                                    />
                                </div>
                                <h2 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 800 }}>
                                    {aiLoading ? 'Génération en cours...' : 'Prêt pour la magie ?'}
                                </h2>
                                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>
                                    {aiLoading
                                        ? "L'IA analyse le catalogue pour concocter la meilleure sélection..."
                                        : "L'IA va sélectionner les meilleurs plats et rédiger les titres pour vous."}
                                </p>
                                <button
                                    disabled={aiLoading}
                                    onClick={async () => {
                                        setAiLoading(true);
                                        try {
                                            const sample = await aiService.getSampleRecipes(20);
                                            const res = await aiService.generateSection(selectedType, theme, sample);
                                            if (res.data) {
                                                setGeneratedSection(res.data);
                                                setEditedTitle(res.data.title);
                                                setEditedSubtitle(res.data.subtitle);
                                                setEditedRecipeIds(res.data.recipe_ids);
                                                setWizardStep(4);
                                            } else {
                                                alert(res.error || 'Erreur IA : Recommencez ou vérifiez votre clé API.');
                                            }
                                        } catch (e: any) {
                                            alert(`Erreur technique : ${e.message}`);
                                        } finally {
                                            setAiLoading(false);
                                        }
                                    }}
                                    style={{
                                        width: '100%', padding: '15px', borderRadius: '15px',
                                        background: aiLoading ? '#f3f4f6' : '#fb5607',
                                        color: aiLoading ? '#9ca3af' : '#fff',
                                        border: 'none',
                                        fontWeight: 800, cursor: aiLoading ? 'not-allowed' : 'pointer',
                                        boxShadow: aiLoading ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)'
                                    }}
                                >
                                    {aiLoading ? <RefreshCw size={18} className="animate-spin" /> : 'Lancer la Génération'}
                                </button>
                            </div>
                        )}
                        {wizardStep === 4 && generatedSection && (
                            <div>
                                <h2 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 800 }}>Vérification Magique</h2>
                                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>Voici ce que l'IA a créé. Vous pouvez affiner.</p>

                                <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '15px', marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', marginBottom: '5px', textTransform: 'uppercase' }}>Titre</label>
                                    <input type="text" value={editedTitle} onChange={e => setEditedTitle(e.target.value)} style={{ width: '100%', padding: '8px', background: 'none', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }} />

                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', marginBottom: '5px', textTransform: 'uppercase' }}>Sous-titre</label>
                                    <input type="text" value={editedSubtitle} onChange={e => setEditedSubtitle(e.target.value)} style={{ width: '100%', padding: '8px', background: 'none', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }} />

                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', marginBottom: '5px', textTransform: 'uppercase' }}>Recettes ({editedRecipeIds.length})</label>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{editedRecipeIds.join(', ')}</p>
                                </div>

                                <button
                                    onClick={async () => {
                                        try {
                                            const newId = `${Date.now()}`;
                                            const { error } = await supabase.from('home_sections').insert([{
                                                id: newId,
                                                title: editedTitle,
                                                subtitle: editedSubtitle,
                                                type: selectedType,
                                                recipe_ids: editedRecipeIds,
                                                config: { ai_generated: true, page: generatedSection.page || 'home' },
                                                order_index: sections.length,
                                            }]);
                                            if (error) throw error;
                                            fetchData();
                                            setWizardOpen(false);
                                        } catch (e: any) {
                                            console.error('Save AI section error:', e);
                                            alert(`Erreur lors de l'enregistrement : ${e.message || 'Vérifiez la console'}`);
                                        }
                                    }}
                                    style={{
                                        width: '100%', padding: '15px', borderRadius: '15px',
                                        background: '#10b981', color: '#fff', border: 'none',
                                        fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                    }}
                                >
                                    Appliquer et Sauvegarder
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        </div>
    );
}
