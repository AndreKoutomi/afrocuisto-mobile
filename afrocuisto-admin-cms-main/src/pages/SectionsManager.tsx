import { useEffect, useState } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import {
    Plus, Trash2, ArrowUp, ArrowDown, LayoutGrid,
    RefreshCw, Eye, EyeOff, Edit2
} from '../components/SolarIcons';
import { Link } from 'react-router-dom';
import { getAppSectionTypeMeta } from '../lib/sectionTypes';

interface HomeSection {
    id: string;
    title: string;
    section_type: string;
    item_ids: string[];
    order_index: number;
    is_active: boolean;
    created_at: string;
}

export function SectionsManager() {
    const [sections, setSections] = useState<HomeSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        fetchSections();
    }, []);

    async function fetchSections() {
        try {
            setLoading(true);
            const { data, error } = await supabaseAdmin
                .from('home_sections')
                .select('*')
                .order('order_index', { ascending: true });
            if (error) throw error;
            setSections(data || []);
        } catch (err) {
            console.error('Erreur chargement sections:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!window.confirm('Supprimer cette section de l’accueil ?')) return;
        setDeletingId(id);
        try {
            const { error } = await supabaseAdmin.from('home_sections').delete().eq('id', id);
            if (error) throw error;
            setSections(prev => prev.filter(s => s.id !== id));
        } catch (err: any) {
            alert('Erreur lors de la suppression : ' + err.message);
        } finally {
            setDeletingId(null);
        }
    }

    async function handleToggleActive(section: HomeSection) {
        setTogglingId(section.id);
        try {
            const next = !section.is_active;
            const { error } = await supabaseAdmin
                .from('home_sections')
                .update({ is_active: next })
                .eq('id', section.id);
            if (error) throw error;
            setSections(prev => prev.map(s => s.id === section.id ? { ...s, is_active: next } : s));
        } catch (err: any) {
            alert('Erreur lors de la mise à jour : ' + err.message);
        } finally {
            setTogglingId(null);
        }
    }

    async function handleMove(index: number, direction: 'up' | 'down') {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;

        const reordered = [...sections];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, moved);

        const updated = reordered.map((sec, idx) => ({ ...sec, order_index: idx }));
        setSections(updated);

        try {
            const updates = updated.map(s =>
                supabaseAdmin.from('home_sections').update({ order_index: s.order_index }).eq('id', s.id)
            );
            await Promise.all(updates);
        } catch (err) {
            console.error('Erreur réorganisation:', err);
            fetchSections();
        }
    }

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="flex-responsive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#111827' }}>
                        Sections de l’Accueil ({sections.length})
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                        Organisez les rubriques dynamiques affichées dans l’application mobile (<code style={{ fontSize: 12 }}>home_sections</code>).
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={fetchSections}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: '#374151' }}
                    >
                        <RefreshCw size={15} /> Actualiser
                    </button>
                    <Link
                        to="/sections/create"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
                    >
                        <Plus size={16} /> Nouvelle Section
                    </Link>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontWeight: 600 }}>
                    Chargement des sections...
                </div>
            ) : sections.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '20px' }}>
                    <LayoutGrid size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#111827' }}>Aucune section configurée</h3>
                    <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b7280' }}>
                        Créez votre première section pour alimenter l’écran d’accueil de l’app AfroCuisto.
                    </p>
                    <Link
                        to="/sections/create"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
                    >
                        <Plus size={16} /> Créer une section
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sections.map((section, idx) => {
                        const meta = getAppSectionTypeMeta(section.section_type);
                        const Icon = meta.icon;
                        const isFirst = idx === 0;
                        const isLast = idx === sections.length - 1;
                        return (
                            <div
                                key={section.id}
                                className="list-item-responsive"
                                style={{
                                    background: '#fff',
                                    borderRadius: '18px',
                                    border: '1px solid #f0f0f0',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                                    padding: '16px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    opacity: deletingId === section.id ? 0.5 : section.is_active ? 1 : 0.65,
                                }}
                            >
                                <div style={{ width: '32px', height: '32px', flexShrink: 0, background: '#f9fafb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#9ca3af' }}>
                                    {idx + 1}
                                </div>
                                <div style={{ width: '44px', height: '44px', flexShrink: 0, background: meta.bg, borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={20} color={meta.color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{section.title}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: meta.bg, color: meta.color }}>
                                            {meta.label}
                                        </span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: section.is_active ? '#dcfce7' : '#f3f4f6', color: section.is_active ? '#15803d' : '#6b7280' }}>
                                            {section.is_active ? 'Active' : 'Masquée'}
                                        </span>
                                    </div>
                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>
                                        {(section.item_ids || []).length} recette{(section.item_ids || []).length > 1 ? 's' : ''} associée{(section.item_ids || []).length > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        onClick={() => handleMove(idx, 'up')}
                                        disabled={isFirst}
                                        title="Monter"
                                        style={{ padding: '7px', borderRadius: '8px', border: '1px solid #eee', background: '#fff', cursor: isFirst ? 'not-allowed' : 'pointer', opacity: isFirst ? 0.4 : 1 }}
                                    >
                                        <ArrowUp size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleMove(idx, 'down')}
                                        disabled={isLast}
                                        title="Descendre"
                                        style={{ padding: '7px', borderRadius: '8px', border: '1px solid #eee', background: '#fff', cursor: isLast ? 'not-allowed' : 'pointer', opacity: isLast ? 0.4 : 1 }}
                                    >
                                        <ArrowDown size={14} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        onClick={() => handleToggleActive(section)}
                                        disabled={togglingId === section.id}
                                        title={section.is_active ? 'Masquer' : 'Activer'}
                                        style={{ padding: '8px 10px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}
                                    >
                                        {section.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <Link
                                        to={`/sections/edit/${section.id}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', background: 'var(--primary)', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
                                    >
                                        <Edit2 size={13} /> Modifier
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(section.id)}
                                        disabled={deletingId === section.id}
                                        style={{ padding: '8px', borderRadius: '10px', background: '#fff5f5', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
