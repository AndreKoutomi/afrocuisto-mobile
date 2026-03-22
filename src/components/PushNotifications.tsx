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
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';

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
const DISMISSED_KEY = 'afrocuisto_dismissed_notifications';

function getSeenIds(): Set<string> {
    try {
        const raw = localStorage.getItem(SEEN_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

function getDismissedIds(): Set<string> {
    try {
        const raw = localStorage.getItem(DISMISSED_KEY);
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

function markAsDismissed(id: string) {
    const dismissed = getDismissedIds();
    dismissed.add(id);
    const arr = Array.from(dismissed).slice(-200);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr));
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
            const dismissed = getDismissedIds();
            // Filter out locally dismissed notifications
            const active = data.filter((n: PushNotif) => !dismissed.has(n.id));
            const unseen = active.filter((n: PushNotif) => !seen.has(n.id));

            setNotifications(active);
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

    // Dismiss a single notification locally (swipe to delete)
    const dismissNotification = useCallback((id: string) => {
        // Check BEFORE marking as seen — once markAsSeen() writes to localStorage,
        // getSeenIds() would always return true and the badge would never decrement.
        const wasUnseen = !getSeenIds().has(id);
        markAsDismissed(id);
        markAsSeen(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (wasUnseen) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
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
                const dismissed = getDismissedIds();
                if (dismissed.has(newNotif.id)) return;
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
                showBanner(newNotif);
            })
            .subscribe();

        return () => {
            (dbService.supabase as any)?.removeChannel(channel);
        };
    }, [fetchNotifications, showBanner]);

    return { notifications, unreadCount, currentBanner, dismissBanner, markAllRead, markOneRead, fetchNotifications, dismissNotification };
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
                    {/* Background Grid & Gradient Effect */}
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
// COMPOSANT: Carte swipeable (suppression individuelle par glissement)
// ─────────────────────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 80; // px au-delà desquels la suppression se déclenche

interface SwipeableNotifCardProps {
    notif: PushNotif;
    isDark: boolean;
    onDismiss: (id: string) => void;
    onTap: (notif: PushNotif) => void;
    formatRelativeTime: (d: string) => string;
}

function SwipeableNotifCard({ notif, isDark, onDismiss, onTap, formatRelativeTime }: SwipeableNotifCardProps) {
    const x = useMotionValue(0);
    const dragged = useRef(false);

    // Opacité & scale de l'icône poubelle — apparaît progressivement au glissement
    const trashOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20, 0, 20, SWIPE_THRESHOLD], [1, 0.6, 0, 0.6, 1]);
    const trashScale = useTransform(x, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [1.2, 0.6, 1.2]);
    // Fond rouge derrière la carte
    const bgOpacity = useTransform(x, [-SWIPE_THRESHOLD * 1.5, -20, 0, 20, SWIPE_THRESHOLD * 1.5], [1, 0.3, 0, 0.3, 1]);

    const handleDragEnd = () => {
        const currentX = x.get();
        if (Math.abs(currentX) >= SWIPE_THRESHOLD) {
            // Envoyer hors écran dans la direction du geste, puis supprimer
            const target = currentX > 0 ? 450 : -450;
            animate(x, target, { duration: 0.22, ease: 'easeOut' }).then(() => {
                onDismiss(notif.id);
            });
        } else {
            // Remettre en place avec un effet spring
            animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
        }
        // Remettre dragged à false après un court délai (pour distinguer click vs drag)
        setTimeout(() => { dragged.current = false; }, 50);
    };

    return (
        <div style={{ position: 'relative', marginBottom: 8, borderRadius: 20, overflow: 'hidden' }}>
            {/* Fond rouge avec icône poubelle (révélé lors du glissement) */}
            <motion.div
                style={{
                    position: 'absolute', inset: 0, borderRadius: 20,
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: bgOpacity,
                }}
            >
                <motion.div style={{
                    opacity: trashOpacity,
                    scale: trashScale,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                    </svg>
                    <span style={{ color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>Supprimer</span>
                </motion.div>
            </motion.div>

            {/* Carte principale, draggable horizontalement */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -200, right: 200 }}
                dragElastic={0.12}
                style={{
                    x,
                    position: 'relative',
                    display: 'flex', gap: 16, padding: '20px',
                    borderRadius: 20,
                    background: isDark ? '#18181b' : '#ffffff',
                    boxShadow: isDark
                        ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                        : '0 4px 10px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)',
                    overflow: 'hidden',
                    cursor: 'grab',
                    touchAction: 'pan-y',
                    userSelect: 'none',
                }}
                onDragStart={() => { dragged.current = true; }}
                onDragEnd={handleDragEnd}
                onClick={() => { if (!dragged.current) onTap(notif); }}
                whileTap={{ scale: 0.99 }}
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
                        {/* Hint glissement */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, opacity: 0.3 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#fff' : '#555'} strokeWidth="2.5" strokeLinecap="round">
                                <path d="M19 12H5M5 12l7 7M5 12l7-7" />
                            </svg>
                            <span style={{ fontSize: 10, fontWeight: 600, color: isDark ? '#fff' : '#888', letterSpacing: '0.04em' }}>
                                Glisser pour supprimer
                            </span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#fff' : '#555'} strokeWidth="2.5" strokeLinecap="round">
                                <path d="M5 12h14M14 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
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
    onDismissOne?: (id: string) => void;
    isDark?: boolean;
}

export function NotifCenter({ notifications, onMarkAllRead, onClose, onViewMore, onDismissOne, isDark }: NotifCenterProps) {
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
                {notifications.length > 0 && (
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: textSub, opacity: 0.7 }}>
                        ← Glissez gauche ou droite pour supprimer →
                    </p>
                )}
            </div>

            {/* Liste */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 20px' }}>
                {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                        <p style={{ color: textSub, fontSize: 14, margin: 0 }}>Aucune notification pour le moment</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {notifications.map(notif => (
                            <motion.div
                                key={notif.id}
                                layout
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                style={{ overflow: 'hidden' }}
                            >
                                <SwipeableNotifCard
                                    notif={notif}
                                    isDark={isDark ?? false}
                                    onDismiss={(id) => onDismissOne?.(id)}
                                    onTap={(n) => { onViewMore?.(n); onClose(); }}
                                    formatRelativeTime={formatRelativeTime}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
}
