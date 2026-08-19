/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Permet de consulter et lire les commentaires et notes laissées par les utilisateurs sur les différentes recettes.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
    Star, MessageSquare, Trash2, Calendar, Utensils,
    RefreshCw, TrendingUp, Filter, Search, ChevronDown,
    Award, AlertCircle, Quote
} from 'lucide-react';

interface Review {
    id: string;
    recipe_id: string;
    recipe_name: string;
    user_id: string;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

const RATING_COLORS: Record<number, { bg: string; border: string; text: string; label: string }> = {
    5: { bg: '#f0fdf4', border: '#86efac', text: '#15803d', label: 'Excellent' },
    4: { bg: '#f0f9ff', border: '#7dd3fc', text: '#0369a1', label: 'Très bien' },
    3: { bg: '#fffbeb', border: '#fcd34d', text: '#b45309', label: 'Correct' },
    2: { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', label: 'Décevant' },
    1: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', label: 'Mauvais' },
};

function getInitials(name: string) {
    return name?.trim()?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
}

function getAvatarGradient(name: string) {
    const palettes = [
        ['#fb5607', '#ff8c42'], ['#F94D00', '#ff8c42'],
        ['#059669', '#34d399'], ['#d97706', '#fbbf24'],
        ['#7c3aed', '#a78bfa'], ['#0891b2', '#22d3ee'],
        ['#db2777', '#f472b6'], ['#65a30d', '#a3e635'],
    ];
    const idx = (name?.charCodeAt(0) || 0) % palettes.length;
    return `linear-gradient(135deg, ${palettes[idx][0]}, ${palettes[idx][1]})`;
}

export function Feedback() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterRating, setFilterRating] = useState<number | 'all'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'rating_desc' | 'rating_asc'>('date');

    useEffect(() => { fetchReviews(); }, []);

    async function fetchReviews() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false });
            if (error && error.code !== '42P01') throw error;
            setReviews(data || []);
        } catch (err) {
            console.error('Erreur retours:', err);
        } finally {
            setLoading(false);
        }
    }

    async function deleteReview(id: string) {
        if (!confirm('Supprimer définitivement cet avis ?')) return;
        setDeleting(id);
        try {
            const { error } = await supabase.from('reviews').delete().eq('id', id);
            if (error) throw error;
            setReviews(prev => prev.filter(r => r.id !== id));
        } catch {
            alert('Erreur lors de la suppression.');
        } finally {
            setDeleting(null);
        }
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = reviews.length;
        const avg = total > 0
            ? (reviews.reduce((s, r) => s + r.rating, 0) / total)
            : 0;
        const dist = [5, 4, 3, 2, 1].map(n => ({
            rating: n,
            count: reviews.filter(r => r.rating === n).length,
            pct: total > 0 ? Math.round((reviews.filter(r => r.rating === n).length / total) * 100) : 0,
        }));
        const topRecipe = reviews.length > 0
            ? Object.entries(
                reviews.reduce((acc, r) => {
                    acc[r.recipe_name] = (acc[r.recipe_name] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>)
            ).sort((a, b) => b[1] - a[1])[0]
            : null;
        return { total, avg, dist, topRecipe };
    }, [reviews]);

    // ── Filtered + Sorted ─────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = [...reviews];
        if (filterRating !== 'all') list = list.filter(r => r.rating === filterRating);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(r =>
                r.user_name?.toLowerCase().includes(q) ||
                r.recipe_name?.toLowerCase().includes(q) ||
                r.comment?.toLowerCase().includes(q)
            );
        }
        if (sortBy === 'rating_desc') list.sort((a, b) => b.rating - a.rating);
        else if (sortBy === 'rating_asc') list.sort((a, b) => a.rating - b.rating);
        // else: already sorted by date from supabase
        return list;
    }, [reviews, filterRating, search, sortBy]);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #f3f4f6', borderTopColor: '#fb5607', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#9ca3af', fontWeight: 600, fontSize: 14 }}>Chargement des retours clients...</p>
        </div>
    );

    return (
        <div style={{ width: '100%', boxSizing: 'border-box', paddingBottom: 60 }}>

            {/* ══ HERO STATS ══════════════════════════════════════════════════ */}
            <div className="grid-responsive-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, marginBottom: 28 }}>

                {/* Score global */}
                <div style={{
                    gridColumn: 'span 1',
                    background: 'linear-gradient(135deg, #fb5607 0%, #ff8c42 60%, #ffa552 100%)',
                    borderRadius: 28, padding: '28px 24px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                    color: '#fff', position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ position: 'absolute', right: 20, bottom: -30, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.55)' }}>Score Global</p>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: 16 }}>
                            <span style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, letterSpacing: '-2px' }}>
                                {stats.avg > 0 ? stats.avg.toFixed(1) : '—'}
                            </span>
                            {stats.avg > 0 && <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', paddingBottom: 8 }}>/ 5</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= Math.round(stats.avg) ? '#fbbf24' : 'rgba(255,255,255,0.15)' }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Total avis */}
                <div style={{ background: '#fff', borderRadius: 28, padding: '24px', border: '1px solid #f0f0f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff5f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageSquare size={18} color="#fb5607" />
                        </div>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Avis reçus</p>
                    </div>
                    <span style={{ fontSize: 42, fontWeight: 900, color: '#111827', letterSpacing: '-1px', lineHeight: 1 }}>{stats.total}</span>
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
                        {stats.total === 0 ? 'Aucun avis' : `${reviews.filter(r => r.comment).length} avec commentaire`}
                    </p>
                </div>

                {/* Top plat */}
                <div style={{ background: '#fff', borderRadius: 28, padding: '24px', border: '1px solid #f0f0f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Award size={18} color="#fb5607" />
                        </div>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Plat le + évalué</p>
                    </div>
                    {stats.topRecipe ? (
                        <>
                            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111827', lineHeight: 1.25 }}>{stats.topRecipe[0]}</p>
                            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{stats.topRecipe[1]} avis</p>
                        </>
                    ) : (
                        <p style={{ margin: 0, fontSize: 14, color: '#d1d5db', fontStyle: 'italic' }}>—</p>
                    )}
                </div>

                {/* Distribution */}
                <div style={{ background: '#fff', borderRadius: 28, padding: '24px', border: '1px solid #f0f0f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={18} color="#d97706" />
                        </div>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Distribution</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {stats.dist.map(({ rating, count, pct }) => (
                            <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', width: 8, textAlign: 'right', flexShrink: 0 }}>{rating}</span>
                                <Star size={10} color="#fbbf24" fill="#fbbf24" style={{ flexShrink: 0 }} />
                                <div style={{ flex: 1, height: 6, borderRadius: 99, background: '#f3f4f6', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: rating >= 4 ? '#fb5607' : rating === 3 ? '#fbbf24' : '#ef4444', transition: 'width 0.6s ease' }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', width: 26, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ TOOLBAR ═════════════════════════════════════════════════════ */}
            <div className="flex-responsive" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                {/* Search */}
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: 14 }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par utilisateur, plat ou commentaire..."
                        style={{ width: '100%', height: 44, borderRadius: 14, border: '1.5px solid #e5e7eb', background: '#fff', paddingLeft: 40, paddingRight: 16, fontSize: 13, fontWeight: 500, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
                    />
                </div>

                {/* Rating filter pills */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', overflowX: 'auto', paddingBottom: '4px' }}>
                    <Filter size={14} color="#9ca3af" />
                    {(['all', 5, 4, 3, 2, 1] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => setFilterRating(r)}
                            style={{
                                height: 36, borderRadius: 99, border: '1.5px solid',
                                padding: '0 12px', cursor: 'pointer',
                                fontSize: 12, fontWeight: 800, transition: 'all 0.15s',
                                borderColor: filterRating === r ? '#fb5607' : '#e5e7eb',
                                background: filterRating === r ? '#fb5607' : '#fff',
                                color: filterRating === r ? '#fff' : '#6b7280',
                                display: 'flex', alignItems: 'center', gap: 4,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {r === 'all' ? 'Tous' : <><Star size={10} fill="currentColor" />{r}</>}
                        </button>
                    ))}
                </div>

                <div className="flex-responsive" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Sort */}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            style={{ height: 44, borderRadius: 14, border: '1.5px solid #e5e7eb', background: '#fff', padding: '0 36px 0 14px', fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer', outline: 'none', appearance: 'none' }}
                        >
                            <option value="date">Plus récents</option>
                            <option value="rating_desc">Meilleures notes</option>
                            <option value="rating_asc">Notes basses</option>
                        </select>
                        <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={fetchReviews}
                        title="Actualiser"
                        style={{ width: 44, height: 44, borderRadius: 14, border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', flexShrink: 0 }}
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* ══ REVIEWS ═════════════════════════════════════════════════════ */}
            {filtered.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 32, padding: 80, textAlign: 'center', border: '1px dashed #e5e7eb' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        {reviews.length === 0
                            ? <MessageSquare size={32} color="#d1d5db" />
                            : <AlertCircle size={32} color="#d1d5db" />
                        }
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>
                        {reviews.length === 0 ? 'Aucun retour pour le moment' : 'Aucun résultat'}
                    </h3>
                    <p style={{ color: '#9ca3af', fontSize: 14, maxWidth: 380, margin: '0 auto' }}>
                        {reviews.length === 0
                            ? 'Les avis laissés par les utilisateurs depuis l\'application mobile apparaîtront ici.'
                            : `Aucun avis ne correspond à vos filtres actuels.`
                        }
                    </p>
                </div>
            ) : (
                <>
                    <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 16 }}>
                        {filtered.length} avis affiché{filtered.length > 1 ? 's' : ''}
                        {filterRating !== 'all' && ` · Note : ${filterRating}★`}
                        {search && ` · "${search}"`}
                    </p>
                    <div className="grid-responsive-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                        {filtered.map(review => {
                            const rc = RATING_COLORS[review.rating] || RATING_COLORS[3];
                            const isDeleting = deleting === review.id;
                            return (
                                <div
                                    key={review.id}
                                    style={{
                                        background: '#fff', borderRadius: 28,
                                        border: '1px solid #f0f0f0',
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                                        display: 'flex', flexDirection: 'column',
                                        overflow: 'hidden',
                                        transition: 'box-shadow 0.2s, transform 0.2s',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                                >
                                    {/* Top accent bar */}
                                    <div style={{ height: 4, background: `linear-gradient(90deg, ${rc.border}, ${rc.text}20)` }} />

                                    <div style={{ padding: '20px 22px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                                        {/* Header: stars + delete */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <div style={{ display: 'flex', gap: 3 }}>
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <Star
                                                            key={i} size={16}
                                                            fill={i <= review.rating ? '#fbbf24' : 'none'}
                                                            color={i <= review.rating ? '#fbbf24' : '#e5e7eb'}
                                                            strokeWidth={1.5}
                                                        />
                                                    ))}
                                                </div>
                                                <span style={{
                                                    display: 'inline-block', fontSize: 10, fontWeight: 800,
                                                    padding: '3px 10px', borderRadius: 99,
                                                    background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text,
                                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                                }}>
                                                    {rc.label}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => deleteReview(review.id)}
                                                disabled={isDeleting}
                                                style={{
                                                    width: 34, height: 34, borderRadius: '50%', border: 'none',
                                                    background: isDeleting ? '#fef2f2' : '#f9fafb',
                                                    color: isDeleting ? '#ef4444' : '#d1d5db',
                                                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.15s', flexShrink: 0,
                                                }}
                                                onMouseEnter={e => { if (!isDeleting) { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; } }}
                                                onMouseLeave={e => { if (!isDeleting) { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; (e.currentTarget as HTMLElement).style.color = '#d1d5db'; } }}
                                                title="Supprimer"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>

                                        {/* Comment */}
                                        <div style={{ flex: 1, marginBottom: 20, position: 'relative', paddingLeft: 20 }}>
                                            <Quote size={16} color="#e5e7eb" style={{ position: 'absolute', left: 0, top: 0 }} />
                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: review.comment ? '#374151' : '#d1d5db', lineHeight: 1.65, fontStyle: review.comment ? 'normal' : 'italic' }}>
                                                {review.comment || 'Aucun commentaire laissé'}
                                            </p>
                                        </div>

                                        {/* Footer */}
                                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {/* Recipe */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 30, height: 30, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Utensils size={13} color="#fb5607" />
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plat évalué</p>
                                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{review.recipe_name}</p>
                                                </div>
                                            </div>

                                            {/* User + Date */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{
                                                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                                        background: getAvatarGradient(review.user_name),
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 10, fontWeight: 900, color: '#fff',
                                                    }}>
                                                        {getInitials(review.user_name)}
                                                    </div>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{review.user_name}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af' }}>
                                                    <Calendar size={11} />
                                                    <span style={{ fontSize: 11, fontWeight: 600 }}>
                                                        {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )
            }
        </div >
    );
}
