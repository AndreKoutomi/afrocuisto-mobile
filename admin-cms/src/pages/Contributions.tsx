import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    RefreshCw, Utensils, Calendar, ChevronRight,
    User, Mail, MapPin, Clock, ArrowLeft,
    CheckCircle2, XCircle, Search
} from 'lucide-react';

interface DishSuggestion {
    id: string;
    name: string;
    ingredients: string;
    description: string;
    region?: string;
    category?: string;
    cooking_time?: string;
    submitter_name?: string;
    submitter_email?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

function parseSuggestionDescription(description: string) {
    if (!description) return { mainDescription: '', extras: [] };
    const [mainDescription, extraBlock] = description.split('\n\n---\nInformations complémentaires\n');
    const extras = (extraBlock || '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    return {
        mainDescription: mainDescription?.trim() || '',
        extras,
    };
}

export function Contributions() {
    const [suggestions, setSuggestions] = useState<DishSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [processingAction, setProcessingAction] = useState<string | null>(null);

    useEffect(() => {
        fetchSuggestions();
    }, []);

    async function fetchSuggestions() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('dish_suggestions')
                .select('*')
                .order('created_at', { ascending: false });
            if (error && error.code !== '42P01') throw error;
            setSuggestions(data || []);
        } catch (err) {
            console.error('Erreur lors de la récupération des suggestions:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(id: string, action: 'approved' | 'rejected' | 'pending') {
        setProcessingAction(id);
        try {
            const { error } = await supabase
                .from('dish_suggestions')
                .update({ status: action })
                .eq('id', id);

            if (error) throw error;

            // Notification visuelle
            const messages = {
                approved: 'Suggestion approuvée !',
                rejected: 'Suggestion rejetée.',
                pending: 'Suggestion remise en attente.'
            };
            alert(messages[action]);

            // Rafraîchir localement
            setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: action } : s));
        } catch (err: any) {
            alert('Erreur: ' + err.message);
        } finally {
            setProcessingAction(null);
        }
    }

    const filtered = suggestions.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.submitter_name || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const selectedSuggestion = suggestions.find(s => s.id === selectedId);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #f3f4f6', borderTopColor: '#fb5607', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#9ca3af', fontWeight: 600, fontSize: 14 }}>Chargement des contributions...</p>
        </div>
    );

    // Vue Détaillée
    if (selectedSuggestion) {
        const parsed = parseSuggestionDescription(selectedSuggestion.description || '');
        return (
            <div style={{ paddingBottom: 60 }}>
                <button
                    onClick={() => setSelectedId(null)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#6b7280', fontSize: 14, fontWeight: 700,
                        marginBottom: 24, padding: 0
                    }}
                >
                    <ArrowLeft size={18} /> Retour à la liste
                </button>

                <div style={{ background: '#fff', borderRadius: 32, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                    {/* Header Détail */}
                    <div className="flex-responsive" style={{ padding: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                        <div>
                            <span style={{ fontSize: 11, fontWeight: 900, color: '#fb5607', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suggestion Reçue</span>
                            <h2 style={{ fontSize: 32, fontWeight: 900, margin: '8px 0 0', color: '#111827' }}>{selectedSuggestion.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, color: '#9ca3af', fontSize: 13, fontWeight: 600, flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> Reçu le {new Date(selectedSuggestion.created_at).toLocaleDateString('fr-FR')}</span>
                                {selectedSuggestion.region && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> {selectedSuggestion.region}</span>}
                            </div>
                        </div>
                        <div className="flex-responsive" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <button
                                disabled={!!processingAction || selectedSuggestion.status === 'pending'}
                                onClick={() => handleAction(selectedSuggestion.id, 'pending')}
                                style={{
                                    padding: '12px 24px', borderRadius: 16,
                                    background: selectedSuggestion.status === 'pending' ? '#f8fafc' : '#f1f5f9',
                                    color: selectedSuggestion.status === 'pending' ? '#475569' : '#64748b',
                                    border: 'none', fontWeight: 700, fontSize: 13,
                                    cursor: selectedSuggestion.status === 'pending' ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8
                                }}
                            >
                                {processingAction === selectedSuggestion.id ? '...' : <Clock size={16} />}
                                {selectedSuggestion.status === 'pending' ? 'En attente' : 'Mettre en attente'}
                            </button>
                            <button
                                disabled={!!processingAction || selectedSuggestion.status === 'approved'}
                                onClick={() => handleAction(selectedSuggestion.id, 'approved')}
                                style={{
                                    padding: '12px 24px', borderRadius: 16,
                                    background: selectedSuggestion.status === 'approved' ? '#f0fdf4' : '#f0f9ff',
                                    color: selectedSuggestion.status === 'approved' ? '#15803d' : '#0369a1',
                                    border: 'none', fontWeight: 700, fontSize: 13,
                                    cursor: selectedSuggestion.status === 'approved' ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8
                                }}
                            >
                                {processingAction === selectedSuggestion.id ? '...' : <CheckCircle2 size={16} />}
                                {selectedSuggestion.status === 'approved' ? 'Approuvé' : 'Approuver'}
                            </button>
                            <button
                                disabled={!!processingAction || selectedSuggestion.status === 'rejected'}
                                onClick={() => handleAction(selectedSuggestion.id, 'rejected')}
                                style={{
                                    padding: '12px 24px', borderRadius: 16,
                                    background: selectedSuggestion.status === 'rejected' ? '#fff1f2' : '#fef2f2',
                                    color: selectedSuggestion.status === 'rejected' ? '#be123c' : '#991b1b',
                                    border: 'none', fontWeight: 700, fontSize: 13,
                                    cursor: selectedSuggestion.status === 'rejected' ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8
                                }}
                            >
                                {processingAction === selectedSuggestion.id ? '...' : <XCircle size={16} />}
                                {selectedSuggestion.status === 'rejected' ? 'Rejeté' : 'Rejeter'}
                            </button>
                        </div>
                    </div>

                    <div className="grid-form-layout" style={{ padding: '24px 40px 40px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40 }}>
                        {/* Colonne Gauche : Contenu */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                            <section>
                                <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 12, letterSpacing: '0.05em' }}>Description du plat</h4>
                                <p style={{ fontSize: 16, lineHeight: 1.8, color: '#374151', margin: 0 }}>{parsed.mainDescription || 'Aucune description fournie.'}</p>
                            </section>

                            <section>
                                <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 16, letterSpacing: '0.05em' }}>Ingrédients proposés</h4>
                                <div style={{ background: '#f9fafb', padding: 24, borderRadius: 24, border: '1px solid #f3f4f6' }}>
                                    <p style={{ fontSize: 15, lineHeight: 1.6, color: '#1f2937', margin: 0, whiteSpace: 'pre-wrap' }}>{selectedSuggestion.ingredients}</p>
                                </div>
                            </section>
                        </div>

                        {/* Colonne Droite : Infos Submitter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ background: '#fdfdff', padding: 24, borderRadius: 24, border: '1.5px solid #ececf3' }}>
                                <h4 style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#6366f1', marginBottom: 20 }}>Auteur de la suggestion</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#6366f115', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>Nom complet</p>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>{selectedSuggestion.submitter_name || 'Anonyme'}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#6366f115', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>Email</p>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>{selectedSuggestion.submitter_email || 'Non renseigné'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: 24, borderRadius: 24, border: '1px solid #f1f5f9' }}>
                                <h4 style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#475569', marginBottom: 20 }}>Détails techniques</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {selectedSuggestion.category && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#64748b' }}>Catégorie</span><span style={{ fontWeight: 700, color: '#1e293b' }}>{selectedSuggestion.category}</span></div>}
                                    {selectedSuggestion.cooking_time && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#64748b' }}>Temps de prép</span><span style={{ fontWeight: 700, color: '#1e293b' }}>{selectedSuggestion.cooking_time}</span></div>}
                                    {selectedSuggestion.region && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#64748b' }}>Région d'origine</span><span style={{ fontWeight: 700, color: '#1e293b' }}>{selectedSuggestion.region}</span></div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="flex-responsive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 28 }}>
                <button
                    onClick={fetchSuggestions}
                    style={{
                        width: 44, height: 44, borderRadius: 14,
                        border: '1.5px solid #e5e7eb', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#6b7280', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Toolbar avec Recherche et Filtres */}
            <div className="flex-responsive" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par nom ou auteur..."
                        style={{
                            width: '100%', height: '48px', borderRadius: '16px',
                            border: '1.5px solid #e5e7eb', background: '#fff',
                            paddingLeft: '42px', paddingRight: '16px',
                            fontSize: '14px', fontWeight: 500, outline: 'none',
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap' }}>
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            style={{
                                padding: '0 16px', height: '48px', borderRadius: '16px',
                                border: '1.5px solid #e5e7eb',
                                background: filterStatus === status ? '#fb560710' : '#fff',
                                color: filterStatus === status ? '#fb5607' : '#6b7280',
                                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                transition: 'all 0.2s', textTransform: 'capitalize',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {status === 'all' ? 'Toutes' :
                                status === 'pending' ? 'En attente' :
                                    status === 'approved' ? 'Approuvées' : 'Rejetées'}
                        </button>
                    ))}
                </div>
            </div>

            {suggestions.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 32, padding: 80, border: '1px dashed #e5e7eb', textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb5607', margin: '0 auto 20px' }}>
                        <Utensils size={32} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>Aucune contribution</h3>
                    <p style={{ color: '#9ca3af', maxWidth: 350, margin: '8px auto' }}>Les plats suggérés par vos utilisateurs apparaîtront ici pour validation.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {filtered.map((suggestion) => (
                        <div
                            key={suggestion.id}
                            className="list-item-responsive"
                            style={{
                                background: '#fff', borderRadius: 24, border: '1px solid #f0f0f0',
                                padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 24,
                                transition: 'all 0.2s ease', cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                            }}
                            onClick={() => setSelectedId(suggestion.id)}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fb560744'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#f0f0f0'}
                        >
                            <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fb560710', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb5607', flexShrink: 0 }}>
                                <Utensils size={24} />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{suggestion.name}</h4>
                                    {suggestion.region && <span style={{ padding: '2px 8px', borderRadius: 6, background: '#f8fafc', fontSize: 10, fontWeight: 700, color: '#64748b' }}>{suggestion.region}</span>}
                                    <span style={{
                                        padding: '2px 8px', borderRadius: 6,
                                        background: suggestion.status === 'approved' ? '#f0fdf4' : suggestion.status === 'rejected' ? '#fff1f2' : '#f9fafb',
                                        fontSize: '9px', fontWeight: 800,
                                        color: suggestion.status === 'approved' ? '#166534' : suggestion.status === 'rejected' ? '#991b1b' : '#64748b',
                                        textTransform: 'uppercase'
                                    }}>
                                        {suggestion.status === 'approved' ? 'Approuvée' : suggestion.status === 'rejected' ? 'Rejetée' : 'En attente'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#9ca3af' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}><User size={13} /> {suggestion.submitter_name || 'Anonyme'}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} /> {new Date(suggestion.created_at).toLocaleDateString('fr-FR')}</span>
                                </div>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedId(suggestion.id); }}
                                className="mobile-full-width"
                                style={{
                                    padding: '10px 20px', borderRadius: 12, border: '1px solid #e5e7eb',
                                    background: '#fff', color: '#111827', fontSize: 13, fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                    transition: 'all 0.2s', justifyContent: 'center'
                                }}
                            >
                                Voir la suggestion <ChevronRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
