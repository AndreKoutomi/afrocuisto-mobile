/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Le gestionnaire des comptes utilisateurs. Affiche les personnes inscrites sur l'application.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Edit2, ShieldAlert, ShieldCheck, UserPlus, MoreHorizontal,
    History, CreditCard, Activity, Trash2, X, Users,
    Search, Mail, Check, Copy, Heart, RefreshCw
} from 'lucide-react';

interface UserProfile {
    id: string;
    name?: string;
    email?: string;
    language?: string;
    dark_mode?: boolean;
    joined_date?: string;
    updated_at?: string;
    favorites?: string[];
    shopping_list?: any[];
    avatar?: string;
    is_banned?: boolean;
    last_sign_in?: string;
}

export function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'favorites'>('date');
    const [copied, setCopied] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Modern Management State
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'history' | 'transactions'>('info');

    // Form State for new/edit user
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        setError(null);
        try {
            // 1. Récupérer les profils (données de l'app)
            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('*');

            if (profilesError && profilesError.code !== '42P01') {
                console.warn('Erreur non critique profiles:', profilesError.message);
            }

            // 2. Récupérer les comptes Auth (la source de vérité pour l'inscription)
            const { data: authData, error: authError } = await (supabase.auth.admin as any).listUsers();

            if (authError) throw authError;

            const authUsers = authData?.users || [];
            const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

            // 3. Fusionner les données
            const mergedUsers: UserProfile[] = authUsers.map((au: any) => {
                const profile = profilesMap.get(au.id);
                return {
                    id: au.id,
                    email: au.email,
                    name: profile?.name || au.user_metadata?.full_name || 'Utilisateur',
                    language: profile?.language || 'fr',
                    dark_mode: profile?.dark_mode || false,
                    joined_date: profile?.joined_date || au.created_at,
                    updated_at: profile?.updated_at || au.updated_at,
                    favorites: profile?.favorites || [],
                    shopping_list: profile?.shopping_list || [],
                    avatar: profile?.avatar || au.user_metadata?.avatar_url,
                    is_banned: !!au.banned_until || au.user_metadata?.banned === true,
                    last_sign_in: au.last_sign_in_at
                };
            });

            setUsers(mergedUsers);
        } catch (err: any) {
            console.error('Erreur chargement utilisateurs:', err);
            setError(err.message || 'Erreur lors du chargement des utilisateurs.');
        } finally {
            setLoading(false);
        }
    }

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const { data, error: authError } = await (supabase.auth.admin as any).createUser({
                email: formData.email,
                password: formData.password,
                email_confirm: true,
                user_metadata: { full_name: formData.name }
            });
            if (authError) throw authError;

            if (data?.user) {
                await supabase.from('user_profiles').insert([{
                    id: data.user.id,
                    name: formData.name,
                    email: formData.email,
                    joined_date: new Date().toISOString()
                }]);
            }

            setIsCreateModalOpen(false);
            setFormData({ name: '', email: '', password: '' });
            fetchUsers();
            alert('Utilisateur créé avec succès !');
        } catch (err: any) {
            alert('Erreur création: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const deleteUser = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte définitivement ?')) return;
        setProcessing(true);
        try {
            const { error: delError } = await (supabase.auth.admin as any).deleteUser(id);
            if (delError) throw delError;
            await supabase.from('user_profiles').delete().eq('id', id);
            fetchUsers();
            setSelectedUser(null);
            alert('Compte supprimé.');
        } catch (err: any) {
            alert('Erreur suppression: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const toggleBan = async (user: UserProfile) => {
        const newBanStatus = !user.is_banned;
        setProcessing(true);
        try {
            const { error: banError } = await (supabase.auth.admin as any).updateUserById(user.id, {
                user_metadata: { banned: newBanStatus },
            });
            if (banError) throw banError;

            fetchUsers();
            if (selectedUser?.id === user.id) {
                setSelectedUser({ ...user, is_banned: newBanStatus });
            }
            alert(newBanStatus ? 'Utilisateur désactivé' : 'Utilisateur réactivé');
        } catch (err: any) {
            alert('Erreur status: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setProcessing(true);
        try {
            const { error: upError } = await supabase
                .from('user_profiles')
                .upsert({
                    id: selectedUser.id,
                    name: formData.name,
                    updated_at: new Date().toISOString()
                });
            if (upError) throw upError;

            fetchUsers();
            setIsEditModalOpen(false);
            alert('Profil mis à jour.');
        } catch (err: any) {
            alert('Erreur: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const copyEmail = (email: string) => {
        navigator.clipboard.writeText(email).then(() => {
            setCopied(email);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    const filtered = users
        .filter(u => {
            const q = search.toLowerCase();
            return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
        })
        .sort((a, b) => {
            if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'favorites') return (b.favorites?.length || 0) - (a.favorites?.length || 0);
            return new Date(b.joined_date || 0).getTime() - new Date(a.joined_date || 0).getTime();
        });

    const stats = {
        total: users.length,
        darkMode: users.filter(u => u.dark_mode).length,
        avgFavorites: users.length > 0
            ? (users.reduce((acc, u) => acc + (u.favorites?.length || 0), 0) / users.length).toFixed(1)
            : 0,
    };

    const getInitials = (name?: string, email?: string) => {
        if (name && name.trim()) return name.trim().slice(0, 2).toUpperCase();
        if (email) return email.slice(0, 2).toUpperCase();
        return '??';
    };

    const getAvatarColor = (id: string) => {
        const colors = [
            ['#fb5607', '#ff8c42'],
            ['#F94D00', '#ff8c42'],
            ['#059669', '#34d399'],
            ['#d97706', '#fbbf24'],
            ['#7c3aed', '#a78bfa'],
            ['#0891b2', '#22d3ee'],
        ];
        const idx = id.charCodeAt(0) % colors.length;
        return colors[idx];
    };

    const langLabel = (lang?: string) => {
        if (lang === 'en') return '🇬🇧 Anglais';
        if (lang === 'es') return '🇪🇸 Espagnol';
        return '🇫🇷 Français';
    };

    return (
        <div style={{ width: '100%', boxSizing: 'border-box', padding: '0 0 40px' }}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#9ca3af' }}>Gérez les accès et surveillez l'activité des utilisateurs</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ name: '', email: '', password: '' });
                        setIsCreateModalOpen(true);
                    }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '12px 24px', borderRadius: '14px',
                        background: 'var(--primary)', color: '#fff',
                        border: 'none', fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(251, 86, 7, 0.2)',
                    }}
                >
                    <UserPlus size={18} /> Nouvel Utilisateur
                </button>
            </div>

            {/* ── Stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                {[
                    { label: 'Utilisateurs inscrits', value: stats.total, suffix: 'comptes', icon: <Users size={20} />, color: '#fb5607', bg: '#fff5f0' },
                    { label: 'Mode Sombre activé', value: stats.darkMode, suffix: 'utilisateurs', icon: <Activity size={20} />, color: '#7c3aed', bg: '#F5F3FF' },
                    { label: 'Favoris moyens', value: stats.avgFavorites, suffix: 'par compte', icon: <Heart size={20} />, color: '#fb5607', bg: '#FFF7ED' },
                ].map(s => (
                    <div key={s.label} style={{ background: '#fff', borderRadius: '28px', padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                {s.icon}
                            </div>
                            <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                            <span style={{ fontSize: '36px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{s.value}</span>
                            <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 600, paddingBottom: '4px' }}>{s.suffix}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher un utilisateur par nom ou email..."
                        style={{
                            width: '100%', height: '46px', borderRadius: '14px',
                            border: '1.5px solid #e5e7eb', background: '#fff',
                            paddingLeft: '42px', paddingRight: '16px',
                            fontSize: '14px', fontWeight: 500, color: '#374151',
                            outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                </div>
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    style={{
                        height: '46px', borderRadius: '14px', border: '1.5px solid #e5e7eb',
                        background: '#fff', padding: '0 14px', fontSize: '13px', fontWeight: 700,
                        color: '#374151', cursor: 'pointer', outline: 'none',
                    }}
                >
                    <option value="date">Trier par date</option>
                    <option value="name">Trier par nom</option>
                    <option value="favorites">Trier par favoris</option>
                </select>
                <button
                    onClick={fetchUsers}
                    title="Actualiser"
                    style={{
                        width: '46px', height: '46px', borderRadius: '14px',
                        border: '1.5px solid #e5e7eb', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#6b7280', flexShrink: 0,
                        transition: 'all 0.15s',
                    }}
                >
                    <RefreshCw size={17} />
                </button>
            </div>

            {/* ── Content ── */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '16px', color: '#9ca3af' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#fb5607', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ fontWeight: 600, margin: 0 }}>Chargement des utilisateurs...</p>
                </div>
            ) : error ? (
                <div style={{ background: '#fff', borderRadius: '28px', padding: '60px', textAlign: 'center', border: '1px dashed #e5e7eb' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Users size={28} color="#d97706" />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Aucun utilisateur trouvé</h3>
                    <p style={{ color: '#9ca3af', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>{error}</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '28px', padding: '60px', textAlign: 'center', border: '1px dashed #e5e7eb' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Search size={28} color="#d1d5db" />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Aucun résultat</h3>
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>Aucun utilisateur ne correspond à "{search}".</p>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '28px', border: '1px solid #f0f0f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 80px 50px', gap: '12px', padding: '14px 24px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                        {["Utilisateur", "Email", "Langue", "Favoris", "Inscription", "Mode", ""].map(h => (
                            <span key={h} style={{ fontSize: '10px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</span>
                        ))}
                    </div>

                    {filtered.map((user, idx) => {
                        const [colorA, colorB] = getAvatarColor(user.id);
                        const isLast = idx === filtered.length - 1;
                        return (
                            <div
                                key={user.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 80px 50px',
                                    gap: '12px',
                                    padding: '18px 24px',
                                    alignItems: 'center',
                                    borderBottom: isLast ? 'none' : '1px solid #f9fafb',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#fafeff')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} style={{ width: 40, height: 40, borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
                                    ) : (
                                        <div style={{
                                            width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
                                            background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '14px', fontWeight: 900, color: '#fff',
                                        }}>
                                            {getInitials(user.name, user.email)}
                                        </div>
                                    )}
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                                            {user.is_banned && <ShieldAlert size={12} color="#ef4444" />}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>{user.id.slice(0, 8)}...</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                    <Mail size={13} color="#9ca3af" />
                                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.email || '—'}
                                    </span>
                                    {user.email && (
                                        <button
                                            onClick={() => copyEmail(user.email!)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === user.email ? '#059669' : '#d1d5db', padding: '2px' }}
                                        >
                                            {copied === user.email ? <Check size={13} /> : <Copy size={13} />}
                                        </button>
                                    )}
                                </div>

                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                                    {langLabel(user.language)}
                                </span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Heart size={11} color="#fb5607" fill="#fb5607" />
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#ea580c', background: '#fff7ed', padding: '2px 8px', borderRadius: '10px' }}>
                                        {user.favorites?.length || 0}
                                    </span>
                                </div>

                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af' }}>
                                    {user.joined_date ? new Date(user.joined_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                                </span>

                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <span style={{
                                        fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px',
                                        background: user.dark_mode ? '#1e1b4b' : '#f3f4f6',
                                        color: user.dark_mode ? '#a5b4fc' : '#9ca3af',
                                    }}>
                                        {user.dark_mode ? '🌙' : '☀️'}
                                    </span>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setActiveTab('info');
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '6px', display: 'flex', justifyContent: 'center' }}
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>
                        );
                    })}

                    <div style={{ padding: '12px 24px', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#9ca3af' }}>
                            {filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
                            {search && ` · Recherche : "${search}"`}
                        </p>
                    </div>
                </div>
            )}

            {/* Modal: Creation */}
            {isCreateModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '32px', width: '100%', maxWidth: '450px', padding: '40px', position: 'relative' }}>
                        <button onClick={() => setIsCreateModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={24} /></button>
                        <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '24px' }}>Nouvel Utilisateur</h3>
                        <form onSubmit={createUser}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Nom complet</label>
                                <input required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', outline: 'none' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Jean Dupont" />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Email</label>
                                <input type="email" required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', outline: 'none' }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemple.com" />
                            </div>
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Mot de passe initial</label>
                                <input type="password" required minLength={6} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', outline: 'none' }} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Min. 6 caractères" />
                            </div>
                            <button type="submit" disabled={processing} style={{ width: '100%', padding: '16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', opacity: processing ? 0.7 : 1 }}>
                                {processing ? 'Création...' : 'Créer le compte'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Details & History */}
            {selectedUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '32px', width: '100%', maxWidth: '700px', height: '85vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

                        <div style={{ padding: '32px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '20px', background: `linear-gradient(135deg, ${getAvatarColor(selectedUser.id)[0]}, ${getAvatarColor(selectedUser.id)[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, color: '#fff' }}>
                                    {getInitials(selectedUser.name, selectedUser.email)}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>{selectedUser.name}</h3>
                                        {selectedUser.is_banned && <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Désactivé</span>}
                                    </div>
                                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>{selectedUser.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', padding: '0 32px', borderBottom: '1px solid #f0f0f0', gap: '24px' }}>
                            {[
                                { id: 'info', label: 'Profil & Accès', icon: <Users size={16} /> },
                                { id: 'history', label: 'Historique Connect', icon: <History size={16} /> },
                                { id: 'transactions', label: 'Transactions', icon: <CreditCard size={16} /> },
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id as any)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '16px 4px', border: 'none', background: 'none',
                                        fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                        color: activeTab === t.id ? 'var(--primary)' : '#9ca3af',
                                        borderBottom: activeTab === t.id ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                            {activeTab === 'info' && (
                                <div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
                                        <div>
                                            <h4 style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>Informations de compte</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ fontSize: '14px' }}><strong>ID Unique:</strong> <code style={{ background: '#f9fafb', padding: '2px 6px', borderRadius: '6px' }}>{selectedUser.id}</code></div>
                                                <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <strong>Statut du compte:</strong>
                                                    {selectedUser.is_banned ?
                                                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={14} /> Désactivé</span> :
                                                        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={14} /> Actif</span>
                                                    }
                                                </div>
                                                <div style={{ fontSize: '14px' }}><strong>Inscrit le:</strong> {new Date(selectedUser.joined_date || '').toLocaleDateString('fr-FR', { dateStyle: 'long' })}</div>
                                                <div style={{ fontSize: '14px' }}><strong>Dernière connexion:</strong> {selectedUser.last_sign_in ? new Date(selectedUser.last_sign_in).toLocaleString('fr-FR') : 'Jamais'}</div>
                                                <div style={{ fontSize: '14px' }}><strong>Langue:</strong> {langLabel(selectedUser.language)}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>Activité Application</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ fontSize: '14px' }}><strong>Favoris:</strong> {selectedUser.favorites?.length || 0} recettes</div>
                                                <div style={{ fontSize: '14px' }}><strong>Liste courses:</strong> {selectedUser.shopping_list?.length || 0} articles</div>
                                                <div style={{ fontSize: '14px' }}><strong>Mode App:</strong> {selectedUser.dark_mode ? '🌙 Sombre' : '☀️ Clair'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <h4 style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>Actions de Management</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <button
                                            onClick={() => {
                                                setFormData({ ...formData, name: selectedUser.name || '' });
                                                setIsEditModalOpen(true);
                                            }}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '16px', border: '1.5px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            <Edit2 size={16} /> Modifier Nom
                                        </button>
                                        <button
                                            onClick={() => toggleBan(selectedUser)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                                padding: '14px', borderRadius: '16px', border: '1.5px solid transparent',
                                                background: selectedUser.is_banned ? '#ecfdf5' : '#fff1f2',
                                                color: selectedUser.is_banned ? '#059669' : '#e11d48',
                                                fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                                            }}
                                        >
                                            {selectedUser.is_banned ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                                            {selectedUser.is_banned ? 'Réactiver' : 'Désactiver'}
                                        </button>
                                        <button
                                            onClick={() => deleteUser(selectedUser.id)}
                                            style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '16px', background: '#f9fafb', color: '#ef4444', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '10px' }}
                                        >
                                            <Trash2 size={16} /> Supprimer définitivement
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <div style={{ width: 48, height: 48, background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#9ca3af' }}>
                                        <Activity size={24} />
                                    </div>
                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Historique de connexion</h4>
                                    <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>Supabase gère l'historique de manière sécurisée mais limitée sur le client.</p>
                                    <div style={{ marginTop: '24px', background: '#fafafa', borderRadius: '16px', padding: '20px', textAlign: 'left' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                                            <span style={{ fontSize: '13px', color: '#6b7280' }}>Sessions actives</span>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>1 session active</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'transactions' && (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <div style={{ width: 48, height: 48, background: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fb5607' }}>
                                        <CreditCard size={24} />
                                    </div>
                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Aucune transaction</h4>
                                    <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>Aucun achat détecté.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Edit Name */}
            {isEditModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '32px', width: '100%', maxWidth: '400px', padding: '40px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '24px' }}>Modifier Nom</h3>
                        <form onSubmit={updateProfile}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Nom Affiché</label>
                                <input required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', outline: 'none' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#f3f4f6', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                                <button type="submit" disabled={processing} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
