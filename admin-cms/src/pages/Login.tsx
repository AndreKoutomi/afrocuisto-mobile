import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoAdmin from '../assets/logo_admin.png';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                throw new Error("Accès refusé : Seuls les administrateurs autorisés peuvent se connecter.");
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #fb5607 0%, #ff006e 100%)',
            padding: '24px',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{
                width: '100%',
                maxWidth: '440px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '32px',
                padding: '48px 40px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative Elements */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '150px',
                    height: '150px',
                    background: 'rgba(251, 86, 7, 0.1)',
                    borderRadius: '50%',
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: '#fff',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            boxShadow: '0 10px 25px rgba(251, 86, 7, 0.15)',
                            overflow: 'hidden',
                            border: '4px solid #fff'
                        }}>
                            <img src={logoAdmin} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h1 style={{
                            fontSize: '28px',
                            fontWeight: 800,
                            color: '#111827',
                            margin: '0 0 8px',
                            letterSpacing: '-0.5px'
                        }}>
                            Admin AfroCuisto
                        </h1>
                        <p style={{
                            fontSize: '15px',
                            color: '#6b7280',
                            margin: 0,
                            fontWeight: 500
                        }}>
                            Connectez-vous pour gérer vos recettes
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fee2e2',
                            borderRadius: '16px',
                            padding: '16px',
                            marginBottom: '32px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <AlertCircle color="#ef4444" size={20} />
                            <p style={{
                                fontSize: '13px',
                                color: '#b91c1c',
                                margin: 0,
                                fontWeight: 600
                            }}>
                                {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                color: '#374151',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                paddingLeft: '4px'
                            }}>
                                Email Professionnel
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#9ca3af'
                                }} size={20} />
                                <input
                                    type="email"
                                    placeholder="nom@afrocuisto.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 16px 16px 52px',
                                        background: '#f9fafb',
                                        border: '2px solid #f3f4f6',
                                        borderRadius: '18px',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        color: '#111827',
                                        transition: 'all 0.2s',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.border = '2px solid #fb5607';
                                        e.currentTarget.style.background = '#fff';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.border = '2px solid #f3f4f6';
                                        e.currentTarget.style.background = '#f9fafb';
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                color: '#374151',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                paddingLeft: '4px'
                            }}>
                                Mot de passe
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#9ca3af'
                                }} size={20} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 16px 16px 52px',
                                        background: '#f9fafb',
                                        border: '2px solid #f3f4f6',
                                        borderRadius: '18px',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        color: '#111827',
                                        transition: 'all 0.2s',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.border = '2px solid #fb5607';
                                        e.currentTarget.style.background = '#fff';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.border = '2px solid #f3f4f6';
                                        e.currentTarget.style.background = '#f9fafb';
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: '12px',
                                background: '#fb5607',
                                color: '#fff',
                                padding: '18px',
                                borderRadius: '18px',
                                fontSize: '16px',
                                fontWeight: 800,
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                boxShadow: '0 10px 20px rgba(251, 86, 7, 0.2)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 15px 30px rgba(251, 86, 7, 0.3)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(251, 86, 7, 0.2)';
                                }
                            }}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Se connecter
                                </>
                            )}
                        </button>
                    </form>

                    <div style={{
                        marginTop: '40px',
                        paddingTop: '24px',
                        borderTop: '1px solid #f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <ShieldCheck size={16} color="#10b981" />
                        <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>
                            Accès sécurisé réservé au personnel autorisé
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
