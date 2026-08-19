/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Permet à l'administrateur de consulter, filtrer et gérer
 * les rapports de bugs envoyés par les utilisateurs depuis l'app mobile.
 *
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel.
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers.
 * ============================================================================
 */

import { useEffect, useState, useMemo } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import {
    Bug, CheckCircle2, Clock, XCircle,
    RefreshCw, Search, Filter, ChevronDown, Trash2,
    Smartphone, Calendar, Tag, Layers, Info,
    TrendingUp, ShieldAlert
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface BugReport {
    id: string;
    user_id: string | null;
    user_name: string;
    user_email: string;
    title: string;
    description: string;
    steps_to_reproduce: string | null;
    severity: 'Bloquant' | 'Majeur' | 'Mineur' | 'Cosmétique';
    category: string;
    status: 'Nouveau' | 'En cours' | 'Résolu' | 'Fermé';
    device_info: string | null;
    app_version: string | null;
    created_at: string;
    updated_at: string | null;
    screenshot: string | null;
}

// ── Helpers visuels ──────────────────────────────────────────────────────────

const SEVERITY_STYLE: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    Bloquant:   { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', dot: '#ef4444' },
    Majeur:     { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', dot: '#f97316' },
    Mineur:     { bg: '#fffbeb', border: '#fcd34d', text: '#b45309', dot: '#fbbf24' },
    Cosmétique: { bg: '#f0f9ff', border: '#7dd3fc', text: '#0369a1', dot: '#38bdf8' },
};

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    Nouveau:    { bg: '#f0f9ff', border: '#7dd3fc', text: '#0369a1', icon: <Clock size={12} /> },
    'En cours': { bg: '#fffbeb', border: '#fcd34d', text: '#b45309', icon: <RefreshCw size={12} /> },
    Résolu:     { bg: '#f0fdf4', border: '#86efac', text: '#15803d', icon: <CheckCircle2 size={12} /> },
    Fermé:      { bg: '#f9fafb', border: '#d1d5db', text: '#6b7280', icon: <XCircle size={12} /> },
};

function getInitials(name: string) {
    return name?.trim()?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
}

function getAvatarGradient(name: string) {
    const palettes = [
        ['#fb5607', '#ff8c42'], ['#059669', '#34d399'],
        ['#7c3aed', '#a78bfa'], ['#0891b2', '#22d3ee'],
        ['#db2777', '#f472b6'], ['#d97706', '#fbbf24'],
    ];
    const idx = (name?.charCodeAt(0) || 0) % palettes.length;
    return `linear-gradient(135deg, ${palettes[idx][0]}, ${palettes[idx][1]})`;
}

// ── Composant principal ──────────────────────────────────────────────────────

export function Bugs() {
    const [bugs, setBugs] = useState<BugReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<BugReport | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterSeverity, setFilterSeverity] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date' | 'severity'>('date');

    useEffect(() => { fetchBugs(); }, []);

    async function fetchBugs() {
        setLoading(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('bug_reports')
                .select('*')
                .order('created_at', { ascending: false });
            if (error && error.code !== '42P01') throw error;
            setBugs(data || []);
        } catch (err) {
            console.error('Erreur chargement bugs:', err);
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus(id: string, status: BugReport['status']) {
        setUpdatingId(id);
        try {
            const { error } = await supabaseAdmin
                .from('bug_reports')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            setBugs(prev => prev.map(b => b.id === id ? { ...b, status, updated_at: new Date().toISOString() } : b));
            if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
        } catch {
            alert('Erreur lors de la mise à jour du statut.');
        } finally {
            setUpdatingId(null);
        }
    }

    async function deleteBug(id: string) {
        if (!confirm('Supprimer définitivement ce rapport de bug ?')) return;
        setDeletingId(id);
        try {
            const { error } = await supabaseAdmin.from('bug_reports').delete().eq('id', id);
            if (error) throw error;
            setBugs(prev => prev.filter(b => b.id !== id));
            if (selected?.id === id) setSelected(null);
        } catch {
            alert('Erreur lors de la suppression.');
        } finally {
            setDeletingId(null);
        }
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    const stats = useMemo(() => ({
        total: bugs.length,
        nouveaux: bugs.filter(b => b.status === 'Nouveau').length,
        enCours: bugs.filter(b => b.status === 'En cours').length,
        resolus: bugs.filter(b => b.status === 'Résolu').length,
        bloquants: bugs.filter(b => b.severity === 'Bloquant').length,
    }), [bugs]);

    // ── Filtrage ──────────────────────────────────────────────────────────────
    const SEVERITY_ORDER: Record<string, number> = { Bloquant: 0, Majeur: 1, Mineur: 2, Cosmétique: 3 };

    const filtered = useMemo(() => {
        let list = [...bugs];
        if (filterStatus !== 'all') list = list.filter(b => b.status === filterStatus);
        if (filterSeverity !== 'all') list = list.filter(b => b.severity === filterSeverity);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(b =>
                b.title?.toLowerCase().includes(q) ||
                b.user_name?.toLowerCase().includes(q) ||
                b.description?.toLowerCase().includes(q) ||
                b.category?.toLowerCase().includes(q)
            );
        }
        if (sortBy === 'severity') {
            list.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99));
        }
        return list;
    }, [bugs, filterStatus, filterSeverity, search, sortBy]);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #f3f4f6', borderTopColor: '#fb5607', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#9ca3af', fontWeight: 600, fontSize: 14 }}>Chargement des rapports de bugs...</p>
        </div>
    );

    return (
        <div style={{ width: '100%', boxSizing: 'border-box', paddingBottom: 60 }}>

            {/* ══ STATS CARDS ══════════════════════════════════════════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>

                {/* Total */}
                <div style={{
                    background: 'linear-gradient(135deg, #fb5607 0%, #ff8c42 100%)',
                    borderRadius: 24, padding: '22px 20px',
                    color: '#fff', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(251,86,7,0.25)',
                }}>
                    <div style={{ position: 'absolute', right: -16, top: -16, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.6)' }}>Total bugs</p>
                    <span style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: '-1px' }}>{stats.total}</span>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>signalements</p>
                </div>

                {/* Nouveaux */}
                <div style={{ background: '#fff', borderRadius: 24, padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={16} color="#0369a1" />
                        </div>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Nouveaux</p>
                    </div>
                    <span style={{ fontSize: 38, fontWeight: 900, color: '#0369a1', letterSpacing: '-1px', lineHeight: 1 }}>{stats.nouveaux}</span>
                </div>

                {/* En cours */}
                <div style={{ background: '#fff', borderRadius: 24, padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RefreshCw size={16} color="#b45309" />
                        </div>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px' }}>En cours</p>
                    </div>
                    <span style={{ fontSize: 38, fontWeight: 900, color: '#b45309', letterSpacing: '-1px', lineHeight: 1 }}>{stats.enCours}</span>
                </div>

                {/* Résolus */}
                <div style={{ background: '#fff', borderRadius: 24, padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={16} color="#15803d" />
                        </div>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Résolus</p>
                    </div>
                    <span style={{ fontSize: 38, fontWeight: 900, color: '#15803d', letterSpacing: '-1px', lineHeight: 1 }}>{stats.resolus}</span>
                </div>

                {/* Bloquants */}
                <div style={{ background: '#fff', borderRadius: 24, padding: '20px', border: '1.5px solid #fca5a5', boxShadow: '0 1px 8px rgba(239,68,68,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldAlert size={16} color="#dc2626" />
                        </div>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Bloquants</p>
                    </div>
                    <span style={{ fontSize: 38, fontWeight: 900, color: '#dc2626', letterSpacing: '-1px', lineHeight: 1 }}>{stats.bloquants}</span>
                </div>
            </div>

            {/* ══ TOOLBAR ══════════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ flex: 1, minWidth: 200, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: 14 }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par titre, utilisateur, catégorie..."
                        style={{ width: '100%', height: 44, borderRadius: 14, border: '1.5px solid #e5e7eb', background: '#fff', paddingLeft: 40, paddingRight: 16, fontSize: 13, fontWeight: 500, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
                    />
                </div>

                {/* Statut pills */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <Filter size={14} color="#9ca3af" />
                    {(['all', 'Nouveau', 'En cours', 'Résolu', 'Fermé'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            style={{
                                height: 36, borderRadius: 99, border: '1.5px solid',
                                padding: '0 12px', cursor: 'pointer',
                                fontSize: 12, fontWeight: 800, transition: 'all 0.15s',
                                borderColor: filterStatus === s ? '#fb5607' : '#e5e7eb',
                                background: filterStatus === s ? '#fb5607' : '#fff',
                                color: filterStatus === s ? '#fff' : '#6b7280',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {s === 'all' ? 'Tous' : s}
                        </button>
                    ))}
                </div>

                {/* Sévérité */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <select
                        value={filterSeverity}
                        onChange={e => setFilterSeverity(e.target.value)}
                        style={{ height: 44, borderRadius: 14, border: '1.5px solid #e5e7eb', background: '#fff', padding: '0 36px 0 14px', fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer', outline: 'none', appearance: 'none' }}
                    >
                        <option value="all">Toutes sévérités</option>
                        <option value="Bloquant">🔴 Bloquant</option>
                        <option value="Majeur">🟠 Majeur</option>
                        <option value="Mineur">🟡 Mineur</option>
                        <option value="Cosmétique">🔵 Cosmétique</option>
                    </select>
                    <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                {/* Sort */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                        style={{ height: 44, borderRadius: 14, border: '1.5px solid #e5e7eb', background: '#fff', padding: '0 36px 0 14px', fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer', outline: 'none', appearance: 'none' }}
                    >
                        <option value="date">Plus récents</option>
                        <option value="severity">Par sévérité</option>
                    </select>
                    <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                {/* Refresh */}
                <button
                    onClick={fetchBugs}
                    title="Actualiser"
                    style={{ width: 44, height: 44, borderRadius: 14, border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', flexShrink: 0 }}
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* ══ LAYOUT LISTE + PANEL DÉTAIL ══════════════════════════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 20, alignItems: 'start' }}>

                {/* ── Liste des bugs ── */}
                <div>
                    {filtered.length === 0 ? (
                        <div style={{ background: '#fff', borderRadius: 32, padding: 80, textAlign: 'center', border: '1px dashed #e5e7eb' }}>
                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <Bug size={32} color="#d1d5db" />
                            </div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>
                                {bugs.length === 0 ? 'Aucun rapport de bug' : 'Aucun résultat'}
                            </h3>
                            <p style={{ color: '#9ca3af', fontSize: 14, maxWidth: 380, margin: '0 auto' }}>
                                {bugs.length === 0
                                    ? 'Les bugs signalés depuis l\'app mobile apparaîtront ici.'
                                    : 'Aucun bug ne correspond à vos filtres.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 16 }}>
                                {filtered.length} rapport{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {filtered.map(bug => {
                                    const sev = SEVERITY_STYLE[bug.severity] || SEVERITY_STYLE.Mineur;
                                    const sta = STATUS_STYLE[bug.status] || STATUS_STYLE.Nouveau;
                                    const isSelected = selected?.id === bug.id;
                                    return (
                                        <div
                                            key={bug.id}
                                            onClick={() => setSelected(isSelected ? null : bug)}
                                            style={{
                                                background: '#fff',
                                                borderRadius: 20,
                                                border: `1.5px solid ${isSelected ? '#fb5607' : '#f0f0f0'}`,
                                                boxShadow: isSelected ? '0 4px 24px rgba(251,86,7,0.12)' : '0 1px 6px rgba(0,0,0,0.04)',
                                                padding: '18px 20px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 16,
                                            }}
                                            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
                                            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)'; }}
                                        >
                                            {/* Dot sévérité */}
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: sev.dot, flexShrink: 0 }} />

                                            {/* Avatar */}
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                                                background: getAvatarGradient(bug.user_name),
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 13, fontWeight: 900, color: '#fff',
                                            }}>
                                                {getInitials(bug.user_name)}
                                            </div>

                                            {/* Contenu principal */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {bug.title}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{bug.user_name}</span>
                                                    <span style={{ color: '#e5e7eb' }}>·</span>
                                                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{bug.category}</span>
                                                    <span style={{ color: '#e5e7eb' }}>·</span>
                                                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                                                        {new Date(bug.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Badges */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                                                    background: sev.bg, border: `1px solid ${sev.border}`, color: sev.text,
                                                    textTransform: 'uppercase', letterSpacing: '0.4px',
                                                }}>
                                                    {bug.severity}
                                                </span>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                                                    background: sta.bg, border: `1px solid ${sta.border}`, color: sta.text,
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                }}>
                                                    {sta.icon}{bug.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Panel Détail ── */}
                {selected && (() => {
                    const sev = SEVERITY_STYLE[selected.severity] || SEVERITY_STYLE.Mineur;
                    const sta = STATUS_STYLE[selected.status] || STATUS_STYLE.Nouveau;
                    return (
                        <div style={{
                            background: '#fff', borderRadius: 28,
                            border: '1px solid #f0f0f0',
                            boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
                            overflow: 'hidden auto',
                            maxHeight: 'calc(100vh - 40px)',
                            position: 'sticky', top: 20,
                        }}>
                            {/* Header */}
                            <div style={{
                                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                                padding: '24px 24px 20px',
                                color: '#fff',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 99, background: sev.bg, color: sev.text, border: `1px solid ${sev.border}` }}>
                                            {selected.severity}
                                        </span>
                                        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 99, background: sta.bg, color: sta.text, border: `1px solid ${sta.border}`, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {sta.icon}{selected.status}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => deleteBug(selected.id)}
                                        disabled={deletingId === selected.id}
                                        style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Supprimer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, lineHeight: 1.3, color: '#fff' }}>{selected.title}</h2>
                            </div>

                            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                                {/* Utilisateur */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: getAvatarGradient(selected.user_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                                        {getInitials(selected.user_name)}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#111827' }}>{selected.user_name}</p>
                                        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{selected.user_email}</p>
                                    </div>
                                </div>

                                {/* Méta-infos */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {[
                                        { icon: <Tag size={13} color="#fb5607" />, label: 'Catégorie', value: selected.category },
                                        { icon: <Calendar size={13} color="#fb5607" />, label: 'Date', value: new Date(selected.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
                                        { icon: <Smartphone size={13} color="#fb5607" />, label: 'Appareil', value: selected.device_info || 'N/A' },
                                        { icon: <Layers size={13} color="#fb5607" />, label: 'Version app', value: selected.app_version || 'N/A' },
                                    ].map(({ icon, label, value }) => (
                                        <div key={label} style={{ background: '#f9fafb', borderRadius: 14, padding: '10px 12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                                                {icon}
                                                <span style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#374151', wordBreak: 'break-word' }}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Description */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                        <Info size={14} color="#6b7280" />
                                        <span style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#374151', lineHeight: 1.7, background: '#f9fafb', borderRadius: 14, padding: '12px 14px' }}>
                                        {selected.description}
                                    </p>
                                </div>

                                {/* Étapes de reproduction */}
                                {selected.steps_to_reproduce && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                            <TrendingUp size={14} color="#6b7280" />
                                            <span style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Étapes pour reproduire</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#374151', lineHeight: 1.7, background: '#fffbeb', borderRadius: 14, padding: '12px 14px', borderLeft: '3px solid #fcd34d' }}>
                                            {selected.steps_to_reproduce}
                                        </p>
                                    </div>
                                )}

                                {/* Capture d'écran */}
                                {selected.screenshot && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                            <Info size={14} color="#6b7280" />
                                            <span style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capture d'écran jointe</span>
                                        </div>
                                        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#111827' }}>
                                            <a href={selected.screenshot} target="_blank" rel="noopener noreferrer" title="Cliquer pour agrandir">
                                                <img src={selected.screenshot} alt="Capture d'écran du bug" style={{ width: '100%', maxHeight: 350, objectFit: 'contain', display: 'block', cursor: 'zoom-in' }} />
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Changer le statut */}
                                <div>
                                    <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mettre à jour le statut</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {(['Nouveau', 'En cours', 'Résolu', 'Fermé'] as const).map(status => {
                                            const s = STATUS_STYLE[status];
                                            const isActive = selected.status === status;
                                            const isUpdating = updatingId === selected.id;
                                            return (
                                                <button
                                                    key={status}
                                                    onClick={() => updateStatus(selected.id, status)}
                                                    disabled={isActive || isUpdating}
                                                    style={{
                                                        height: 40, borderRadius: 12, border: `1.5px solid ${isActive ? s.border : '#e5e7eb'}`,
                                                        background: isActive ? s.bg : '#fff',
                                                        color: isActive ? s.text : '#6b7280',
                                                        fontSize: 12, fontWeight: 800,
                                                        cursor: isActive ? 'default' : 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                        transition: 'all 0.15s',
                                                        opacity: isUpdating ? 0.6 : 1,
                                                    }}
                                                >
                                                    {s.icon}{status}
                                                    {isActive && <span style={{ fontSize: 10 }}>✓</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
