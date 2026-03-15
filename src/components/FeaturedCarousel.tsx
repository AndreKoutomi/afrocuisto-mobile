/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Composant affichant le carrousel (les cartes qui défilent horizontalement) des plats mis en vedette.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import React from 'react';
import { motion } from 'motion/react';
import { Heart, Star, Clock } from 'lucide-react';
import { Recipe, User } from '../types';

interface FeaturedCarouselProps {
    section: any;
    recipes: Recipe[];
    setSelectedRecipe: (r: Recipe) => void;
    currentUser: User | null;
    toggleFavorite: (id: string) => void;
    isDark?: boolean;
    merchants?: any[];
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
    section,
    recipes,
    setSelectedRecipe,
    currentUser,
    toggleFavorite,
    isDark,
    merchants = []
}) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [isInteracting, setIsInteracting] = React.useState(false);
    const interactionTimeout = React.useRef<NodeJS.Timeout | null>(null);

    const handleInteraction = (interacting: boolean) => {
        setIsInteracting(interacting);
        if (interactionTimeout.current) clearTimeout(interactionTimeout.current);

        if (interacting) {
            // Auto-reset interacting state after 5 seconds of inactivity (especially for mobile)
            interactionTimeout.current = setTimeout(() => {
                setIsInteracting(false);
            }, 5000);
        }
    };

    const displayItems = section?.type === 'advertising'
        ? merchants.filter(m => (section.config?.merchant_ids || section.merchant_ids || []).includes(m.id))
        : recipes;

    const n = displayItems.length;

    const config = section?.config || {};
    const rawAutoScroll = config.auto_scroll ?? config.autoScroll ?? config.autoscroll;
    const shouldAutoScroll = rawAutoScroll === true || rawAutoScroll === 'true' ||
        rawAutoScroll === 1 || rawAutoScroll === '1' || (section?.title?.toLowerCase() === 'test');
    const rawInterval = config.scroll_interval ?? config.scrollInterval ?? config.interval;
    const intervalTime = Number(rawInterval) || 4000;

    React.useEffect(() => {
        console.log(`[Carousel Debug] ${section?.title} - shouldAutoScroll: ${shouldAutoScroll}, isInteracting: ${isInteracting}`);

        if (!shouldAutoScroll || isInteracting || n <= 1 || !scrollRef.current) return;

        const interval = setInterval(() => {
            const container = scrollRef.current;
            if (container) {
                const cardWidth = section?.type === 'banner' ? 330 + 16 : 280 + 16;
                const maxScroll = container.scrollWidth - container.clientWidth;

                console.log(`[Carousel Debug] Rolling: ${container.scrollLeft} / ${maxScroll}`);

                const currentScroll = Math.ceil(container.scrollLeft);
                const behavior = (config.scroll_behavior || 'smooth') as ScrollBehavior;

                if (currentScroll >= maxScroll - 20) {
                    container.scrollTo({ left: 0, behavior });
                } else {
                    container.scrollBy({ left: cardWidth, behavior });
                }
            }
        }, intervalTime);

        return () => {
            clearInterval(interval);
            if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
        };
    }, [n, section?.id, shouldAutoScroll, intervalTime, isInteracting]);

    if (!n) return null;

    const isFav = (id: string) => currentUser?.favorites?.includes(id) ?? false;

    return (
        <section style={{ marginBottom: '12px', marginLeft: '-20px' }}>
            {/* Section header */}
            {section?.title && (
                <div style={{ padding: '0 32px 16px ', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: isDark ? '#ffffff' : '#111827', letterSpacing: '-0.02em' }}>
                            {section.title}
                        </h2>
                        {section?.subtitle && (
                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#6b7280', fontWeight: 600, letterSpacing: '0.04em' }}>
                                {section.subtitle}
                            </p>
                        )}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fb5607', cursor: 'pointer' }}>
                        Voir tout
                    </span>
                </div>
            )}

            {/* Horizontal Scroll Area */}
            <div
                ref={scrollRef}
                className="hide-scrollbar"
                onMouseEnter={() => handleInteraction(true)}
                onMouseLeave={() => handleInteraction(false)}
                onTouchStart={() => handleInteraction(true)}
                onTouchEnd={() => handleInteraction(false)}
                style={{
                    display: 'flex',
                    gap: 16,
                    overflowX: 'auto',
                    padding: '20px 32px 15px 50px',
                    // scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {displayItems.map((item, index) => {
                    const isRecipe = section?.type !== 'advertising';
                    const recipe = isRecipe ? item as Recipe : null;
                    const merchant = !isRecipe ? item : null;
                    const isFavorite = isRecipe ? isFav(recipe!.id) : false;

                    if (section?.type === 'banner') {
                        return (
                            <div
                                key={recipe.id}
                                onClick={() => setSelectedRecipe(recipe)}
                                style={{
                                    flexShrink: 0,
                                    width: '340px',
                                    scrollSnapAlign: 'start',
                                    cursor: 'pointer',
                                    position: 'relative',
                                }}
                            >
                                <div style={{
                                    width: '100%',
                                    height: '200px',
                                    borderRadius: '28px',
                                    background: '#ff5722',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '20px 24px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 15px rgba(255, 87, 34, 0.25)',
                                }}>
                                    {/* Left Content */}
                                    <div style={{ flex: 1, zIndex: 10, maxWidth: '55%' }}>
                                        <h3 style={{
                                            margin: 0, fontSize: '24px', fontWeight: 900, color: '#fff',
                                            lineHeight: 1.1, letterSpacing: '-0.02em',
                                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                        }}>
                                            {recipe.name}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                            {/* Rating Badge */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                                padding: '4px 10px', borderRadius: '20px',
                                                backdropFilter: 'blur(4px)'
                                            }}>
                                                <Star size={12} fill="#fff" color="#fff" strokeWidth={0} />
                                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>
                                                    {(4.0 + (index % 5) * 0.2).toFixed(1)}
                                                </span>
                                            </div>
                                            {/* Prep Time Badge */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                                padding: '4px 10px', borderRadius: '20px',
                                                backdropFilter: 'blur(4px)'
                                            }}>
                                                <Clock size={12} color="#fff" strokeWidth={2.5} />
                                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>
                                                    {recipe.prepTime}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Region Badge */}
                                        <div style={{ marginTop: '12px' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                backgroundColor: isDark ? '#ffffff4d' : 'rgba(255, 255, 255, 0.95)',
                                                boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.1)',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '10px',
                                                fontWeight: 900,
                                                color: '#ff5722',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0',
                                                border: isDark ? '1px solid rgba(255, 87, 34, 0.3)' : 'none'
                                            }}>
                                                {recipe.region}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right Image Content */}
                                    <div style={{
                                        position: 'absolute',
                                        right: '-15px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '180px',
                                        height: '180px',
                                        borderRadius: '50%',
                                        zIndex: 5,
                                        backgroundColor: '#ddd',
                                        overflow: 'hidden',
                                        border: '6px solid rgba(255, 255, 255, 0.2)',
                                        boxShadow: '0 12px 25px rgba(0,0,0,0.2)'
                                    }}>
                                        <img
                                            src={recipe.image}
                                            alt={recipe.name}
                                            draggable={false}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>

                                </div>
                            </div>
                        );
                    }

                    if (section?.type === 'advertising' && merchant) {
                        const slideConfig = section.config?.slides?.[merchant.id] || {};
                        const title = slideConfig.title || merchant.name || section.title;
                        const subtitle = slideConfig.subtitle || section.subtitle || merchant.category || 'Découvrez nos offres';
                        const background = slideConfig.background || 'linear-gradient(135deg, #fb5607, #ff8c42)';
                        const buttonText = slideConfig.button_text || 'Visiter la boutique';
                        const tagText = slideConfig.tag || 'Publicité';
                        const emoji = slideConfig.emoji || '';

                        return (
                            <div
                                key={merchant.id}
                                style={{
                                    flexShrink: 0,
                                    width: '340px',
                                    scrollSnapAlign: 'start',
                                    cursor: 'pointer',
                                    position: 'relative',
                                }}
                            >
                                <div style={{
                                    width: '100%',
                                    height: '200px',
                                    borderRadius: '28px',
                                    background: background,
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '20px 24px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: '0 8px 25px rgba(251, 86, 7, 0.3)',
                                }}>
                                    <div style={{ flex: 1, zIndex: 10, maxWidth: '60%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '10px',
                                                fontWeight: 800,
                                                color: '#fff',
                                                textTransform: 'uppercase',
                                            }}>
                                                {tagText}
                                            </span>
                                            {emoji && <span style={{ fontSize: '16px' }}>{emoji}</span>}
                                        </div>
                                        <h3 style={{
                                            margin: 0, fontSize: '22px', fontWeight: 900, color: '#fff',
                                            lineHeight: 1.1, letterSpacing: '-0.02em',
                                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                        }}>
                                            {title}
                                        </h3>
                                        <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                                            {subtitle}
                                        </p>
                                        <div style={{
                                            marginTop: '16px',
                                            backgroundColor: '#fff',
                                            color: '#fb5607',
                                            padding: '8px 16px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 800,
                                            display: 'inline-block'
                                        }}>
                                            {buttonText}
                                        </div>
                                    </div>

                                    {/* Merchant Logo/Image */}
                                    <div style={{
                                        position: 'absolute',
                                        right: '-10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '150px',
                                        height: '150px',
                                        borderRadius: '50%',
                                        zIndex: 5,
                                        backgroundColor: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '10px',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                    }}>
                                        <img
                                            src={merchant.logo_url || '/logo_admin.png'}
                                            alt={merchant.name}
                                            draggable={false}
                                            style={{ width: '85%', height: '85%', objectFit: 'contain' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Dynamic widths based on the visual style (narrow, medium, wide pattern)
                    const widths = ['280px', '280px', '280px'];
                    const cardWidth = widths[index % widths.length];

                    return (
                        <div
                            key={isRecipe ? recipe!.id : merchant!.id}
                            onClick={() => isRecipe && setSelectedRecipe(recipe!)}
                            style={{
                                flexShrink: 0,
                                width: cardWidth,
                                scrollSnapAlign: 'start',
                                display: 'flex',
                                flexDirection: 'column',
                                cursor: 'pointer',
                                position: 'relative',
                            }}
                        >
                            {/* Image Container */}
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                height: '360px', // Fixed height for alignment
                                borderRadius: 28,
                                overflow: 'hidden',
                                boxShadow: '0 12px 10px rgba(131, 131, 131, 0.18)',
                                backgroundColor: '#f3f4f6',
                            }}>
                                <img
                                    src={isRecipe ? recipe!.image : '/logo_admin.png'}
                                    alt={isRecipe ? recipe!.name : merchant!.name}
                                    draggable={false}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />

                                {/* Dark Gradient Overlay at bottom for text readability */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '20%',
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                                    pointerEvents: 'none',
                                }} />

                                {/* Heart Button Inside Image */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); isRecipe && toggleFavorite(recipe!.id); }}
                                    style={{
                                        position: 'absolute', top: 12, right: 12,
                                        width: 32, height: 32, borderRadius: '50%',
                                        background: 'rgba(252, 251, 251, 0.65)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 4px 4px rgba(0,0,0,0.15)',
                                        cursor: 'pointer',
                                        zIndex: 10,
                                    }}
                                >
                                    <Heart
                                        size={16}
                                        fill={isFavorite ? '#f43f5e' : 'none'}
                                        color={isFavorite ? '#f43f5e' : '#f43f5e'}
                                        strokeWidth={isFavorite ? 0 : 2.5}
                                    />
                                </button>

                                {/* Rating Badge - Top Left */}
                                <div style={{
                                    position: 'absolute', top: 12, left: 12,
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(10px)',
                                    padding: '5px 10px',
                                    borderRadius: '14px',
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    zIndex: 10,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    border: '1px solid rgba(255, 255, 255, 0.5)'
                                }}>
                                    <Star size={12} fill="#fb5607" color="#fb5607" strokeWidth={0} />
                                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#111827' }}>
                                        {(4.0 + (index % 5) * 0.2).toFixed(1)}
                                    </span>
                                </div>

                                {/* Title Overlay centered at the bottom */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 16,
                                    left: 0,
                                    right: 0,
                                    padding: '0 12px',
                                    textAlign: 'center',
                                    color: '#ffffff',
                                    zIndex: 5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}>
                                    <p style={{
                                        margin: '0 0 6px',
                                        fontSize: '9px',
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.12em',
                                        color: '#ffffff',
                                        backgroundColor: 'rgba(251, 86, 7, 0.85)',
                                        padding: '4px 10px',
                                        borderRadius: '50px',
                                        backdropFilter: 'blur(4px)',
                                        boxShadow: '0 4px 10px rgba(251, 86, 7, 0.3)',
                                    }}>
                                        {isRecipe ? recipe!.region : (merchant!.category || 'Commerce')}
                                    </p>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: '18px',
                                        fontWeight: 800,
                                        lineHeight: 1.2,
                                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                        wordBreak: 'break-word',
                                        fontFamily: 'Montserrat, sans-serif'
                                    }}>
                                        {isRecipe ? recipe!.name : merchant!.name}
                                    </h3>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: 6, marginTop: 10,
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        backdropFilter: 'blur(12px)',
                                        padding: '5px 12px',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                    }}>
                                        <Clock size={12} color="#ffffff" strokeWidth={3} />
                                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>
                                            {isRecipe ? recipe!.prepTime : '30 min'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
