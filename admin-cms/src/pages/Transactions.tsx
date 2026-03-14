/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Consigne et liste de façon sécurisée les transactions ou les achats liés à l'application.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { useState } from 'react';
import { CreditCard, Search, Download, Filter, FileText, ArrowUpRight, ArrowDownRight, RefreshCw, XCircle, CheckCircle2, Clock } from 'lucide-react';

interface Transaction {
    id: string;
    userName: string;
    userEmail: string;
    amount: number;
    currency: string;
    date: string;
    status: 'success' | 'pending' | 'failed';
    type: 'subscription' | 'donation' | 'recipe_purchase';
    reference: string;
}

// Mock data for demonstration - in a real app, you would fetch this from Supabase or Stripe
const mockTransactions: Transaction[] = [];

export function Transactions() {
    const [transactions] = useState<Transaction[]>(mockTransactions);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [loading, setLoading] = useState(false);

    const handleRefresh = () => {
        setLoading(true);
        // Simulate network request
        setTimeout(() => {
            setLoading(false);
        }, 800);
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.userName.toLowerCase().includes(search.toLowerCase()) ||
            tx.userEmail.toLowerCase().includes(search.toLowerCase()) ||
            tx.reference.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const totalRevenue = transactions
        .filter(tx => tx.status === 'success')
        .reduce((sum, tx) => sum + tx.amount, 0);

    const successfulCount = transactions.filter(tx => tx.status === 'success').length;
    const pendingCount = transactions.filter(tx => tx.status === 'pending').length;

    const getStatusStyles = (status: Transaction['status']) => {
        switch (status) {
            case 'success':
                return { bg: '#ecfdf5', text: '#059669', icon: <CheckCircle2 size={14} /> };
            case 'pending':
                return { bg: '#fffbeb', text: '#d97706', icon: <Clock size={14} /> };
            case 'failed':
                return { bg: '#fef2f2', text: '#dc2626', icon: <XCircle size={14} /> };
        }
    };

    const getTypeLabel = (type: Transaction['type']) => {
        switch (type) {
            case 'subscription': return 'Abonnement Pro';
            case 'donation': return 'Donateur';
            case 'recipe_purchase': return 'Achat Recette';
        }
    };

    return (
        <div style={{ width: '100%', boxSizing: 'border-box', padding: '0 0 40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>

                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#9ca3af' }}>Gérez les paiements, abonnements et dons</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => alert('Export CSV en cours de développement...')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 20px', borderRadius: '14px',
                            background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb',
                            fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                    >
                        <Download size={18} /> Exporter
                    </button>
                    <button
                        onClick={handleRefresh}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 24px', borderRadius: '14px',
                            background: 'var(--primary)', color: '#fff', border: 'none',
                            fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(251, 86, 7, 0.2)'
                        }}
                    >
                        <RefreshCw size={18} className={loading ? 'spin' : ''} /> Actualiser
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '14px', background: '#fff5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb5607' }}>
                            <CreditCard size={22} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '4px 8px', borderRadius: '8px' }}>+12% (30j)</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Revenus Totaux</p>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{totalRevenue.toLocaleString('fr-FR')} FCFA</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '14px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                            <ArrowUpRight size={22} />
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Paiements Réussis</p>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{successfulCount}</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '14px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                            <Clock size={22} />
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>En Attente</p>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{pendingCount}</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '14px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                            <ArrowDownRight size={22} />
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Remboursements</p>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>0</div>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '16px' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par nom, email ou référence..."
                        style={{
                            width: '100%', height: '48px', borderRadius: '16px',
                            border: '1.5px solid #e5e7eb', background: '#fff',
                            paddingLeft: '46px', paddingRight: '20px',
                            fontSize: '14px', fontWeight: 500, color: '#374151',
                            outline: 'none', boxSizing: 'border-box',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                        }}
                    />
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Filter size={16} color="#6b7280" style={{ position: 'absolute', left: '16px', pointerEvents: 'none' }} />
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        style={{
                            height: '48px', borderRadius: '16px', border: '1.5px solid #e5e7eb',
                            background: '#fff', padding: '0 40px', fontSize: '14px', fontWeight: 600,
                            color: '#374151', cursor: 'pointer', outline: 'none', appearance: 'none',
                            minWidth: '160px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                        }}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="success">Réussis</option>
                        <option value="pending">En attente</option>
                        <option value="failed">Échoués</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) minmax(150px, 2fr) 1.5fr 1fr 1fr 1fr 80px', gap: '16px', padding: '16px 24px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    {["Client", "Référence", "Type", "Date", "Montant", "Statut", "Action"].map(h => (
                        <span key={h} style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</span>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                        <div style={{ width: 40, height: 40, border: '3px solid #f3f4f6', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                        <p style={{ margin: 0, fontWeight: 600 }}>Chargement des transactions...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#9ca3af' }}>
                            <FileText size={28} />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#111827' }}>Aucune transaction trouvée</h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Modifiez vos filtres ou effectuez une nouvelle recherche.</p>
                    </div>
                ) : (
                    filteredTransactions.map((tx, idx) => {
                        const isLast = idx === filteredTransactions.length - 1;
                        const statusStyle = getStatusStyles(tx.status);

                        return (
                            <div
                                key={tx.id}
                                style={{
                                    display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) minmax(150px, 2fr) 1.5fr 1fr 1fr 1fr 80px', gap: '16px',
                                    padding: '20px 24px', alignItems: 'center', borderBottom: isLast ? 'none' : '1px solid #f9fafb',
                                    transition: 'background 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fafeff'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                {/* Client */}
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.userName}</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.userEmail}</p>
                                </div>

                                {/* Reference */}
                                <div>
                                    <p style={{ margin: 0, fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, color: '#374151', background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
                                        {tx.reference}
                                    </p>
                                </div>

                                {/* Type */}
                                <div>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>
                                        {getTypeLabel(tx.type)}
                                    </span>
                                </div>

                                {/* Date */}
                                <div>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                        {new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                    </p>
                                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                                        {new Date(tx.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {/* Amount */}
                                <div>
                                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>
                                        {tx.amount.toLocaleString('fr-FR')} <span style={{ fontSize: '12px', color: '#6b7280' }}>FCFA</span>
                                    </span>
                                </div>

                                {/* Status */}
                                <div>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '6px 10px', borderRadius: '20px',
                                        fontSize: '12px', fontWeight: 700,
                                        background: statusStyle.bg, color: statusStyle.text
                                    }}>
                                        {statusStyle.icon}
                                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                    </span>
                                </div>

                                {/* Action */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        style={{
                                            background: '#f3f4f6', border: 'none', borderRadius: '10px',
                                            padding: '8px', cursor: 'pointer', color: '#4b5563',
                                            transition: 'background 0.2s'
                                        }}
                                        title="Voir les détails de l'abonnement"
                                        onClick={(e) => { e.stopPropagation(); alert(`Détails de la transaction ${tx.id}`); }}
                                    >
                                        <ArrowUpRight size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}

                {!loading && filteredTransactions.length > 0 && (
                    <div style={{ padding: '16px 24px', background: '#fafafa', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
                            Affichage de {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}
