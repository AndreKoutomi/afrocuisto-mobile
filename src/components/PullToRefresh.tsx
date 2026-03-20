import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    isDark?: boolean;
    scrollRef?: React.RefObject<HTMLElement>;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, isDark, scrollRef }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const y = useMotionValue(0);
    const THRESHOLD = 90;

    // Transform for visual feedback
    const rotate = useTransform(y, [0, THRESHOLD], [0, 360]);
    const opacity = useTransform(y, [0, 30, THRESHOLD], [0, 0.4, 1]);
    const scale = useTransform(y, [0, THRESHOLD], [0.7, 1]);

    const handleTouchStart = (e: React.TouchEvent) => {
        // Obtenir le scrollTop du conteneur parent ou de la fenêtre
        const scrollTop = scrollRef?.current?.scrollTop ?? window.scrollY;

        // On ne permet le pull-to-refresh QUE si on est tout en haut (scrollTop strict)
        if (scrollTop > 2 || isRefreshing) return;

        const touch = e.touches[0];
        const startY = touch.clientY;
        let isPulling = false;

        const handleTouchMove = (moveEvent: TouchEvent) => {
            const currentY = moveEvent.touches[0].clientY;
            const diff = currentY - startY;
            const currentScrollTop = scrollRef?.current?.scrollTop ?? window.scrollY;

            // On ne pull que si on est en haut et qu'on tire vers le bas
            if (diff > 0 && currentScrollTop <= 2) {
                isPulling = true;
                const resistance = 0.4;
                const pull = Math.min(diff * resistance, THRESHOLD * 1.4);
                y.set(pull);

                // Bloquer le scroll natif pendant qu'on "pull"
                if (pull > 5 && moveEvent.cancelable) {
                    moveEvent.preventDefault();
                }
            } else if (isPulling) {
                // Si on a commencé à pull mais qu'on remonte, on suit le doigt
                y.set(Math.max(0, diff * 0.4));
            }
        };

        const handleTouchEnd = async () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);

            if (y.get() >= THRESHOLD) {
                setIsRefreshing(true);
                animate(y, THRESHOLD, { type: 'spring', stiffness: 300, damping: 30 });

                try {
                    await onRefresh();
                } catch (err) {
                    console.error('Refresh failed:', err);
                } finally {
                    setIsRefreshing(false);
                    animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
                }
            } else {
                animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
            }
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
    };

    return (
        <div
            className="pull-to-refresh-container"
            style={{ position: 'relative', width: '100%', minHeight: '100%' }}
            onTouchStart={handleTouchStart}
        >
            {/* Premium Loading Indicator Overlay */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: THRESHOLD + 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999, // Floating ABOVE everything
                    y: useTransform(y, [0, THRESHOLD], [-60, 40]),
                    opacity,
                    scale,
                    pointerEvents: 'none'
                }}
            >
                <div style={{
                    background: isDark ? '#1a1a1a' : '#ffffff',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isDark
                        ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)'
                        : '0 8px 32px rgba(251, 86, 7, 0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                    position: 'relative'
                }}>
                    <motion.div
                        animate={{ rotate: isRefreshing ? 360 : 0 }}
                        transition={{
                            repeat: isRefreshing ? Infinity : 0,
                            duration: isRefreshing ? 1 : 0.5,
                            ease: "linear"
                        }}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isRefreshing
                                ? 'linear-gradient(45deg, #fb5607, #ffbe0b)'
                                : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                            boxShadow: isRefreshing ? '0 0 15px rgba(251, 86, 7, 0.4)' : 'none',
                        }}
                    >
                        <RefreshCw
                            size={18}
                            color={isRefreshing ? "#fff" : (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)")}
                            strokeWidth={3}
                        />
                    </motion.div>
                </div>
            </motion.div>

            {/* Static Content (No-push for stability) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
            </div>
        </div>
    );
};
