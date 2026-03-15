import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    ShoppingBasket, Search, Filter, RefreshCw, Clock,
    CheckCircle2, XCircle, ChevronRight, MapPin,
    ExternalLink, Package, Truck, User, CreditCard,
    Calendar, ArrowRight, Eye, List, LayoutGrid
} from 'lucide-react';

interface OrderItem {
    id: string;
    item: string;
    quantity: string;
    priceXOF: string;
    recipeName?: string;
    image?: string;
}

interface Order {
    id: string;
    orderDate: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus: 'paid' | 'unpaid' | 'failed';
    totalAmount: number;
    customer: {
        name: string;
        email: string;
        phone: string;
        address: string;
    };
    items: OrderItem[];
    paymentMethod: 'momo' | 'card' | 'cod';
    deliveryCoords?: { lat: number; lng: number };
}

export function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchOrders();

        // Écoute en temps réel des nouvelles commandes et mises à jour
        const channel = supabase
            .channel('orders_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    // Re-fetch all to get full customer info mapping or just append
                    fetchOrders();
                } else if (payload.eventType === 'UPDATE') {
                    setOrders(current => current.map(o => o.id === payload.new.id.toString() ? {
                        ...o,
                        status: payload.new.status,
                        payment_status: payload.new.payment_status,
                        total_amount: payload.new.total_amount
                    } : o));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                const mappedOrders: Order[] = data.map(o => ({
                    id: o.id.toString(),
                    orderDate: o.created_at,
                    status: o.status || 'pending',
                    paymentStatus: o.payment_status || 'unpaid',
                    totalAmount: o.total_amount || 0,
                    customer: {
                        name: o.customer_name || 'Inconnu',
                        email: o.customer_email || '',
                        phone: o.customer_phone || '',
                        address: o.customer_address || ''
                    },
                    items: Array.isArray(o.items) ? o.items : [],
                    paymentMethod: o.payment_method || 'momo',
                    deliveryCoords: o.delivery_coords
                }));
                setOrders(mappedOrders);
            }
            if (error) {
                if (error.code !== '42P01') throw error;
            }
        } catch (err: any) {
            console.error('Error fetching orders:', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchOrders();
    };

    const updateOrderStatus = async (id: string, newStatus: Order['status']) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
            if (selectedOrder?.id === id) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (err: any) {
            alert('Erreur lors de la mise à jour : ' + err.message);
        }
    };

    const getStatusInfo = (status: Order['status']) => {
        switch (status) {
            case 'pending': return { label: 'En attente', bg: '#FFF7ED', text: '#EA580C', icon: <Clock size={14} /> };
            case 'processing': return { label: 'Traitement', bg: '#EFF6FF', text: '#2563EB', icon: <Package size={14} /> };
            case 'shipped': return { label: 'Expédiée', bg: '#F5F3FF', text: '#7C3AED', icon: <Truck size={14} /> };
            case 'delivered': return { label: 'Livrée', bg: '#ECFDF5', text: '#059669', icon: <CheckCircle2 size={14} /> };
            case 'cancelled': return { label: 'Annulée', bg: '#FEF2F2', text: '#DC2626', icon: <XCircle size={14} /> };
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.customer.name.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
        const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="orders-container" style={{ paddingBottom: '40px' }}>
            {/* Statistiques */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <StatCard label="Commandes Actives" value={orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length} color="#fb5607" icon={<ShoppingBasket size={24} />} />
                <StatCard label="À préparer" value={orders.filter(o => o.status === 'pending').length} color="#EA580C" icon={<Clock size={24} />} />
                <StatCard label="Chiffre d'Affaires" value={orders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString() + ' FCFA'} color="#059669" icon={<CreditCard size={24} />} />
            </div>

            {/* Barre d'outils */}
            <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Rechercher par client ou n° de commande..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', height: '48px', paddingLeft: '48px', borderRadius: '15px', border: '1.5px solid #f3f4f6', outline: 'none', fontSize: '14px' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        style={{ height: '48px', padding: '0 20px', borderRadius: '15px', border: '1.5px solid #f3f4f6', outline: 'none', background: '#fff', fontSize: '14px', fontWeight: 600 }}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="pending">⏳ En attente</option>
                        <option value="processing">⚙️ Traitement</option>
                        <option value="shipped">🚚 Expédiée</option>
                        <option value="delivered">✅ Livrée</option>
                        <option value="cancelled">❌ Annulée</option>
                    </select>

                    <div style={{ display: 'flex', background: '#f8fafc', padding: '4px', borderRadius: '12px' }}>
                        <button onClick={() => setViewMode('list')} style={{ padding: '8px', borderRadius: '10px', background: viewMode === 'list' ? '#fff' : 'transparent', border: 'none', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none' }}>
                            <List size={20} color={viewMode === 'list' ? '#fb5607' : '#94a3b8'} />
                        </button>
                        <button onClick={() => setViewMode('grid')} style={{ padding: '8px', borderRadius: '10px', background: viewMode === 'grid' ? '#fff' : 'transparent', border: 'none', cursor: 'pointer', boxShadow: viewMode === 'grid' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none' }}>
                            <LayoutGrid size={20} color={viewMode === 'grid' ? '#fb5607' : '#94a3b8'} />
                        </button>
                    </div>

                    <button onClick={handleRefresh} style={{ height: '48px', width: '48px', borderRadius: '15px', border: 'none', background: '#fb5607', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={20} className={isLoading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Vue Liste */}
            {viewMode === 'list' ? (
                <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.2fr 1.2fr 1.2fr 100px', padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        {['CODE / DATE', 'CLIENT / ADRESSE', 'MONTANT', 'PAIEMENT', 'STATUT', 'ACTION'].map(t => (
                            <span key={t} style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>{t}</span>
                        ))}
                    </div>
                    {filteredOrders.map(order => (
                        <OrderRow key={order.id} order={order} getStatusInfo={getStatusInfo} onClick={() => setSelectedOrder(order)} />
                    ))}
                </div>
            ) : (
                /* Vue Grille */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {filteredOrders.map(order => (
                        <OrderCard key={order.id} order={order} getStatusInfo={getStatusInfo} onClick={() => setSelectedOrder(order)} />
                    ))}
                </div>
            )}

            {/* Modal de Détails */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    updateStatus={updateOrderStatus}
                    getStatusInfo={getStatusInfo}
                />
            )}

            <style>{`
                .spin { animation: rotate 1s linear infinite; }
                @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .order-row:hover { background: #f8fafc; }
            `}</style>
        </div>
    );
}

function StatCard({ label, value, color, icon }: any) {
    return (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ color, background: `${color}10`, padding: '12px', borderRadius: '16px' }}>{icon}</div>
                <ChevronRight size={18} color="#cbd5e1" />
            </div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{label}</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{value}</h3>
        </div>
    );
}

function OrderRow({ order, getStatusInfo, onClick }: any) {
    const s = getStatusInfo(order.status);
    const getPaymentLabel = (p: string) => {
        switch (p) {
            case 'paid': return 'PAYÉ';
            case 'unpaid': return 'IMPAYÉ';
            case 'failed': return 'ÉCHEC';
            default: return p.toUpperCase();
        }
    }
    return (
        <div className="order-row" onClick={onClick} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.2fr 1.2fr 1.2fr 100px', padding: '20px 24px', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', borderBottom: '1px solid #f1f5f9' }}>
            <div>
                <p style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>#{order.id}</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>{new Date(order.orderDate).toLocaleString('fr-FR')}</p>
            </div>
            <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#475569', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customer.name}</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customer.address}</p>
            </div>
            <div>
                <span style={{ fontWeight: 900, color: '#0f172a' }}>{order.totalAmount.toLocaleString()} FCFA</span>
            </div>
            <div>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', background: order.paymentStatus === 'paid' ? '#ecfdf5' : '#fef2f2', color: order.paymentStatus === 'paid' ? '#059669' : '#dc2626' }}>
                    {getPaymentLabel(order.paymentStatus)}
                </span>
            </div>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, background: s.bg, color: s.text, padding: '6px 12px', borderRadius: '20px', width: 'fit-content' }}>
                    {s.icon} <span>{s.label}</span>
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}>
                    <Eye size={16} color="#64748b" />
                </button>
            </div>
        </div>
    );
}

function OrderCard({ order, getStatusInfo, onClick }: any) {
    const s = getStatusInfo(order.status);
    return (
        <div onClick={onClick} style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9', padding: '20px', cursor: 'pointer', transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, background: s.bg, color: s.text, padding: '6px 12px', borderRadius: '20px' }}>
                    {s.icon} {s.label}
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>#{order.id}</span>
            </div>
            <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{order.customer.name}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                <MapPin size={12} color="#94a3b8" />
                <span style={{ fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customer.address}</span>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>TOTAL</p>
                    <p style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>{order.totalAmount.toLocaleString()} FCFA</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>ARTICLES</p>
                    <p style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>{order.items.length}</p>
                </div>
            </div>
        </div>
    );
}

function OrderDetailModal({ order, onClose, updateStatus, getStatusInfo }: any) {
    const [activeTab, setActiveTab] = useState('resume');
    const s = getStatusInfo(order.status);

    const getPaymentLabel = (p: string) => {
        switch (p) {
            case 'paid': return 'PAYÉ';
            case 'unpaid': return 'IMPAYÉ';
            default: return 'ERREUR';
        }
    }

    const getMethodLabel = (m: string) => {
        switch (m) {
            case 'momo': return 'MOBILE MONEY';
            case 'card': return 'CARTE BANCAIRE';
            case 'cod': return 'CASH À LA LIVRAISON';
            default: return m.toUpperCase();
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} />
            <div style={{ width: '100%', maxWidth: '600px', background: '#fff', position: 'relative', height: '100%', boxShadow: '-20px 0 50px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease-out' }}>
                <div style={{ padding: '32px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>DÉTAILS COMMANDE</span>
                            <h2 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>#{order.id}</h2>
                        </div>
                        <button onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', background: '#f1f5f9', cursor: 'pointer' }}><XCircle size={24} color="#64748b" /></button>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        {[
                            { id: 'resume', label: 'RÉSUMÉ' },
                            { id: 'items', label: 'ARTICLES' },
                            { id: 'suivi', label: 'SUIVI' }
                        ].map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ border: 'none', background: 'transparent', padding: '0 0 8px', borderBottom: activeTab === t.id ? '3px solid #fb5607' : '3px solid transparent', color: activeTab === t.id ? '#fb5607' : '#94a3b8', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                    {activeTab === 'resume' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <section>
                                <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>STATUT DE LA COMMANDE</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                    {[
                                        { id: 'pending', label: 'EN ATTENTE' },
                                        { id: 'processing', label: 'PRÉPARATION' },
                                        { id: 'shipped', label: 'EXPÉDIÉE' },
                                        { id: 'delivered', label: 'LIVRÉE' }
                                    ].map(st => (
                                        <button
                                            key={st.id}
                                            onClick={() => updateStatus(order.id, st.id as any)}
                                            style={{ padding: '10px 16px', borderRadius: '12px', border: '1.5px solid', borderColor: order.status === st.id ? '#fb5607' : '#f1f5f9', background: order.status === st.id ? '#fff' : '#f8fafc', color: order.status === st.id ? '#fb5607' : '#94a3b8', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                                        >
                                            {st.label}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                <section>
                                    <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>COORDONNÉES CLIENT</h4>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={24} color="#64748b" />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 800, color: '#2d3748' }}>{order.customer.name}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{order.customer.phone}</p>
                                        </div>
                                    </div>
                                </section>
                                <section>
                                    <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>PAIEMENT</h4>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ width: 48, height: 48, borderRadius: '12px', background: `${order.paymentStatus === 'paid' ? '#059669' : '#fb5607'}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CreditCard size={24} color={order.paymentStatus === 'paid' ? '#059669' : '#fb5607'} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 800, color: '#2d3748' }}>{getMethodLabel(order.paymentMethod)}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: order.paymentStatus === 'paid' ? '#059669' : '#fb5607', fontWeight: 700 }}>{getPaymentLabel(order.paymentStatus)}</p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <section>
                                <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>LIVRAISON</h4>
                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                                        <MapPin size={20} color="#fb5607" />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#334155' }}>Adresse de destination</p>
                                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{order.customer.address}</p>
                                            <button style={{ marginTop: '12px', border: 'none', background: '#fff', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, color: '#fb5607', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <ExternalLink size={14} /> Voir sur Google Maps
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'items' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {order.items.map((item: any) => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '20px' }}>
                                    <div style={{ width: 60, height: 60, borderRadius: '15px', background: '#fff', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                                        📦
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h5 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>{item.item}</h5>
                                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>Quantité : <span style={{ color: '#fb5607', fontWeight: 800 }}>{item.quantity}</span></p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>{parseInt(item.priceXOF).toLocaleString()} XOF</p>
                                    </div>
                                </div>
                            ))}
                            <div style={{ marginTop: '20px', padding: '24px', borderTop: '2px dashed #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 700, color: '#94a3b8' }}>Sous-total</span>
                                    <span style={{ fontWeight: 800, color: '#475569' }}>{order.totalAmount.toLocaleString()} XOF</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ fontWeight: 700, color: '#94a3b8' }}>Frais de livraison</span>
                                    <span style={{ fontWeight: 800, color: '#059669' }}>OFFERT</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>TOTAL</span>
                                    <span style={{ fontSize: '22px', fontWeight: 900, color: '#fb5607' }}>{order.totalAmount.toLocaleString()} FCFA</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: '32px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '16px' }}>
                    <button style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 800, cursor: 'pointer' }}>Imprimer BL</button>
                    <button style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#059669', color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        Initialiser l'expédition <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
