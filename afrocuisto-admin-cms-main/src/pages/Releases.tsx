import { useState, useEffect } from 'react';
import { Smartphone, Plus, Trash2, RefreshCw, ExternalLink, ShieldAlert, CheckCircle2, AlertCircle } from '../components/SolarIcons';
import { supabaseAdmin } from '../lib/supabase';
import { AdminSelect } from '../components/AdminSelect';

interface AppRelease {
    id: string;
    channel: 'beta' | 'production';
    version_code: number;
    version_name: string;
    apk_url: string;
    release_notes: string;
    is_mandatory: boolean;
    published_at: string;
}

export function Releases() {
    const [releases, setReleases] = useState<AppRelease[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        channel: 'beta' as 'beta' | 'production',
        version_code: '',
        version_name: '',
        apk_url: '',
        release_notes: '',
        is_mandatory: false,
    });

    useEffect(() => {
        fetchReleases();
    }, []);

    async function fetchReleases() {
        setLoading(true);
        const { data, error: fetchErr } = await supabaseAdmin
            .from('app_releases')
            .select('*')
            .order('version_code', { ascending: false });

        if (!fetchErr && data) {
            setReleases(data);
        }
        setLoading(false);
    }

    async function handlePublish(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess('');

        const code = parseInt(form.version_code, 10);
        if (!Number.isFinite(code) || code <= 0) {
            setError('Le version_code doit être un entier positif.');
            return;
        }
        if (!form.version_name.trim() || !form.apk_url.trim()) {
            setError('Le nom de version et l’URL de l’APK sont requis.');
            return;
        }

        setSaving(true);
        const { error: insertErr } = await supabaseAdmin.from('app_releases').insert([{
            channel: form.channel,
            version_code: code,
            version_name: form.version_name.trim(),
            apk_url: form.apk_url.trim(),
            release_notes: form.release_notes.trim(),
            is_mandatory: form.is_mandatory,
        }]);

        if (insertErr) {
            setError('Erreur lors de la publication : ' + insertErr.message);
        } else {
            setSuccess(`Version ${form.version_name} (${form.channel}) publiée !`);
            setForm({
                channel: form.channel,
                version_code: String(code + 1),
                version_name: '',
                apk_url: '',
                release_notes: '',
                is_mandatory: false,
            });
            fetchReleases();
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (!window.confirm('Supprimer cette release ?')) return;
        const { error: delErr } = await supabaseAdmin.from('app_releases').delete().eq('id', id);
        if (!delErr) {
            setReleases(prev => prev.filter(r => r.id !== id));
        }
    }

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="grid-form-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px', alignItems: 'start' }}>
                <form onSubmit={handlePublish} className="card" style={{ padding: '24px', borderRadius: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Smartphone size={18} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Publier une Mise à jour OTA</h2>
                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Table <code style={{ fontSize: 11 }}>app_releases</code></p>
                        </div>
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
                        <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Canal *</label>
                                <AdminSelect
                                    ariaLabel="Canal de publication"
                                    value={form.channel}
                                    onChange={value => setForm({ ...form, channel: value as 'beta' | 'production' })}
                                    options={[
                                        { value: 'beta', label: 'Bêta (beta)' },
                                        { value: 'production', label: 'Production' },
                                    ]}
                                    style={{ width: '100%' }}
                                    triggerStyle={{ minHeight: '44px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Version Code *</label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    placeholder="Ex: 12"
                                    value={form.version_code}
                                    onChange={e => setForm({ ...form, version_code: e.target.value })}
                                    style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Nom de version *</label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: 1.2.0"
                                value={form.version_name}
                                onChange={e => setForm({ ...form, version_name: e.target.value })}
                                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>URL de l’APK *</label>
                            <input
                                type="url"
                                required
                                placeholder="https://..."
                                value={form.apk_url}
                                onChange={e => setForm({ ...form, apk_url: e.target.value })}
                                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Notes de version</label>
                            <textarea
                                rows={3}
                                placeholder="Nouveautés, correctifs..."
                                value={form.release_notes}
                                onChange={e => setForm({ ...form, release_notes: e.target.value })}
                                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                            />
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#111827', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={form.is_mandatory}
                                onChange={e => setForm({ ...form, is_mandatory: e.target.checked })}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                            />
                            Mise à jour obligatoire
                        </label>

                        <button
                            type="submit"
                            disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                        >
                            <Plus size={16} /> {saving ? 'Publication...' : 'Publier la release'}
                        </button>
                    </div>
                </form>

                <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Versions publiées ({releases.length})</h3>
                        <button
                            onClick={fetchReleases}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            <RefreshCw size={14} /> Actualiser
                        </button>
                    </div>

                    {loading ? (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '32px 0' }}>Chargement...</p>
                    ) : releases.length === 0 ? (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '32px 0' }}>Aucune release publiée.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {releases.map(rel => (
                                <div key={rel.id} style={{ padding: '14px 16px', borderRadius: '14px', border: '1px solid #f0f0f0', background: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 800, fontSize: '15px', color: '#111827' }}>
                                                    v{rel.version_name} (code {rel.version_code})
                                                </span>
                                                <span style={{
                                                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                                                    background: rel.channel === 'production' ? '#dcfce7' : '#fef3c7',
                                                    color: rel.channel === 'production' ? '#15803d' : '#b45309'
                                                }}>
                                                    {rel.channel}
                                                </span>
                                                {rel.is_mandatory && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: '#fee2e2', color: '#dc2626' }}>
                                                        <ShieldAlert size={11} /> Obligatoire
                                                    </span>
                                                )}
                                            </div>
                                            {rel.release_notes && (
                                                <p style={{ margin: '6px 0', fontSize: '13px', color: '#4b5563', whiteSpace: 'pre-wrap' }}>{rel.release_notes}</p>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                                                <span>Publiée le {new Date(rel.published_at).toLocaleString('fr-FR')}</span>
                                                <a href={rel.apk_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
                                                    APK <ExternalLink size={11} />
                                                </a>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(rel.id)}
                                            title="Supprimer"
                                            style={{ padding: '7px', borderRadius: '9px', border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
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
