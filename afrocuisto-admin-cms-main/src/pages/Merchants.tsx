/**
 * ============================================================================
 * GESTION DES MARCHANDS PARTENAIRES
 * ============================================================================
 * Rôle : Permet de gérer les comptes des marchands (boutiques) qui vendent des 
 * produits sur AfroCuisto.
 */

import { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import {
    Store, Plus, Search, RefreshCw, X, Mail, Phone,
    MapPin, Globe, Trash2, Edit3, Power, Key, Bell,
    MoreHorizontal
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, MarkerF, Autocomplete } from '@react-google-maps/api';
import { useRef } from 'react';

const BENIN_CITIES = [
    'Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Djougou',
    'Bohicon', 'Natitingou', 'Abomey', 'Kandi', 'Ouidah', 'Lokossa'
];

const AFRICAN_COUNTRIES = [
    'Bénin', 'Côte d\'Ivoire', 'Sénégal', 'Togo', 'Burkina Faso',
    'Mali', 'Niger', 'Cameroun', 'Gabon', 'Congo'
];

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface Merchant {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    category: string;
    tax_id?: string;
    website?: string;
    status: 'active' | 'inactive' | 'pending';
    joined_date: string;
    logo_url?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    last_update?: string;
}

export function Merchants() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
    const [processing, setProcessing] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Advanced Filter State
    const [filterStatus, setFilterStatus] = useState('Tous');
    const [filterCategory, setFilterCategory] = useState('Tous');
    const [filterCity, setFilterCity] = useState('Tous');
    const [sortBy, setSortBy] = useState('newest');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: 'Cotonou',
        country: 'Bénin',
        category: 'Alimentation',
        tax_id: '',
        website: '',
        description: '',
        logo_url: '',
        admin_note: '',
        latitude: 6.3654, // Cotonou par défaut
        longitude: 2.4183
    });

    const [formStep, setFormStep] = useState(1);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY || '' as string,
        libraries: ['places'] as any
    });

    const onMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            setFormData(prev => ({
                ...prev,
                latitude: e.latLng!.lat(),
                longitude: e.latLng!.lng()
            }));
        }
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                setFormData(prev => ({
                    ...prev,
                    address: place.formatted_address || '',
                    latitude: place.geometry!.location!.lat(),
                    longitude: place.geometry!.location!.lng()
                }));
            }
        }
    };

    useEffect(() => {
        fetchMerchants();
    }, []);

    async function fetchMerchants() {
        setLoading(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('merchants')
                .select('*')
                .order('joined_date', { ascending: false });

            if (error) {
                if (error.code === '42P01') {
                    // Table doesn't exist yet, we'll need to handle this or inform the user
                    console.warn("Table 'merchants' does not exist.");
                    setMerchants([]);
                } else {
                    throw error;
                }
            } else {
                setMerchants(data || []);
            }
        } catch (err: any) {
            console.error('Error fetching merchants:', err);
        } finally {
            setLoading(false);
        }
    }

    const createMerchant = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            // 1. Check if email already exists in 'merchants' table
            const { data: existingMerchant } = await supabaseAdmin
                .from('merchants')
                .select('id')
                .eq('email', formData.email.trim().toLowerCase())
                .single();

            if (existingMerchant) {
                throw new Error('Un marchand avec cet email existe déjà dans le système.');
            }

            // 2. Check if user already exists in Auth and what is their role
            const { data: usersData, error: listError } = await (supabase.auth.admin as any).listUsers();
            if (listError) console.warn("Admin list users failed, falling back to direct creation");

            const existingUser = (usersData?.users as any[])?.find(u => u.email?.toLowerCase() === formData.email.trim().toLowerCase());

            if (existingUser) {
                const role = existingUser.user_metadata?.role;
                if (role === 'merchant') {
                    // This is the "Ghost Account" case: exists in Auth with merchant role, but missing in Merchants table
                    if (confirm(`Ce compte d'authentification existe déjà en tant que Marchand, mais son profil est manquant dans la liste.\n\nVoulez-vous synchroniser et recréer son profil maintenant ?`)) {
                        await insertMerchantRecord(existingUser.id);
                        alert('Compte synchronisé et profil recréé avec succès.');
                        resetForm();
                        fetchMerchants();
                        return;
                    } else {
                        setProcessing(false);
                        return;
                    }
                } else {
                    // It's a client or something else
                    if (!confirm(`Attention: Cet email appartient déjà à un compte CLIENT.\n\nSouhaitez-vous accorder l'accès MARCHAND à cet utilisateur existant ?`)) {
                        setProcessing(false);
                        return;
                    }

                    // Promote existing user
                    const { error: updateError } = await (supabase.auth.admin as any).updateUserById(existingUser.id, {
                        user_metadata: { ...existingUser.user_metadata, role: 'merchant' }
                    });
                    if (updateError) throw updateError;

                    // Insert into merchants table using same ID
                    await insertMerchantRecord(existingUser.id);

                    alert('Accès Marchand activé pour le compte client existant.');
                    resetForm();
                    fetchMerchants();
                    return;
                }
            }

            // 3. Normal Creation
            const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
            const { data: authData, error: authError } = await (supabase.auth.admin as any).createUser({
                email: formData.email.trim().toLowerCase(),
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: formData.name,
                    role: 'merchant' // Explicitly separate from clients
                }
            });

            if (authError) throw authError;

            if (authData?.user) {
                await insertMerchantRecord(authData.user.id);
                alert(`Compte marchand créé avec succès !\n\nEmail: ${formData.email}\nMot de passe temporaire: ${tempPassword}\n\nVeuillez transmettre ces accès au partenaire.`);
            }

            resetForm();
            fetchMerchants();
        } catch (err: any) {
            alert('Erreur: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const insertMerchantRecord = async (userId: string) => {
        const payload: any = {
            id: userId,
            name: formData.name,
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            country: formData.country,
            category: formData.category,
            tax_id: formData.tax_id,
            website: formData.website,
            description: formData.description,
            logo_url: formData.logo_url,
            latitude: formData.latitude,
            longitude: formData.longitude,
            status: 'active',
            joined_date: new Date().toISOString()
        };

        const { error: insertError } = await supabaseAdmin
            .from('merchants')
            .insert([payload]);

        if (insertError) {
            // Fallback if location columns are missing in DB
            if (insertError.message.includes('latitude') || insertError.message.includes('longitude')) {
                console.warn('Location columns missing, retrying without them...');
                const { latitude, longitude, ...safePayload } = payload;
                const { error: retryError } = await supabaseAdmin.from('merchants').insert([safePayload]);
                if (retryError) throw retryError;
                return;
            }
            throw insertError;
        }
    };

    const updateMerchant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMerchant) return;
        setProcessing(true);
        try {
            const payload: any = {
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                country: formData.country,
                category: formData.category,
                tax_id: formData.tax_id,
                website: formData.website,
                description: formData.description,
                latitude: formData.latitude,
                longitude: formData.longitude,
                last_update: new Date().toISOString()
            };

            const { error } = await supabaseAdmin
                .from('merchants')
                .update(payload)
                .eq('id', selectedMerchant.id);

            if (error) {
                if (error.message.includes('latitude') || error.message.includes('longitude')) {
                    const { latitude, longitude, ...safePayload } = payload;
                    const { error: retryError } = await supabaseAdmin
                        .from('merchants')
                        .update(safePayload)
                        .eq('id', selectedMerchant.id);
                    if (retryError) throw retryError;
                } else {
                    throw error;
                }
            }

            resetForm();
            fetchMerchants();
            alert('Compte marchand mis à jour !');
        } catch (err: any) {
            alert('Erreur: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const resetForm = () => {
        setIsCreateModalOpen(false);
        setIsEditing(false);
        setSelectedMerchant(null);
        setFormStep(1);
        setFormData({
            name: '', email: '', phone: '', address: '', city: 'Cotonou', country: 'Bénin',
            category: 'Alimentation', tax_id: '', website: '', description: '', logo_url: '', admin_note: '',
            latitude: 6.3654, longitude: 2.4183
        });
    };

    const handleEditClick = (merchant: Merchant) => {
        setSelectedMerchant(merchant);
        setIsEditing(true);
        setFormData({
            name: merchant.name,
            email: merchant.email,
            phone: merchant.phone,
            address: merchant.address,
            city: merchant.city,
            country: merchant.country,
            category: merchant.category,
            tax_id: merchant.tax_id || '',
            website: merchant.website || '',
            description: merchant.description || '',
            logo_url: merchant.logo_url || '',
            admin_note: '',
            latitude: merchant.latitude || 6.3654,
            longitude: merchant.longitude || 2.4183
        });
        setOpenMenuId(null);
        setIsCreateModalOpen(true);
    };

    const handleSendPassword = async (merchant: Merchant) => {
        if (!confirm(`Envoyer un lien de réinitialisation de mot de passe à ${merchant.email} ?`)) return;
        setOpenMenuId(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(merchant.email);
            if (error) throw error;
            alert('Lien de réinitialisation envoyé par email au marchand.');
        } catch (err: any) {
            alert('Erreur: ' + err.message);
        }
    };

    const handleSendAlert = (merchant: Merchant) => {
        const msg = prompt(`Envoyer une alerte administrative à ${merchant.name} :`);
        if (msg) {
            setOpenMenuId(null);
            alert(`Alerte envoyée :\n"${msg}"`);
        }
    };

    const toggleStatus = async (merchant: Merchant) => {
        const newStatus = merchant.status === 'active' ? 'inactive' : 'active';
        setProcessing(true);
        try {
            const { error } = await supabaseAdmin
                .from('merchants')
                .update({ status: newStatus })
                .eq('id', merchant.id);

            if (error) throw error;

            await (supabase.auth.admin as any).updateUserById(merchant.id, {
                user_metadata: { banned: newStatus === 'inactive' }
            });

            fetchMerchants();
            if (selectedMerchant?.id === merchant.id) {
                setSelectedMerchant({ ...merchant, status: newStatus });
            }
            setOpenMenuId(null);
        } catch (err: any) {
            alert('Erreur status: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const deleteMerchant = async (id: string) => {
        if (!confirm('Supprimer ce compte marchand définitivement ?')) return;
        setProcessing(true);
        try {
            const { error: authErr } = await (supabase.auth.admin as any).deleteUser(id);
            if (authErr) throw authErr;

            await supabaseAdmin.from('merchants').delete().eq('id', id);

            fetchMerchants();
            setSelectedMerchant(null);
            setIsDetailModalOpen(false);
            setOpenMenuId(null);
            alert('Marchand supprimé.');
        } catch (err: any) {
            alert('Erreur suppression: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const filtered = merchants.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.email.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'Tous' || m.status === filterStatus;
        const matchesCategory = filterCategory === 'Tous' || m.category === filterCategory;
        const matchesCity = filterCity === 'Tous' || m.city === filterCity;

        return matchesSearch && matchesStatus && matchesCategory && matchesCity;
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.joined_date).getTime() - new Date(a.joined_date).getTime();
        if (sortBy === 'oldest') return new Date(a.joined_date).getTime() - new Date(b.joined_date).getTime();
        return 0;
    });

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="flex-responsive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: '4px 0 0' }}>Gérez vos partenaires marchands et boutiques</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '12px 24px', borderRadius: '14px',
                        background: 'var(--primary)', color: '#fff',
                        border: 'none', fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(251, 86, 7, 0.2)',
                    }}
                >
                    <Plus size={18} /> Ajouter un Marchand
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex-responsive" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par nom ou email..."
                        style={{
                            width: '100%', height: '46px', borderRadius: '14px',
                            border: '1.5px solid #e5e7eb', background: '#fff',
                            paddingLeft: '42px', paddingRight: '16px',
                            fontSize: '14px', fontWeight: 500, outline: 'none',
                        }}
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        padding: '0 20px', height: '46px', borderRadius: '14px',
                        border: '1.5px solid #e5e7eb', background: showFilters ? '#fb560710' : '#fff',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', color: showFilters ? '#fb5607' : '#6b7280',
                        fontWeight: 700, fontSize: '13px', transition: 'all 0.2s'
                    }}
                >
                    <Plus size={18} style={{ transform: showFilters ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                    Filtres {(!showFilters && (filterStatus !== 'Tous' || filterCategory !== 'Tous' || filterCity !== 'Tous')) && '●'}
                </button>
                <button
                    onClick={fetchMerchants}
                    style={{
                        width: '46px', height: '46px', borderRadius: '14px',
                        border: '1.5px solid #e5e7eb', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#6b7280'
                    }}
                >
                    <RefreshCw size={17} />
                </button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div style={{
                    background: '#f9fafb', borderRadius: '20px', padding: '24px',
                    marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '20px', border: '1px solid #f0f0f0'
                }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Statut</label>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 600 }}
                        >
                            <option value="Tous">Tous les statuts</option>
                            <option value="active">Actifs</option>
                            <option value="inactive">Inactifs</option>
                            <option value="pending">En attente</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Catégorie</label>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 600 }}
                        >
                            <option>Tous</option>
                            <option>Alimentation</option>
                            <option>Épices & Condiments</option>
                            <option>Boissons</option>
                            <option>Boucherie</option>
                            <option>Fruits & Légumes</option>
                            <option>Restaurant / Traiteur</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Ville</label>
                        <select
                            value={filterCity}
                            onChange={e => setFilterCity(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 600 }}
                        >
                            <option>Tous</option>
                            {BENIN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Trier par</label>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 600 }}
                        >
                            <option value="newest">Plus récent (Inscription)</option>
                            <option value="oldest">Plus ancien</option>
                        </select>
                    </div>

                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => {
                                setFilterStatus('Tous');
                                setFilterCategory('Tous');
                                setFilterCity('Tous');
                                setSortBy('newest');
                            }}
                            style={{ background: 'none', border: 'none', color: '#fb5607', fontSize: '12px', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Réinitialiser les filtres
                        </button>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#fb5607', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p>Chargement des marchands...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '28px', padding: '60px', textAlign: 'center', border: '1px dashed #e5e7eb' }}>
                    <div style={{ width: 64, height: 64, background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#d1d5db' }}>
                        <Store size={32} />
                    </div>
                    <h3>Aucun marchand trouvé</h3>
                    <p style={{ color: '#9ca3af' }}>Commencez par ajouter votre premier partenaire.</p>
                </div>
            ) : (
                <div className="table-mobile-card" style={{ background: '#fff', borderRadius: '28px', border: '1px solid #f0f0f0', position: 'relative', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                    <div className="table-header-hidden" style={{
                        display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 50px',
                        padding: '14px 24px', background: '#fafafa',
                        borderBottom: '1px solid #f0f0f0',
                        borderTopLeftRadius: '28px', borderTopRightRadius: '28px'
                    }}>
                        {["Nom du Marchand", "Email", "Téléphone", "Statut", "Inscription", ""].map(h => (
                            <span key={h} style={{ fontSize: '10px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</span>
                        ))}
                    </div>

                    {filtered.map(merchant => (
                        <div
                            key={merchant.id}
                            className="table-mobile-row"
                            style={{
                                display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 50px',
                                padding: '18px 24px', alignItems: 'center', borderBottom: '1px solid #f9fafb'
                            }}
                        >
                            <div className="table-cell-label" data-label="Marchand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#fb560710', color: '#fb5607', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                    {merchant.logo_url ? <img src={merchant.logo_url} style={{ width: '100%', height: '100%', borderRadius: '12px' }} /> : merchant.name.slice(0, 1).toUpperCase()}
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827' }}>{merchant.name}</p>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>ID: {merchant.id.slice(0, 8)}</p>
                                </div>
                            </div>

                            <div className="table-cell-label" data-label="Email" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                <Mail size={14} color="#9ca3af" />
                                <span style={{ color: '#374151' }}>{merchant.email}</span>
                            </div>

                            <div className="table-cell-label" data-label="Téléphone" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                <Phone size={14} color="#9ca3af" />
                                <span style={{ color: '#374151' }}>{merchant.phone || '—'}</span>
                            </div>

                            <div className="table-cell-label" data-label="Statut">
                                <span style={{
                                    fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px',
                                    textTransform: 'uppercase',
                                    background: merchant.status === 'active' ? '#dcfce7' : merchant.status === 'pending' ? '#fef3c7' : '#fee2e2',
                                    color: merchant.status === 'active' ? '#16a34a' : merchant.status === 'pending' ? '#d97706' : '#dc2626'
                                }}>
                                    {merchant.status === 'active' ? 'Actif' : merchant.status === 'pending' ? 'En attente' : 'Inactif'}
                                </span>
                            </div>

                            <div className="table-cell-label" data-label="Inscription">
                                <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                                    {new Date(merchant.joined_date).toLocaleDateString('fr-FR')}
                                </span>
                            </div>

                            <div style={{ position: 'relative', zIndex: openMenuId === merchant.id ? 100 : 1 }} className="table-cell-label" data-label="Actions">
                                <button
                                    onClick={() => setOpenMenuId(openMenuId === merchant.id ? null : merchant.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '8px' }}
                                >
                                    <MoreHorizontal size={20} />
                                </button>

                                {openMenuId === merchant.id && (
                                    <>
                                        <div
                                            onClick={() => setOpenMenuId(null)}
                                            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
                                        />
                                        <div style={{
                                            position: 'absolute', right: 0, top: '100%', width: '200px',
                                            background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                            border: '1px solid #f0f0f0', zIndex: 101, padding: '8px',
                                            display: 'flex', flexDirection: 'column', gap: '4px'
                                        }}>
                                            <button onClick={() => handleEditClick(merchant)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: 600, textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                                                <Edit3 size={16} color="#fb5607" /> Modifier
                                            </button>
                                            <button onClick={() => toggleStatus(merchant)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: merchant.status === 'active' ? '#ef4444' : '#16a34a', fontWeight: 600, textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                                                <Power size={16} /> {merchant.status === 'active' ? 'Désactiver' : 'Activer'}
                                            </button>
                                            <button onClick={() => handleSendPassword(merchant)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: 600, textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                                                <Key size={16} color="#6366f1" /> Mot de passe
                                            </button>
                                            <button onClick={() => handleSendAlert(merchant)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: 600, textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                                                <Bell size={16} color="#eab308" /> Envoyer une alerte
                                            </button>
                                            <div style={{ height: '1px', background: '#f0f0f0', margin: '4px 8px' }} />
                                            <button onClick={() => deleteMerchant(merchant.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#ef4444', fontWeight: 600, textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                                                <Trash2 size={16} /> Supprimer
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de création AVANCÉ */}
            {isCreateModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '32px', width: '100%', maxWidth: '750px', display: 'flex', flexDirection: 'column', maxHeight: 'max(600px, 90vh)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                        {/* Progress Bar */}
                        <div style={{ height: '6px', background: '#f3f4f6', width: '100%', flexShrink: 0 }}>
                            <div style={{ height: '100%', background: 'var(--primary)', width: `${(formStep / 3) * 100}%`, transition: 'width 0.3s ease' }} />
                        </div>

                        <div style={{ padding: '32px 40px 0', position: 'relative', flexShrink: 0 }}>
                            <button onClick={() => resetForm()} style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', zIndex: 10 }}><X size={24} /></button>

                            <div>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{isEditing ? 'Édition' : `Étape ${formStep} sur 3`}</span>
                                <h3 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 2px', color: '#111827' }}>
                                    {isEditing ? `Modifier ${selectedMerchant?.name}` : (formStep === 1 ? 'Identité du Marchand' : formStep === 2 ? 'Localisation & Contact' : 'Sécurité & Accès')}
                                </h3>
                                <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
                                    {isEditing ? 'Modifiez les informations du compte partenaire ci-dessous.' : (formStep === 1 ? 'Informations générales sur l\'enseigne et son activité.' : formStep === 2 ? 'Où se situe la boutique et comment la contacter ?' : 'Identifiants de connexion pour le compte partenaire.')}
                                </p>
                            </div>
                        </div>

                        <div style={{ padding: '24px 40px 40px', overflowY: 'auto', flex: 1 }}>
                            <form onSubmit={isEditing ? updateMerchant : (e) => { e.preventDefault(); if (formStep < 3) setFormStep(s => s + 1); else createMerchant(e); }}>
                                {formStep === 1 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-modal-form">
                                        <div className="grid-full-width">
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Nom de l'enseigne / Boutique</label>
                                            <input required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: NaturAfrik" />
                                        </div>
                                        <div className="mobile-full-width">
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Catégorie d'activité</label>
                                            <select style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px', background: '#fff' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                                <option>Alimentation</option>
                                                <option>Épices & Condiments</option>
                                                <option>Boissons</option>
                                                <option>Boucherie</option>
                                                <option>Fruits & Légumes</option>
                                                <option>Restaurant / Traiteur</option>
                                            </select>
                                        </div>
                                        <div className="mobile-full-width">
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>N° IFU (Identifiant Fiscal Unique)</label>
                                            <input style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px' }} value={formData.tax_id} onChange={e => setFormData({ ...formData, tax_id: e.target.value })} placeholder="Ex: 12023000..." />
                                        </div>
                                        <div className="grid-full-width">
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Description courte</label>
                                            <textarea rows={3} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px', fontFamily: 'inherit', resize: 'none' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Décrivez l'activité du marchand en quelques mots..." />
                                        </div>
                                    </div>
                                )}

                                {formStep === 2 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-modal-form">
                                        <div className="mobile-full-width">
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Pays</label>
                                            <select required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px', background: '#fff' }} value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })}>
                                                {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="mobile-full-width">
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Ville</label>
                                            {formData.country === 'Bénin' ? (
                                                <select required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px', background: '#fff' }} value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}>
                                                    {BENIN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                                                </select>
                                            ) : (
                                                <input required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px' }} value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Entrez la ville" />
                                            )}
                                        </div>
                                        <div className="grid-full-width">
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '12px' }}>Localisation précise (Google Maps)</label>

                                            {isLoaded ? (
                                                <>
                                                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                                                        <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '14px', zIndex: 10 }} />
                                                        <Autocomplete
                                                            onLoad={ref => autocompleteRef.current = ref}
                                                            onPlaceChanged={onPlaceChanged}
                                                        >
                                                            <input
                                                                style={{ width: '100%', padding: '14px 14px 14px 42px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px', background: '#fff', boxSizing: 'border-box' }}
                                                                placeholder="Rechercher un lieu précis (ex: Haie Vive)..."
                                                                value={formData.address}
                                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                            />
                                                        </Autocomplete>
                                                    </div>

                                                    <div style={{
                                                        width: '100%', height: '300px', borderRadius: '24px',
                                                        overflow: 'hidden', border: '1.5px solid #e5e7eb'
                                                    }}>
                                                        <GoogleMap
                                                            mapContainerStyle={{ width: '100%', height: '100%' }}
                                                            center={{ lat: formData.latitude, lng: formData.longitude }}
                                                            zoom={15}
                                                            onClick={onMapClick}
                                                            options={{
                                                                disableDefaultUI: false,
                                                                zoomControl: true,
                                                                streetViewControl: false,
                                                                mapTypeControl: false,
                                                            }}
                                                        >
                                                            <MarkerF
                                                                position={{ lat: formData.latitude, lng: formData.longitude }}
                                                                draggable={true}
                                                                onDragEnd={(e: any) => {
                                                                    if (e && e.latLng) {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            latitude: e.latLng.lat(),
                                                                            longitude: e.latLng.lng()
                                                                        }));
                                                                    }
                                                                }}
                                                            />
                                                        </GoogleMap>
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ height: '300px', background: '#f3f4f6', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <p style={{ color: '#9ca3af' }}>Chargement de la carte...</p>
                                                </div>
                                            )}
                                            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '12px', fontStyle: 'italic', lineHeight: '1.4' }}>
                                                Recherchez une adresse ci-dessus ou cliquez/déplacez le marqueur sur la carte pour définir l'emplacement précis.
                                            </p>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Téléphone Direct</label>
                                            <input required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px' }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Ex: +229 61 00 ..." />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Site Web (Optionnel)</label>
                                            <input style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px' }} value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://..." />
                                        </div>
                                    </div>
                                )}

                                {formStep === 3 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Email de connexion (Propriétaire)</label>
                                            <input type="email" required disabled={isEditing} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb', fontSize: '15px', background: isEditing ? '#f3f4f6' : '#fff' }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="boss@shop.com" />
                                        </div>
                                        {!isEditing && (
                                            <>
                                                <div style={{ padding: '20px', borderRadius: '18px', background: '#f0f9ff', border: '1.5px solid #bae6fd' }}>
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                        <div style={{ padding: '6px', borderRadius: '8px', background: '#e0f2fe' }}>
                                                            <Store size={18} color="#0369a1" />
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0369a1' }}>Génération automatique</p>
                                                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#0369a1', lineHeight: '1.5', opacity: 0.8 }}>
                                                                Un mot de passe sécurisé sera généré automatiquement. Vous pourrez le copier et le transmettre au marchand après la validation.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ padding: '16px', borderRadius: '16px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                                                    <p style={{ margin: 0, fontSize: '12px', color: '#0369a1', lineHeight: '1.5' }}>
                                                        <strong>Note importante :</strong> Un email de confirmation sera envoyé à cette adresse. Le marchand pourra changer son mot de passe lors de sa première connexion.
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                        {isEditing && (
                                            <div style={{ padding: '16px', borderRadius: '16px', background: '#fffbeb', border: '1px solid #fef3c7' }}>
                                                <p style={{ margin: 0, fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
                                                    L'email ne peut pas être modifié. Utilisez l'option "Mot de passe" du menu d'actions pour envoyer un lien de réinitialisation au marchand.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingBottom: '10px', gap: '16px' }}>
                                    {!isEditing && formStep > 1 && (
                                        <button type="button" onClick={() => setFormStep(s => s - 1)} style={{ padding: '16px 32px', borderRadius: '16px', background: '#f3f4f6', border: 'none', fontWeight: 700, cursor: 'pointer', color: '#4b5563' }}>
                                            Retour
                                        </button>
                                    )}
                                    {isEditing && (
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            {[1, 2, 3].map(step => (
                                                <button key={step} type="button" onClick={() => setFormStep(step)} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: formStep === step ? 'var(--primary)' : '#f3f4f6', color: formStep === step ? '#fff' : '#4b5563', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                                                    Sect. {step}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        disabled={processing}
                                        type="submit"
                                        style={{
                                            flex: 1, padding: '16px', borderRadius: '16px',
                                            background: 'var(--primary)', color: '#fff',
                                            border: 'none', fontWeight: 800, fontSize: '16px',
                                            cursor: 'pointer', boxShadow: '0 4px 12px rgba(251, 86, 7, 0.3)'
                                        }}
                                    >
                                        {processing ? 'Chargement...' : isEditing ? 'Sauvegarder les modifications' : formStep < 3 ? 'Continuer' : 'Finaliser la création'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Détails */}
            {isDetailModalOpen && selectedMerchant && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '32px', width: '100%', maxWidth: '600px', padding: '40px', position: 'relative' }}>
                        <button onClick={() => setIsDetailModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={24} /></button>

                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '32px' }}>
                            <div style={{ width: 80, height: 80, borderRadius: '24px', background: '#fb5607', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 900 }}>
                                {selectedMerchant.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>{selectedMerchant.name}</h3>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Marchand Certifié</span>
                                    <span style={{ width: 4, height: 4, background: '#d1d5db', borderRadius: '50%', alignSelf: 'center' }}></span>
                                    <span style={{ fontSize: '12px', color: '#fb5607', fontWeight: 700 }}>{selectedMerchant.status.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                            <div>
                                <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '12px' }}>Contacts</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                        <Mail size={16} color="#6b7280" /> {selectedMerchant.email}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                        <Phone size={16} color="#6b7280" /> {selectedMerchant.phone}
                                    </div>
                                    {selectedMerchant.website && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                            <Globe size={16} color="#6b7280" /> {selectedMerchant.website}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '12px' }}>Localisation</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                    <MapPin size={16} color="#6b7280" /> {selectedMerchant.address}
                                </div>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '24px', display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => toggleStatus(selectedMerchant)}
                                style={{
                                    flex: 1, padding: '14px', borderRadius: '14px', border: '1.5px solid #e5e7eb',
                                    background: '#fff', color: selectedMerchant.status === 'active' ? '#ef4444' : '#16a34a',
                                    fontWeight: 700, cursor: 'pointer'
                                }}
                            >
                                {selectedMerchant.status === 'active' ? 'Désactiver le compte' : 'Activer le compte'}
                            </button>
                            <button
                                onClick={() => deleteMerchant(selectedMerchant.id)}
                                style={{ padding: '14px', borderRadius: '14px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
