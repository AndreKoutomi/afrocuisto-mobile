/**
 * ============================================================================
 * PAGE DE NOTIFICATIONS PUSH - ADMIN CMS
 * ============================================================================
 * Permet à l'administrateur de rédiger et d'envoyer des notifications push
 * qui s'afficheront instantanément dans l'application mobile AfroCuisto.
 * Les notifications sont stockées dans Supabase et récupérées par l'app.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { Bell, Send, Trash2, CheckCircle2, AlertCircle, Eye, Clock, ChefHat } from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- Types ---
interface PushNotification {
    id: string;
    title: string;
    body: string;
    icon: string;
    color: string;
    link_type: string; // 'recipe' | 'section' | 'general'
    link_id: string | null;
    sent_at: string;
    is_active: boolean;
    read_count: number;
}

// Modèles de notifications rapides pour l'admin
const QUICK_TEMPLATES = [
    { icon: '🍲', label: 'Nouvelle Recette', title: 'Nouvelle Recette ! 🍲', body: 'Découvrez notre nouvelle recette authentique, préparée avec amour par nos Chefs.' },
    { icon: '👨‍🍳', label: 'Chef du Mois', title: 'Chef de la semaine 👨‍🍳', body: 'Rencontrez le Chef de cette semaine et ses secrets culinaires inédits !' },
    { icon: '⭐', label: 'Recette Populaire', title: 'Tendance de la semaine ⭐', body: 'Ce plat fait sensation ! Essayez-le avant tout le monde.' },
    { icon: '🎉', label: 'Événement', title: 'Événement spécial 🎉', body: 'Un événement culinaire exceptionnel vous attend sur AfroCuisto !' },
    { icon: '🌍', label: 'Explorer', title: 'Explorez l\'Afrique 🌍', body: 'De nouvelles saveurs de toute l\'Afrique viennent d\'être ajoutées. Partez à la découverte !' },
];

const ICON_COLORS = [
    { value: '#F94D00', label: 'Orange AfroCuisto' },
    { value: '#10b981', label: 'Vert Émeraude' },
    { value: '#6366f1', label: 'Violet' },
    { value: '#f59e0b', label: 'Or Africain' },
    { value: '#ef4444', label: 'Rouge' },
];

const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '20px',
    border: '1px solid #f0f0f0',
    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    overflow: 'hidden',
};

export function Notifications() {
    const [notifications, setNotifications] = useState<PushNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(false);

    const [form, setForm] = useState({
        title: '',
        body: '',
        icon: '🔔',
        color: '#F94D00',
        link_type: 'general',
        link_id: '',
    });

    // Charger les notifications existantes
    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('push_notifications')
            .select('*')
            .order('sent_at', { ascending: false })
            .limit(50);

        if (!error && data) {
            setNotifications(data);
        }
        setLoading(false);
    };

    // Appliquer un modèle rapide
    const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
        setForm(prev => ({ ...prev, title: tpl.title, body: tpl.body, icon: tpl.icon }));
    };

    // Envoyer la notification
    const handleSend = async () => {
        if (!form.title.trim() || !form.body.trim()) {
            setError('Le titre et le message sont requis.');
            return;
        }
        setSending(true);
        setError('');
        setSuccess('');

        const { error } = await supabase.from('push_notifications').insert([{
            title: form.title.trim(),
            body: form.body.trim(),
            icon: form.icon,
            color: form.color,
            link_type: form.link_type,
            link_id: form.link_id || null,
            is_active: true,
            read_count: 0,
        }]);

        if (error) {
            setError('Erreur lors de l\'envoi : ' + error.message);
        } else {
            setSuccess('✅ Notification envoyée avec succès à tous les utilisateurs !');
            setForm({ title: '', body: '', icon: '🔔', color: '#F94D00', link_type: 'general', link_id: '' });
            fetchNotifications();
            setTimeout(() => setSuccess(''), 4000);
        }
        setSending(false);
    };

    // Supprimer une notification
    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cette notification ?')) return;
        await supabase.from('push_notifications').delete().eq('id', id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Désactiver/activer une notification
    const toggleActive = async (id: string, current: boolean) => {
        await supabase.from('push_notifications').update({ is_active: !current }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_active: !current } : n));
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
            {/* Header */}
            <div className="notifications-header flex-responsive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>Notifications Push</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
                        Envoyez des alertes directement dans l'application AfroCuisto
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff5f0', padding: '8px 16px', borderRadius: 12, border: '1px solid #ffe0d0' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F94D00', boxShadow: '0 0 0 3px rgba(249,77,0,0.2)' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#F94D00', whiteSpace: 'nowrap' }}>{notifications.filter(n => n.is_active).length} actives</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(340px, 400px)', gap: 24 }} className="notifications-grid">

                {/* Formulaire de création */}
                <div className="notifications-form-panel">
                    <div style={cardStyle}>
                        {/* Titre section */}
                        <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid #f5f5f5' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #F94D00, #ff7c00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Bell size={18} color="#fff" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Nouvelle Notification</h2>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Rédigez votre message</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: 24 }}>
                            {/* Modèles rapides */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                                    Modèles Rapides
                                </label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {QUICK_TEMPLATES.map(tpl => (
                                        <button
                                            key={tpl.label}
                                            onClick={() => applyTemplate(tpl)}
                                            style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid #e5e7eb', background: '#fafafa', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F94D00'; (e.currentTarget as HTMLButtonElement).style.color = '#F94D00'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.color = 'inherit'; }}
                                        >
                                            {tpl.icon} {tpl.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Champ Titre */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                                    Titre *
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder='Ex : Le Ndolé du dimanche est prêt ! 🍲'
                                    maxLength={80}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    onFocus={e => e.currentTarget.style.borderColor = '#F94D00'}
                                    onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                                />
                                <div style={{ textAlign: 'right', fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{form.title.length}/80</div>
                            </div>

                            {/* Champ Message */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                                    Message *
                                </label>
                                <textarea
                                    value={form.body}
                                    onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                                    placeholder="Découvrez la nouvelle recette de Chef X. Rendez-vous sur l'app pour voir les détails !"
                                    rows={3}
                                    maxLength={200}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    onFocus={e => e.currentTarget.style.borderColor = '#F94D00'}
                                    onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                                />
                                <div style={{ textAlign: 'right', fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{form.body.length}/200</div>
                            </div>

                            {/* Emoji Icône + Couleur */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                                        Emoji icône
                                    </label>
                                    <input
                                        type="text"
                                        value={form.icon}
                                        onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                                        maxLength={4}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 22, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                                        Couleur accent
                                    </label>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                                        {ICON_COLORS.map(c => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                title={c.label}
                                                onClick={() => setForm(p => ({ ...p, color: c.value }))}
                                                style={{ width: 28, height: 28, borderRadius: '50%', background: c.value, border: form.color === c.value ? `3px solid ${c.value}` : '2px solid #e5e7eb', outline: form.color === c.value ? `2px solid white` : 'none', outlineOffset: form.color === c.value ? '-5px' : '0', cursor: 'pointer', transition: 'transform 0.2s', transform: form.color === c.value ? 'scale(1.2)' : 'scale(1)' }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Messages de retour */}
                            {error && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}
                            {success && (
                                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#16a34a', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CheckCircle2 size={16} /> {success}
                                </div>
                            )}

                            {/* Boutons */}
                            <div className="flex-responsive" style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => setPreview(!preview)}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fafafa', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}
                                >
                                    <Eye size={16} /> Aperçu
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !form.title.trim() || !form.body.trim()}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: 'none', background: sending ? '#ccc' : 'linear-gradient(135deg, #F94D00, #ff7c00)', color: '#fff', cursor: sending ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 15, boxShadow: '0 4px 15px rgba(249,77,0,0.3)', transition: 'all 0.2s' }}
                                >
                                    <Send size={18} />
                                    {sending ? 'Envoi...' : 'Envoyer à tous'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Historique des notifications */}
                    <div style={{ ...cardStyle, marginTop: 24 }}>
                        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                                Historique ({notifications.length})
                            </h2>
                            <button onClick={fetchNotifications} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fafafa', fontSize: 12, cursor: 'pointer' }}>
                                Rafraîchir
                            </button>
                        </div>
                        <div style={{ padding: '0 8px 8px' }}>
                            {loading ? (
                                <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Chargement...</div>
                            ) : notifications.length === 0 ? (
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <Bell size={40} color="#e5e7eb" style={{ margin: '0 auto 12px' }} />
                                    <p style={{ color: '#9ca3af', fontSize: 14 }}>Aucune notification envoyée pour l'instant</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} className="list-item-responsive" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, margin: '4px 0', background: notif.is_active ? '#fff' : '#fafafa', border: `1px solid ${notif.is_active ? '#e5e7eb' : '#f0f0f0'}`, opacity: notif.is_active ? 1 : 0.65 }}>
                                        <div style={{ width: 42, height: 42, borderRadius: 12, background: notif.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                                            {notif.icon}
                                        </div>
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{notif.title}</span>
                                                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: notif.is_active ? '#f0fdf4' : '#f5f5f5', color: notif.is_active ? '#16a34a' : '#9ca3af', flexShrink: 0 }}>
                                                    {notif.is_active ? 'Actif' : 'Inactif'}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.body}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 10, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <Clock size={10} /> {formatDate(notif.sent_at)}
                                                </span>
                                                <span style={{ fontSize: 10, color: '#9ca3af' }}>
                                                    {notif.read_count} lectures
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 'auto' }}>
                                            <button
                                                onClick={() => toggleActive(notif.id, notif.is_active)}
                                                title={notif.is_active ? 'Désactiver' : 'Activer'}
                                                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Eye size={14} color={notif.is_active ? '#F94D00' : '#9ca3af'} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(notif.id)}
                                                title="Supprimer"
                                                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Trash2 size={14} color="#dc2626" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Panneau droit : Aperçu */}
                <div className="notifications-preview-panel" style={{ position: 'sticky', top: 24 }}>
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid #f5f5f5' }}>
                            <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Aperçu dans l'app</h2>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>Comment les utilisateurs verront la notification</p>
                        </div>
                        <div style={{ padding: 24 }}>
                            {/* Simulation bannière push */}
                            <div style={{ borderRadius: 18, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb', maxWidth: '340px', margin: '0 auto' }}>
                                {/* Faux en-tête de téléphone */}
                                <div style={{ background: '#1a1a1a', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>9:41</span>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <div style={{ width: 14, height: 7, borderRadius: 2, background: 'rgba(255,255,255,0.6)' }} />
                                        <div style={{ width: 14, height: 7, borderRadius: 2, background: 'rgba(255,255,255,0.6)' }} />
                                        <div style={{ width: 22, height: 10, borderRadius: 3, border: '1px solid rgba(255,255,255,0.4)' }}>
                                            <div style={{ width: '65%', height: '100%', background: '#4ade80', borderRadius: 2 }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Bannière de notification */}
                                <div style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                                            {form.icon || '🔔'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AfroCuisto</span>
                                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>maintenant</span>
                                            </div>
                                            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 0 2px', lineHeight: 1.3 }}>
                                                {form.title || 'Votre titre ici...'}
                                            </p>
                                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.4 }}>
                                                {form.body || 'Votre message ici...'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Faux fond d'écran de l'app */}
                                <div style={{ background: '#f9f5f0', padding: 20, minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #F94D00, #ff7c00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ChefHat size={24} color="#fff" />
                                    </div>
                                    <p style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>AfroCuisto</p>
                                    <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>Application</p>

                                    {/* Bannière in-app */}
                                    <div style={{ marginTop: 12, width: '100%', background: '#fff', borderRadius: 14, padding: '12px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: `2px solid ${form.color}22` }}>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: form.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                                                {form.icon || '🔔'}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 12, fontWeight: 800, margin: '0 0 2px', color: '#1a1a1a' }}>{form.title || 'Votre titre ici...'}</p>
                                                <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{form.body || 'Votre message ici...'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tips */}
                            <div style={{ marginTop: 16, padding: '12px 14px', background: '#f0f9ff', borderRadius: 12, border: '1px solid #bae6fd' }}>
                                <p style={{ fontSize: 11, color: '#0369a1', margin: 0, lineHeight: 1.5 }}>
                                    <strong>💡 Conseil :</strong> Gardez le titre court (&lt;60 car.) et impactant. Utilisez des emojis pour attirer l'attention !
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats rapides */}
                    <div className="grid-responsive-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                        {[
                            { label: 'Envoyées', value: notifications.length, icon: <Send size={16} color="#F94D00" />, bg: '#fff5f0' },
                            { label: 'Actives', value: notifications.filter(n => n.is_active).length, icon: <Bell size={16} color="#10b981" />, bg: '#f0fdf4' },
                        ].map(stat => (
                            <div key={stat.label} style={{ ...cardStyle, padding: '16px', textAlign: 'center' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                                    {stat.icon}
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-main)' }}>{stat.value}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>            <style>{`.notifications-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(340px, 400px); gap: 24px; } @media (max-width: 900px) { .notifications-grid { grid-template-columns: 1fr; } }`}</style>

        </div>
    );
}
