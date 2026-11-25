import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, Loader2, AlertCircle, ShieldCheck, Eye, EyeOff, BookText, LayoutGrid, Smartphone } from '../components/SolarIcons';
import { useNavigate } from 'react-router-dom';
import logoAdmin from '../assets/logo_admin.png';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim(),
            });

            if (authError) throw authError;

            const { data: { user } } = await supabase.auth.getUser();
            const authorizedEmails = ['andre.koutomi98@gmail.com', 'deodadefassinou@gmail.com'];

            if (!user || !authorizedEmails.includes(user.email || '')) {
                await supabase.auth.signOut();
                throw new Error('Accès refusé : seuls les administrateurs autorisés peuvent se connecter.');
            }

            navigate('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Une erreur est survenue lors de la connexion.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            background: 'var(--bg-color)',
        }}>
            {/* Panneau gauche éditorial */}
            <div style={{
                background: 'radial-gradient(circle at 18% 22%, rgba(251, 86, 7, 0.28), transparent 55%), linear-gradient(155deg, #181615 0%, #121110 100%)',
                color: '#f5f3ef',
                padding: '48px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                        src={logoAdmin}
                        alt="AfroCuisto"
                        style={{ width: 42, height: 42, borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.14)' }}
                    />
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                            Afro<span style={{ color: '#fb5607' }}>Cuisto</span>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#a6a098', textTransform: 'uppercase' }}>
                            Studio CMS
                        </div>
                    </div>
                </div>

                <div style={{ maxWidth: '460px', margin: '48px 0' }}>
                    <span style={{
                        display: 'inline-block',
                        padding: '5px 12px',
                        borderRadius: '999px',
                        background: 'rgba(251, 86, 7, 0.16)',
                        color: '#ff8547',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginBottom: '18px',
                    }}>
                        Administration & Contenu Mobile
                    </span>
                    <h2 style={{ fontSize: '34px', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '16px' }}>
                        Pilotez tout le contenu d’AfroCuisto en temps réel.
                    </h2>
                    <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#a6a098', marginBottom: '32px' }}>
                        Publiez des recettes authentiques, organisez les sections de l’écran d’accueil, modérez la communauté et déployez vos mises à jour OTA.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { icon: BookText, text: 'Catalogue recettes & assistant IA culinaire' },
                            { icon: LayoutGrid, text: 'Sections dynamiques de l’application Android' },
                            { icon: Smartphone, text: 'Notifications & releases OTA instantanées' },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13.5px', fontWeight: 600, color: '#e5e0d8' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '9px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb5607', flexShrink: 0 }}>
                                        <Icon size={16} />
                                    </div>
                                    <span>{item.text}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ fontSize: '12px', color: '#7b756d', fontWeight: 600 }}>
                    AfroCuisto Studio — Back-Office Supabase
                </div>
            </div>

            {/* Panneau droit formulaire */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 24px',
            }}>
                <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px 36px' }}>
                    <div style={{ marginBottom: '28px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                            Connexion Studio
                        </h1>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
                            Entrez vos identifiants administrateur pour continuer.
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            marginBottom: '20px',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center',
                        }}>
                            <AlertCircle color="var(--danger)" size={18} style={{ flexShrink: 0 }} />
                            <p style={{ fontSize: '13px', color: 'var(--danger)', margin: 0, fontWeight: 600 }}>
                                {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label className="form-label">Adresse email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="admin@afrocuisto.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ paddingLeft: '40px', height: '46px' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Mot de passe</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingLeft: '40px', paddingRight: '42px', height: '46px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(s => !s)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', height: '46px', fontSize: '14px', marginTop: '6px' }}
                        >
                            {loading ? <Loader2 className="spinning" size={18} /> : <><LogIn size={17} /> Se connecter</>}
                        </button>
                    </form>

                    <div style={{
                        marginTop: '28px',
                        paddingTop: '18px',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}>
                        <ShieldCheck size={15} color="var(--success)" />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            Accès protégé par Supabase Auth
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
