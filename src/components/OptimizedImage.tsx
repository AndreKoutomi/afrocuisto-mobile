import React, { useState, useEffect } from 'react';

// Fonction utilitaire pour compresser l'URL visuellement
export function getOptimizedUrl(url: string | undefined | null, width: number = 600): string {
    if (!url) return '';
    // Conserver les images statiques, svg, base64 ou blob intactes
    if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:') || url.endsWith('.svg')) {
        return url;
    }
    
    try {
        const urlObj = new URL(url);
        
        // Unsplash: optimisation native ultra rapide
        if (urlObj.hostname === 'images.unsplash.com') {
            if(!urlObj.searchParams.has('w')) urlObj.searchParams.set('w', width.toString());
            urlObj.searchParams.set('q', '70');
            urlObj.searchParams.set('auto', 'format');
            return urlObj.toString();
        }
        
        // Les CDN proxy tiers comme wsrv peuvent causer de gros retards.
        // On retourne l'URL directe pour garantir un TTFB minimal.
        return url;
    } catch {
        return url;
    }
}

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string | undefined;
    widthHint?: number; // Astuce pour la taille
    priority?: boolean; // Permet de désactiver le lazy-loading pour les images "above the fold" (Haut de page)
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ src, widthHint = 600, priority = false, className = '', alt, ...props }) => {
    const [hasError, setHasError] = useState(false);
    
    // Si la source change, réinitialiser le statut d'erreur
    useEffect(() => {
        setHasError(false);
    }, [src]);

    const optimizedSrc = getOptimizedUrl(src, widthHint);

    return (
        <img
            src={hasError ? src : optimizedSrc}
            alt={alt || ''}
            className={`${className}`}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onError={() => setHasError(true)}
            {...props}
        />
    );
};
