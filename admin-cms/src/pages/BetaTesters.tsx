import { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import {
    Mail, Search, RefreshCw, Sparkles, Calendar, Globe, Trash2, Users
} from 'lucide-react';

interface BetaTester {
    id: string;
    email: string;
    lang: string;
    created_at: string;
}

export function BetaTesters() {
    const [testers, setTesters] = useState<BetaTester[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTesters();
    }, []);

    async function fetchTesters() {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabaseAdmin
                .from('waitlist')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setTesters(data || []);
        } catch (err: any) {
            console.error('Erreur chargement bêta testeurs:', err);
            setError(err.message || 'Erreur lors du chargement des bêta testeurs.');
        } finally {
            setLoading(false);
        }
    }

    const deleteTester = async (id: string) => {
        if (!confirm('Supprimer cet inscrit de la liste ?')) return;
        try {
            const { error: delError } = await supabaseAdmin.from('waitlist').delete().eq('id', id);
            if (delError) throw delError;
            fetchTesters();
        } catch (err: any) {
            alert('Erreur suppression: ' + err.message);
        }
    };

    const filtered = testers.filter(t => {
        const q = search.toLowerCase();
        return !q || t.email.toLowerCase().includes(q);
    });

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
            {/* ── Header ── */}
            <div className="flex-responsive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>Gérer la Waitlist</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#9ca3af' }}>Consultez les personnes inscrites via le site web AfroCuisto</p>
                </div>
                <div style={{ background: '#fff', padding: '10px 20px', borderRadius: '16px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={18} color="#fb5607" />
                    <span style={{ fontWeight: 800 }}>{testers.length} Inscrits</span>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par email..."
                        style={{
                            width: '100%', height: '46px', borderRadius: '14px',
                            border: '1.5px solid #e5e7eb', background: '#fff',
                            paddingLeft: '42px', paddingRight: '16px',
                            fontSize: '14px', fontWeight: 500, color: '#374151',
                            outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                </div>
                <button
                    onClick={fetchTesters}
                    style={{
                        width: '46px', height: '46px', borderRadius: '14px',
                        border: '1.5px solid #e5e7eb', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#6b7280', flexShrink: 0,
                    }}
                >
                    <RefreshCw size={17} />
                </button>
            </div>

            {/* ── Content ── */}
            {loading ? (
                <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af' }}>
                    <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px' }} />
                    <p>Chargement des inscrits...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '28px', padding: '60px', textAlign: 'center', border: '1px dashed #e5e7eb' }}>
                    <Sparkles size={48} color="#d1d5db" style={{ margin: '0 auto 20px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Aucune inscription</h3>
                    <p style={{ color: '#9ca3af' }}>Attendez que les premiers utilisateurs s'inscrivent sur le site.</p>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '28px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 180px 80px', gap: '12px', padding: '14px 24px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                        {["Email", "Langue", "Date d'inscription", "Action"].map(h => (
                            <span key={h} style={{ fontSize: '10px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>{h}</span>
                        ))}
                    </div>

                    {filtered.map((tester, idx) => (
                        <div
                            key={tester.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 120px 180px 80px',
                                gap: '12px',
                                padding: '18px 24px',
                                alignItems: 'center',
                                borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid #f9fafb',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#fff5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb5607' }}>
                                    <Mail size={16} />
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 700 }}>{tester.email}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Globe size={14} color="#9ca3af" />
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{tester.lang || 'FR'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280' }}>
                                <Calendar size={14} />
                                <span style={{ fontSize: '13px' }}>{new Date(tester.created_at).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}</span>
                            </div>
                            <button
                                onClick={() => deleteTester(tester.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '8px' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
