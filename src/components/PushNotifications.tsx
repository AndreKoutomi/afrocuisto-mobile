/**
 * ============================================================================
 * HOOK DE NOTIFICATIONS PUSH - APP MOBILE
 * ============================================================================
 * Récupère les notifications Push envoyées depuis le CMS Admin via Supabase.
 * Écoute les nouvelles notifications en temps réel et les affiche sous forme
 * de bannière animée dans l'application.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { dbService } from '../dbService';
import { motion, AnimatePresence } from 'motion/react';

// Type d'une notification
export interface PushNotif {
    id: string;
    title: string;
    body: string;
    icon: string;
    color: string;
    link_type: string;
    link_id: string | null;
    sent_at: string;
    is_active: boolean;
}

const SEEN_KEY = 'afrocuisto_seen_notifications';

function getSeenIds(): Set<string> {
    try {
        const raw = localStorage.getItem(SEEN_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

function markAsSeen(id: string) {
    const seen = getSeenIds();
    seen.add(id);
    // Keep only the last 100 IDs to avoid bloat
    const arr = Array.from(seen).slice(-100);
    localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
}

// ─────────────────────────────────────────
// HOOK principal
// ─────────────────────────────────────────
export function usePushNotifications() {
    const [notifications, setNotifications] = useState<PushNotif[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentBanner, setCurrentBanner] = useState<PushNotif | null>(null);
    const bannerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showBanner = useCallback((notif: PushNotif) => {
        setCurrentBanner(notif);
        if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
        bannerTimeout.current = setTimeout(() => setCurrentBanner(null), 5000);
    }, []);

    const dismissBanner = useCallback(() => {
        setCurrentBanner(null);
        if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!dbService.supabase) return;
        try {
            const { data } = await (dbService.supabase as any)
                .from('push_notifications')
                .select('*')
                .eq('is_active', true)
                .order('sent_at', { ascending: false })
                .limit(30);

            if (!data) return;

            const seen = getSeenIds();
            const unseen = data.filter((n: PushNotif) => !seen.has(n.id));

            setNotifications(data);
            setUnreadCount(unseen.length);
        } catch (e) {
            // Silent fail — notifications are non-critical
        }
    }, [showBanner]);

    const markAllRead = useCallback(() => {
        notifications.forEach(n => markAsSeen(n.id));
        setUnreadCount(0);
    }, [notifications]);

    const markOneRead = useCallback((id: string) => {
        markAsSeen(id);
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    useEffect(() => {
        fetchNotifications();

        if (!dbService.supabase) return;

        // Realtime subscription for new notifications
        const channel = (dbService.supabase as any)
            .channel('push-notifications-channel')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'push_notifications',
            }, (payload: { new: PushNotif }) => {
                const newNotif = payload.new;
                if (!newNotif || !newNotif.is_active) return;
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
                showBanner(newNotif);
            })
            .subscribe();

        return () => {
            (dbService.supabase as any)?.removeChannel(channel);
        };
    }, [fetchNotifications, showBanner]);

    return { notifications, unreadCount, currentBanner, dismissBanner, markAllRead, markOneRead, fetchNotifications };
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT: Bannière Push (s'affiche en haut de l'écran)
// ─────────────────────────────────────────────────────────────────────────────
interface PushBannerProps {
    notif: PushNotif | null;
    onDismiss: () => void;
    onViewMore?: (notif: PushNotif) => void;
    isDark?: boolean;
}

export function PushNotifBanner({ notif, onDismiss, onViewMore, isDark }: PushBannerProps) {
    return (
        <AnimatePresence>
            {notif && (
                <motion.div
                    key={notif.id}
                    initial={{ y: -120, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -120, opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{
                        position: 'fixed',
                        top: 54,
                        left: 16,
                        right: 16,
                        zIndex: 9999,
                        borderRadius: 24,
                        background: isDark ? '#18181b' : '#ffffff',
                        boxShadow: isDark
                            ? '0 20px 25px -5px rgba(0,0,0,0.8), 0 8px 10px -6px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
                            : '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.03)',
                        overflow: 'hidden',
                        display: 'flex',
                    }}
                >
                    {/* Background Grid & Gradient Effect from the image */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, bottom: 0, width: '50%',
                        background: `radial-gradient(circle at top left, ${notif.color}15, transparent 70%)`,
                        pointerEvents: 'none',
                        zIndex: 0
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, bottom: 0, width: '50%',
                        backgroundImage: `
                            linear-gradient(to right, ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} 1px, transparent 1px),
                            linear-gradient(to bottom, ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} 1px, transparent 1px)
                        `,
                        backgroundSize: '18px 18px',
                        WebkitMaskImage: 'linear-gradient(to right, black, transparent)',
                        maskImage: 'linear-gradient(to right, black, transparent)',
                        pointerEvents: 'none',
                        zIndex: 0
                    }} />

                    <div style={{ position: 'relative', zIndex: 1, padding: '24px', display: 'flex', gap: 16, width: '100%' }}>
                        {/* Circle Icon */}
                        <div style={{
                            width: 52, height: 52, borderRadius: '50%',
                            background: isDark ? '#27272a' : '#ffffff',
                            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.06)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24, flexShrink: 0,
                        }}>
                            {notif.icon}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                            {/* Header (Title + X) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: isDark ? '#ffffff' : '#111827', lineHeight: 1.4 }}>
                                    <span style={{ color: isDark ? '#a1a1aa' : '#52525b' }}>AfroCuisto: </span>
                                    <span style={{ color: notif.color, fontWeight: 600 }}>{notif.title}</span>
                                </h4>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                                    style={{
                                        background: 'transparent', border: 'none', padding: 4, margin: '-4px -4px 0 0',
                                        cursor: 'pointer', color: isDark ? '#71717a' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            {/* Body text */}
                            <p style={{ margin: '0 0 20px 0', fontSize: 14, color: isDark ? '#a1a1aa' : '#52525b', lineHeight: 1.5 }}>
                                {notif.body}
                            </p>

                            {/* Actions buttons */}
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12 }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                                    style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 15, fontWeight: 500, color: isDark ? '#a1a1aa' : '#71717a', cursor: 'pointer' }}
                                >
                                    Fermer
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onViewMore?.(notif); onDismiss(); }}
                                    style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 15, fontWeight: 600, color: isDark ? '#ffffff' : '#18181b', cursor: 'pointer' }}
                                >
                                    Voir plus
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT: Centre de Notifications (liste complète)
// ─────────────────────────────────────────────────────────────────────────────
interface NotifCenterProps {
    notifications: PushNotif[];
    onMarkAllRead: () => void;
    onClose: () => void;
    onViewMore?: (notif: PushNotif) => void;
    isDark?: boolean;
}

export function NotifCenter({ notifications, onMarkAllRead, onClose, onViewMore, isDark }: NotifCenterProps) {
    const bg = isDark ? '#111' : '#fff';
    const textMain = isDark ? '#fff' : '#1a1a1a';
    const textSub = isDark ? 'rgba(255,255,255,0.5)' : '#6b7280';
    const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#f9f5f0';
    const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0';

    const formatRelativeTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'maintenant';
        if (mins < 60) return `il y a ${mins} min`;
        if (hours < 24) return `il y a ${hours}h`;
        return `il y a ${days}j`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{ background: bg, borderRadius: '24px 24px 0 0', overflow: 'hidden', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
        >
            {/* Header */}
            <div style={{ padding: '20px 20px 12px', borderBottom: `1px solid ${borderColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: textMain }}>Notifications</h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={onClose}
                            style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: cardBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textSub, fontSize: 18, fontWeight: 300 }}
                        >
                            ×
                        </button>
                    </div>
                </div>
            </div>

            {/* Liste */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 20px' }}>
                {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                        <p style={{ color: textSub, fontSize: 14, margin: 0 }}>Aucune notification pour le moment</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div
                            key={notif.id}
                            onClick={() => { onViewMore?.(notif); onClose(); }}
                            style={{
                                display: 'flex', gap: 16, padding: '20px',
                                borderRadius: 20, marginBottom: 8,
                                background: isDark ? '#18181b' : '#ffffff',
                                boxShadow: isDark
                                    ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                                    : '0 4px 10px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'pointer',
                            }}
                        >
                            {/* Background Grid & Gradient Effect */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%',
                                background: `radial-gradient(circle at top left, ${notif.color}10, transparent 70%)`,
                                pointerEvents: 'none', zIndex: 0
                            }} />
                            <div style={{
                                position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%',
                                backgroundImage: `
                                    linear-gradient(to right, ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px),
                                    linear-gradient(to bottom, ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)
                                `,
                                backgroundSize: '16px 16px',
                                WebkitMaskImage: 'linear-gradient(to right, black, transparent)',
                                maskImage: 'linear-gradient(to right, black, transparent)',
                                pointerEvents: 'none', zIndex: 0
                            }} />

                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 14, width: '100%', alignItems: 'flex-start' }}>
                                {/* Circle Icon */}
                                <div style={{
                                    width: 46, height: 46, borderRadius: '50%',
                                    background: isDark ? '#27272a' : '#ffffff',
                                    boxShadow: isDark ? '0 4px 10px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 22, flexShrink: 0,
                                }}>
                                    {notif.icon}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: isDark ? '#ffffff' : '#111827', lineHeight: 1.3 }}>
                                            <span style={{ color: isDark ? '#a1a1aa' : '#52525b' }}>AfroCuisto: </span>
                                            <span style={{ color: notif.color, fontWeight: 600 }}>{notif.title}</span>
                                        </h4>
                                        <span style={{ fontSize: 11, color: isDark ? '#71717a' : '#a1a1aa', flexShrink: 0, marginLeft: 8, whiteSpace: 'nowrap' }}>
                                            {formatRelativeTime(notif.sent_at)}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13, color: isDark ? '#a1a1aa' : '#52525b', lineHeight: 1.4, opacity: 0.9 }}>
                                        {notif.body}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
}


