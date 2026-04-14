/**
 * PullToRefresh — Composant élastique discret
 *
 * Usage :
 *   <PullToRefresh onRefresh={asyncFn} isDark={isDark} scrollRef={mainScrollRef}>
 *     (rendered inside the scrollable container)
 *   </PullToRefresh>
 *
 * scrollRef: ref du conteneur qui gère le scroll (ex: le <main>).
 * On écoute les touch events sur ce conteneur et on détecte
 * si scrollTop === 0 pour déclencher le pull.
 */
import React, { useRef, useState, useCallback, useEffect, RefObject } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

const PULL_THRESHOLD = 70;   // px à tirer pour déclencher le refresh
const MAX_PULL       = 100;  // plafond élastique (px)

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  isDark: boolean;
  /** Ref vers le conteneur SCROLLABLE (ex: <main>) — pour lire son scrollTop */
  scrollRef: RefObject<HTMLElement | null>;
  /** children = tout le contenu de la page */
  children: React.ReactNode;
  /** Activer / désactiver le PTR (ex: false si le formulaire de post est ouvert) */
  enabled?: boolean;
}

// Rubber-band: résistance croissante au fur et à mesure qu'on tire
const elasticDamp = (raw: number): number => {
  if (raw <= 0) return 0;
  return Math.min(MAX_PULL, raw * (1 - raw / (raw + 150)));
};

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  isDark,
  scrollRef,
  children,
  enabled = true,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Spring pour le déplacement vertical — donne le rebond élastique
  const pullY = useSpring(0, { stiffness: 320, damping: 32, mass: 0.55 });

  // Dérivés animés
  const indicatorOpacity = useTransform(pullY, [6, 24], [0, 1]);
  const indicatorScale   = useTransform(pullY, [0, PULL_THRESHOLD * 0.45], [0.5, 1]);
  const arrowRotate      = useTransform(pullY, [0, PULL_THRESHOLD], [0, 220]);

  const startY      = useRef(0);
  const curY        = useRef(0);
  const isValidPull = useRef(false); // true seulement si on a commencé depuis le top

  const getScroller = useCallback(
    () => scrollRef.current ?? null,
    [scrollRef]
  );

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return;
    const scroller = getScroller();
    if (!scroller) return;
    isValidPull.current = scroller.scrollTop <= 0;
    if (!isValidPull.current) return;
    startY.current = e.touches[0].clientY;
    curY.current   = e.touches[0].clientY;
  }, [enabled, isRefreshing, getScroller]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !isValidPull.current || isRefreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) { isValidPull.current = false; return; }
    curY.current = e.touches[0].clientY;
    pullY.set(elasticDamp(dy));
    // Bloquer le scroll natif uniquement si on tire vers le bas depuis le sommet
    if (dy > 5) e.preventDefault();
  }, [enabled, isRefreshing, pullY]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !isValidPull.current || isRefreshing) {
      pullY.set(0);
      isValidPull.current = false;
      return;
    }
    const dy = curY.current - startY.current;
    isValidPull.current = false;

    if (dy >= PULL_THRESHOLD) {
      // Seuil atteint → verrouiller en position "loading"
      pullY.set(PULL_THRESHOLD * 0.6);
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        pullY.set(0);
        // Un petit délai pour que l'animation de fermeture soit visible
        setTimeout(() => setIsRefreshing(false), 300);
      }
    } else {
      // Pas assez tiré → retour élastique
      pullY.set(0);
    }
  }, [enabled, isRefreshing, onRefresh, pullY]);

  // Attacher les listeners sur le scroller (main)
  useEffect(() => {
    const el = getScroller();
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove',  handleTouchMove,  { passive: false });
    el.addEventListener('touchend',   handleTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove',  handleTouchMove);
      el.removeEventListener('touchend',   handleTouchEnd);
    };
  }, [getScroller, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── Indicateur PTR ── */}
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'center',
          y: pullY,
        }}
      >
        <motion.div
          style={{
            marginTop: '10px',
            width: 34,
            height: 34,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: indicatorOpacity,
            scale: indicatorScale,
            background: isDark ? '#1c1c1e' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.06)',
            boxShadow: isDark
              ? '0 4px 20px rgba(0,0,0,0.5)'
              : '0 4px 20px rgba(0,0,0,0.10)',
          }}
        >
          {isRefreshing ? (
            // Spinner
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
              style={{
                width: 18, height: 18,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: '#fb5607',
                borderRightColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
              }}
            />
          ) : (
            // Flèche
            <motion.svg
              style={{ rotate: arrowRotate }}
              width="15" height="15" viewBox="0 0 15 15"
              fill="none"
            >
              <path
                d="M7.5 2.5v9M7.5 2.5L4.5 5.5M7.5 2.5l3 3"
                stroke="#fb5607"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </motion.div>
      </motion.div>

      {/* ── Contenu de la page décalé élastiquement ── */}
      <motion.div
        style={{ y: pullY, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
