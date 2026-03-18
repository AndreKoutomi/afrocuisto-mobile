import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    isDark?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, isDark }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const y = useMotionValue(0);
    const THRESHOLD = 100;

    // Transform for visual feedback
    const rotate = useTransform(y, [0, THRESHOLD], [0, 360]);
    const opacity = useTransform(y, [0, 40, THRESHOLD], [0, 0.4, 1]);
    const scale = useTransform(y, [0, THRESHOLD], [0.8, 1]);

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only allow pull-to-refresh if we are at the top of the scroll
        if (window.scrollY > 5 || isRefreshing) return;

        const touch = e.touches[0];
        const startY = touch.clientY;
        let isPulling = false;

        const handleTouchMove = (moveEvent: TouchEvent) => {
            const currentY = moveEvent.touches[0].clientY;
            const diff = currentY - startY;

            if (diff > 0 && window.scrollY <= 5) {
                // We are pulling down from the top
                isPulling = true;
                // Apply resistance: pull gets harder as you pull more
                const resistance = 0.45;
                const pull = Math.min(diff * resistance, THRESHOLD * 1.6);
                y.set(pull);

                // Prevent default only if we are actually pulling, to not break normal scroll
                if (pull > 5 && moveEvent.cancelable) {
                    moveEvent.preventDefault();
                }
            } else {
                isPulling = false;
                y.set(0);
            }
        };

        const handleTouchEnd = async () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);

            if (y.get() >= THRESHOLD) {
                setIsRefreshing(true);
                // Snap to threshold while refreshing
                animate(y, THRESHOLD, { type: 'spring', stiffness: 300, damping: 30 });

                try {
                    await onRefresh();
                } catch (err) {
                    console.error('Pull to refresh failed:', err);
                } finally {
                    setIsRefreshing(false);
                    // Snap back to 0
                    animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
                }
            } else {
                // Snap back to 0 if threshold not reached
                animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
            }
        };

        // Use non-passive to allow preventDefault
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
    };

    return (
        <div
            className="pull-to-refresh-container"
            style={{ position: 'relative', width: '100%', minHeight: '100%' }}
            onTouchStart={handleTouchStart}
        >
            {/* Loading Indicator Indicator */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: THRESHOLD,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999, // Above everything
                    y,
                    opacity,
                    scale,
                    pointerEvents: 'none' // Don't block touches
                }}
            >
                <div style={{
                    background: isDark ? '#1a1a1a' : '#ffffff',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                    border: isDark ? '1px solid #ffffff15' : '1px solid #00000008',
                }}>
                    <motion.div
                        style={{ rotate }}
                        animate={isRefreshing ? { rotate: 360 } : {}}
                        transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : { duration: 0 }}
                        className="flex items-center justify-center"
                    >
                        <RefreshCw size={22} color="#fb5607" strokeWidth={3} />
                    </motion.div>
                </div>
            </motion.div>

            {/* Main Content with subtle push down */}
            <motion.div
                style={{
                    y: useTransform(y, [0, THRESHOLD], [0, 15]), // Slight push down for content
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {children}
            </motion.div>
        </div>
    );
};
