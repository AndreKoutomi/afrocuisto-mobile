import {
    GalleryHorizontal, LayoutGrid, Flame, CalendarDays,
    Globe, Sparkles, Trophy, AlignJustify
} from '../components/SolarIcons';

export interface AppSectionTypeSpec {
    value: string;
    label: string;
    description: string;
    icon: any;
    color: string;
    bg: string;
}

/**
 * Types de sections correspondant exactement aux composants de HomeScreen.kt & HomeShowcaseSections.kt
 */
export const APP_SECTION_TYPES: AppSectionTypeSpec[] = [
    {
        value: 'carousel_hero',
        label: 'Carrousel Principal (Hero)',
        description: 'Grand carrousel portrait auto-défilant en haut de l’accueil (AppleAutoScrollDishCarousel)',
        icon: GalleryHorizontal,
        color: '#fb5607',
        bg: 'rgba(251, 86, 7, 0.12)',
    },
    {
        value: 'popular_grid',
        label: 'Grille 2 Colonnes (Populaires)',
        description: 'Grille de cartes recettes 2 colonnes (SunRecipeCard)',
        icon: LayoutGrid,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
    },
    {
        value: 'express_horizontal',
        label: 'Carrousel Horizontal Express',
        description: 'Liste horizontale compacte de recettes rapides (HomeExpressRecipesSection)',
        icon: Flame,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.12)',
    },
    {
        value: 'daily_menu',
        label: 'Menu du Jour',
        description: 'Carte d’inspiration Déjeuner / Dîner / Convivial (HomeDailyMenuSection)',
        icon: CalendarDays,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
    },
    {
        value: 'terroir_atlas',
        label: 'Atlas des Terroirs',
        description: 'Découverte interactive par région et pays (HomeTerroirAtlasSection)',
        icon: Globe,
        color: '#0891b2',
        bg: 'rgba(8, 145, 178, 0.12)',
    },
    {
        value: 'chef_secrets',
        label: 'Secrets de Chef',
        description: 'Astuces et techniques culinaires du terroir (HomeChefSecretsSection)',
        icon: Sparkles,
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.12)',
    },
    {
        value: 'weekly_challenge',
        label: 'Défi de la Semaine',
        description: 'Carte défi culinaire communautaire (HomeWeeklyChallengeSection)',
        icon: Trophy,
        color: '#ec4899',
        bg: 'rgba(236, 72, 153, 0.12)',
    },
    {
        value: 'categories',
        label: 'Catégories (Page Recettes)',
        description: 'Ajoute des catégories personnalisées affichées sur la page Recettes de l’app',
        icon: LayoutGrid,
        color: '#fb5607',
        bg: 'rgba(251, 86, 7, 0.12)',
    },
];

export function getAppSectionTypeMeta(type: string): AppSectionTypeSpec {
    return (
        APP_SECTION_TYPES.find((t) => t.value === type) || {
            value: type,
            label: type || 'Section App',
            description: 'Section personnalisée',
            icon: AlignJustify,
            color: '#6b7280',
            bg: 'rgba(107, 114, 128, 0.12)',
        }
    );
}
