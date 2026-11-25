import { useState, useEffect } from 'react';
import { Bell, Send, Trash2, CheckCircle2, AlertCircle, Eye, EyeOff, RefreshCw } from '../components/SolarIcons';
import { supabaseAdmin } from '../lib/supabase';
import { AdminSelect } from '../components/AdminSelect';

interface AppNotification {
    id: string;
    title: string;
    body: string;
    action_route: string | null;
    is_active: boolean;
    created_at: string;
}

const ACTION_ROUTES = [
    { value: '', label: 'Aucune redirection' },
    { value: 'home', label: 'Accueil' },
    { value: 'recipes', label: 'Catalogue Recettes' },
    { value: 'community', label: 'Communauté' },
    { value: 'aichef', label: 'Chef IA' },
    { value: 'market', label: 'Mon Marché' },
];

const QUICK_TEMPLATES = [
    { label: 'Nouvelle Recette', title: 'Nouvelle Recette disponible', body: 'Découvrez notre nouvelle recette authentique dans AfroCuisto.', action_route: 'recipes' },
    { label: 'Communauté', title: 'Rejoignez la communauté', body: 'Partagez vos plats et astuces culinaires avec les autres gourmets.', action_route: 'community' },
    { label: 'Chef IA', title: 'Essayez le Chef IA', body: 'Besoin d’inspiration avec vos ingrédients ? Demandez conseil au Chef IA.', action_route: 'aichef' },
];

export function Notifications() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        title: '',
        body: '',
        action_route: '',
    });

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        const { data, error: fetchErr } = await supabaseAdmin
            .from('app_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (!fetchErr && data) {
            setNotifications(data);
        }
        setLoading(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.body.trim()) {
            setError('Le titre et le message sont requis.');
            return;
        }
        setSending(true);
        setError('');
        setSuccess('');

        const { error: insertErr } = await supabaseAdmin.from('app_notifications').insert([{
            title: form.title.trim(),
            body: form.body.trim(),
            action_route: form.action_route.trim() || null,
            is_active: true,
        }]);

        if (insertErr) {
            setError('Erreur lors de la publication : ' + insertErr.message);
        } else {
            setSuccess('Notification publiée dans app_notifications !');
            setForm({ title: '', body: '', action_route: '' });
            fetchNotifications();
        }
        setSending(false);
    };

    const toggleActive = async (item: AppNotification) => {
        const next = !item.is_active;
        const { error: upErr } = await supabaseAdmin
            .from('app_notifications')
            .update({ is_active: next })
            .eq('id', item.id);
        if (!upErr) {
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_active: next } : n));
        }
    };

    const deleteNotification = async (id: string) => {
        if (!window.confirm('Supprimer cette notification ?')) return;
        const { error: delErr } = await supabaseAdmin.from('app_notifications').delete().eq('id', id);
        if (!delErr) {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
    };

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="grid-form-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
                <form onSubmit={handleSend} className="card" style={{ padding: '24px', borderRadius: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '12px', background: '#fff7ed', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bell size={18} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Nouvelle Notification App</h2>
                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Table <code style={{ fontSize: 11 }}>app_notifications</code></p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        {QUICK_TEMPLATES.map(tpl => (
                            <button
                                key={tpl.label}
                                type="button"
                                onClick={() => setForm({ title: tpl.title, body: tpl.body, action_route: tpl.action_route })}
                                style={{ padding: '6px 12px', borderRadius: '999px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: '#374151' }}
                            >
                                {tpl.label}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                    {success && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', background: '#f0fdf4', color: '#15803d', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
                            <CheckCircle2 size={16} /> {success}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Titre *</label>
                            <input
                                type="text"
                                required
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="Ex: Nouvelle recette béninoise"
                                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Message *</label>
                            <textarea
                                rows={4}
                                required
                                value={form.body}
                                onChange={e => setForm({ ...form, body: e.target.value })}
                                placeholder="Contenu affiché aux utilisateurs..."
                                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Route d’action (optionnel)</label>
                            <AdminSelect
                                ariaLabel="Route d’action de la notification"
                                value={form.action_route}
                                onChange={value => setForm({ ...form, action_route: value })}
                                options={ACTION_ROUTES}
                                style={{ width: '100%' }}
                                triggerStyle={{ minHeight: '44px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={sending}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}
                        >
                            <Send size={16} /> {sending ? 'Publication...' : 'Publier la notification'}
                        </button>
                    </div>
                </form>

                <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Historique ({notifications.length})</h3>
                        <button
                            onClick={fetchNotifications}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            <RefreshCw size={14} /> Actualiser
                        </button>
                    </div>

                    {loading ? (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '32px 0' }}>Chargement...</p>
                    ) : notifications.length === 0 ? (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '32px 0' }}>Aucune notification publiée.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {notifications.map(item => (
                                <div
                                    key={item.id}
                                    style={{
                                        padding: '14px 16px',
                                        borderRadius: '14px',
                                        border: '1px solid #f0f0f0',
                                        background: item.is_active ? '#fff' : '#f9fafb',
                                        opacity: item.is_active ? 1 : 0.7,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{item.title}</span>
                                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: item.is_active ? '#dcfce7' : '#e5e7eb', color: item.is_active ? '#15803d' : '#6b7280' }}>
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                {item.action_route && (
                                                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: '#eff6ff', color: '#2563eb' }}>
                                                        Route: {item.action_route}
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ margin: '6px 0 4px', fontSize: '13px', color: '#4b5563' }}>{item.body}</p>
                                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                {new Date(item.created_at).toLocaleString('fr-FR')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                onClick={() => toggleActive(item)}
                                                title={item.is_active ? 'Désactiver' : 'Activer'}
                                                style={{ padding: '7px', borderRadius: '9px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}
                                            >
                                                {item.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                            <button
                                                onClick={() => deleteNotification(item.id)}
                                                title="Supprimer"
                                                style={{ padding: '7px', borderRadius: '9px', border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
