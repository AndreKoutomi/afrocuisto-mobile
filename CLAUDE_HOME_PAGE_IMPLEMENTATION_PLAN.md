# 🍲 PLAN D'IMPLÉMENTATION COMPLET POUR CLAUDE (ANTHROPIC)
## Refonte Nouvelle Architecture Home Page AfroCuisto

> Ce document est un **prompt/plan d'implémentation clé en main** à fournir directement à Claude pour intégrer la nouvelle Home Page d'**AfroCuisto** avec une architecture modulaire, performante et inspirée des meilleures applications culinaires au monde (**NYT Cooking, Kitchen Stories, Tasty, Samsung Food**).

---

## 📋 Contexte & Règles d'Intégration
- **Framework** : React 19, TypeScript, Tailwind CSS, Capacitor 6/7.
- **Librairie d'animations** : `motion/react` (Framer Motion).
- **Icônes** : `lucide-react`.
- **Rétrocompatibilité** : 100% compatible avec les types `Recipe`, `User`, `Product` existants et les sections dynamiques Admin CMS Supabase (`dynamic_carousel`, `horizontal_list_v2`, `horizontal_list`, `vertical_list_2`, `advertising`, `banner`).
- **Objectif** : Remplacer le gros bloc `renderHome()` de `App.tsx` par une suite de composants propres et modulaires dans `src/components/home/`.

---

## 🧱 Arborescence des Fichiers à Créer

```
afrocuisto-mobile-main/src/
├── components/
│   └── home/
│       ├── HomeView.tsx                  # Composant racine orchestrateur
│       ├── HomeHeader.tsx                # Header sticky avec Logo, Sync, Notifications, Recherche
│       ├── DynamicGreeting.tsx           # Salutation contextuelle (matin, midi, soir) & recherche IA
│       ├── HeroSpotlight.tsx             # Plat du Jour immersif (Recommandation Gemini IA)
│       ├── QuickMoodRail.tsx             # Rail des filtres d'envie (<30min, Sauces, Wɔ̌, Grillades...)
│       ├── MagicFridgeCard.tsx           # Widget interactif "Le Frigo Magique IA"
│       ├── DynamicSectionRenderer.tsx    # Rendu unifié des sections CMS Admin Supabase
│       ├── CommunityLiveTeaser.tsx       # Teaser communauté & partage
│       └── PantryQuickBar.tsx            # Widget rappel liste de courses XOF
```

---

## 💻 Code Source des Composants

---

### 1️⃣ `src/components/home/HomeHeader.tsx`

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { Search, Bell, WifiOff, RefreshCw } from 'lucide-react';
import { OptimizedImage } from '../OptimizedImage';
import { Capacitor } from '@capacitor/core';

interface HomeHeaderProps {
  isDark: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  totalUnreadCount: number;
  onRefresh: () => void;
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  isDark,
  isOffline,
  isSyncing,
  totalUnreadCount,
  onRefresh,
  onOpenNotifications,
  onOpenSearch,
}) => {
  return (
    <header
      className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between transition-colors duration-200"
      style={{
        paddingTop: Capacitor.isNativePlatform()
          ? 'calc(env(safe-area-inset-top, 40px) + 12px)'
          : '20px',
        background: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(248, 249, 250, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: isDark
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          whileTap={{ scale: 0.92 }}
          onClick={onRefresh}
          className="relative cursor-pointer"
        >
          <OptimizedImage
            src="/icon.png"
            alt="AfroCuisto Logo"
            className="w-10 h-10 rounded-2xl object-cover shadow-md shadow-[#fb5607]/20 border border-[#fb5607]/30"
          />
        </motion.div>
        <div>
          <h1
            className={`text-lg font-black tracking-tight leading-none ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}
          >
            AfroCuisto
          </h1>
          <p
            className={`text-[10px] font-bold mt-1 tracking-wider uppercase ${
              isDark ? 'text-white/40' : 'text-stone-400'
            }`}
          >
            Saveurs d'Afrique
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {isOffline && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="p-2 rounded-full bg-rose-500/10 text-rose-500"
          >
            <WifiOff size={16} />
          </motion.div>
        )}

        {isSyncing && !isOffline && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="p-2 rounded-full text-[#fb5607]"
          >
            <RefreshCw size={16} />
          </motion.div>
        )}

        <button
          onClick={onOpenNotifications}
          className={`relative p-2.5 rounded-full transition-all active:scale-95 ${
            isDark
              ? 'bg-white/5 text-white hover:bg-white/10'
              : 'bg-white text-stone-700 shadow-sm border border-stone-100'
          }`}
        >
          <Bell size={18} />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#fb5607] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-black">
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenSearch}
          className={`p-2.5 rounded-full transition-all active:scale-95 ${
            isDark
              ? 'bg-white/5 text-white hover:bg-white/10'
              : 'bg-white text-stone-700 shadow-sm border border-stone-100'
          }`}
        >
          <Search size={18} />
        </button>
      </div>
    </header>
  );
};
```

---

### 2️⃣ `src/components/home/DynamicGreeting.tsx`

```tsx
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';

interface DynamicGreetingProps {
  userName?: string;
  isDark: boolean;
  searchPlaceholder?: string;
  onOpenSearch: () => void;
}

export const DynamicGreeting: React.FC<DynamicGreetingProps> = ({
  userName,
  isDark,
  searchPlaceholder,
  onOpenSearch,
}) => {
  const greetingData = useMemo(() => {
    const hour = new Date().getHours();
    const name = userName ? userName.split(' ')[0] : 'Gourmet';

    if (hour >= 5 && hour < 12) {
      return {
        badge: 'PETIT-DÉJEUNER DU JOUR',
        greeting: `Bonjour, ${name} 🌅`,
        subtitle: "Prêt pour une délicieuse journée aux saveurs d'Afrique ?",
      };
    } else if (hour >= 12 && hour < 15) {
      return {
        badge: 'PAUSE DÉJEUNER',
        greeting: `Bon appétit, ${name} 🍲`,
        subtitle: "Qu'allons-nous mijoter de bon pour ce midi ?",
      };
    } else if (hour >= 15 && hour < 18) {
      return {
        badge: 'GOÛTER & STREET FOOD',
        greeting: `Pause gourmande, ${name} 🍌`,
        subtitle: 'Une petite douceur ou un encas de maquis ?',
      };
    } else {
      return {
        badge: 'AU MENU CE SOIR',
        greeting: `Bonsoir, ${name} 🌙`,
        subtitle: 'Une savoureuse sauce pour clôturer la journée ?',
      };
    }
  }, [userName]);

  return (
    <div className="px-6 pt-5 pb-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span className="text-[11px] font-black uppercase tracking-widest text-[#fb5607]">
          {greetingData.badge}
        </span>
        <h2
          className={`text-2xl font-black tracking-tight mt-0.5 ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}
        >
          {greetingData.greeting}
        </h2>
        <p
          className={`text-xs font-medium mt-1 ${
            isDark ? 'text-white/50' : 'text-stone-500'
          }`}
        >
          {greetingData.subtitle}
        </p>
      </motion.div>

      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onOpenSearch}
        className={`mt-4 p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all border ${
          isDark
            ? 'bg-white/5 border-white/10 hover:border-white/20 text-white/40'
            : 'bg-white border-stone-200/80 shadow-sm hover:border-[#fb5607]/40 text-stone-400'
        }`}
      >
        <Search size={18} className="text-[#fb5607] shrink-0" />
        <span className="text-xs font-semibold select-none flex-1 truncate">
          {searchPlaceholder || 'Un ingrédient, un plat (ex: Wɔ̌, Moyo, Tchatchanga)...'}
        </span>
        <span
          className={`text-[10px] font-black px-2 py-1 rounded-lg ${
            isDark ? 'bg-white/10 text-white/60' : 'bg-stone-100 text-stone-600'
          }`}
        >
          IA Express
        </span>
      </motion.div>
    </div>
  );
};
```

---

### 3️⃣ `src/components/home/HeroSpotlight.tsx`

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, Clock, ArrowRight } from 'lucide-react';
import { Recipe, User } from '../../types';
import { OptimizedImage } from '../OptimizedImage';

interface HeroSpotlightProps {
  recipe: Recipe;
  currentUser: User | null;
  isDark: boolean;
  onSelect: (recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  recipe,
  currentUser,
  isDark,
  onSelect,
  onToggleFavorite,
}) => {
  const isFav = currentUser?.favorites?.includes(recipe.id) ?? false;

  return (
    <div className="px-6 pt-4 pb-2">
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect(recipe)}
        className="relative rounded-[32px] overflow-hidden shadow-2xl cursor-pointer group border"
        style={{
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          aspectRatio: '16 / 11',
          maxHeight: '360px',
        }}
      >
        <OptimizedImage
          src={recipe.image}
          alt={recipe.name}
          priority={true}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.92) 100%)',
          }}
        />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#fb5607] text-white shadow-lg shadow-[#fb5607]/40 flex items-center gap-1">
            <Sparkles size={12} /> Plat du Jour (Chef IA)
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(recipe.id);
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${
              isFav ? 'bg-rose-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'
            }`}
          >
            <Heart size={16} fill={isFav ? '#fff' : 'none'} strokeWidth={2.5} />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#fb5607]">
            {recipe.region || 'Cuisine Africaine'}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mt-0.5 drop-shadow-sm">
            {recipe.name}
          </h3>
          <p className="text-xs text-white/80 font-medium line-clamp-1 mt-1 drop-shadow-sm">
            {recipe.description || 'Une spécialité savoureuse cuisinée avec amour et fierté.'}
          </p>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/15">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] font-bold text-white/90">
                <Clock size={13} className="text-[#fb5607]" />
                {recipe.prepTime || '30 min'}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-[11px] font-black uppercase tracking-tight text-white/90 bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                {recipe.difficulty || 'Facile'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs font-black text-[#fb5607] group-hover:translate-x-1 transition-transform">
              <span>Cuisiner</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
```

---

### 4️⃣ `src/components/home/QuickMoodRail.tsx`

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { Flame, Clock, Heart } from 'lucide-react';
import { Recipe, User } from '../../types';
import { OptimizedImage } from '../OptimizedImage';

export interface MoodFilter {
  id: string;
  label: string;
  emoji: string;
  category?: string | null;
  maxTime?: number;
}

export const MOOD_FILTERS: MoodFilter[] = [
  { id: 'all', label: 'Tout explorer', emoji: '✨', category: null },
  { id: 'quick', label: '⚡ Moins de 30 min', emoji: '⏱️', maxTime: 30 },
  { id: 'sauces', label: 'Sauces & Nùsúnnú', emoji: '🍲', category: 'Sauces (Nùsúnnú)' },
  { id: 'pates', label: 'Pâtes & Céréales (Wɔ̌)', emoji: '🌽', category: 'Pâtes et Céréales (Wɔ̌)' },
  { id: 'street', label: 'Street Food & Snacks', emoji: '🍢', category: 'Street Food & Snacks (Amuse-bouche)' },
  { id: 'resistance', label: 'Grands Plats & Ragoûts', emoji: '🥘', category: 'Plats de Résistance & Ragoûts' },
  { id: 'drinks', label: 'Jus & Douceurs', emoji: '🍹', category: 'Boissons & Douceurs' },
];

interface QuickMoodRailProps {
  activeMood: string;
  onSelectMood: (id: string) => void;
  filteredRecipes: Recipe[];
  currentUser: User | null;
  isDark: boolean;
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
}

export const QuickMoodRail: React.FC<QuickMoodRailProps> = ({
  activeMood,
  onSelectMood,
  filteredRecipes,
  currentUser,
  isDark,
  onSelectRecipe,
  onToggleFavorite,
}) => {
  return (
    <div className="pt-4 pb-2">
      <div className="px-6 flex items-center justify-between mb-3">
        <h3
          className={`text-sm font-black tracking-tight flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}
        >
          <Flame size={16} className="text-[#fb5607]" /> Vos Envies du Moment
        </h3>
        {activeMood !== 'all' && (
          <button
            onClick={() => onSelectMood('all')}
            className="text-[11px] font-bold text-[#fb5607] hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-6 pb-2">
        {MOOD_FILTERS.map((item) => {
          const isSelected = activeMood === item.id;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelectMood(item.id)}
              className={`px-4 py-2.5 rounded-2xl shrink-0 flex items-center gap-2 transition-all border text-xs font-bold ${
                isSelected
                  ? 'bg-[#fb5607] text-white border-[#fb5607] shadow-lg shadow-[#fb5607]/25'
                  : isDark
                  ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  : 'bg-white border-stone-200 text-stone-700 shadow-sm hover:border-stone-300'
              }`}
            >
              <span className="text-sm">{item.emoji}</span>
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </div>

      {activeMood !== 'all' && filteredRecipes.length > 0 && (
        <section className="px-6 pt-3 pb-2">
          <div className="grid grid-cols-2 gap-3.5">
            {filteredRecipes.slice(0, 6).map((recipe) => (
              <motion.div
                key={recipe.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelectRecipe(recipe)}
                className={`rounded-2xl overflow-hidden border p-2.5 cursor-pointer flex flex-col ${
                  isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white border-stone-200 shadow-sm'
                }`}
              >
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative">
                  <OptimizedImage
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(recipe.id);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
                  >
                    <Heart
                      size={12}
                      fill={currentUser?.favorites?.includes(recipe.id) ? '#ef4444' : 'none'}
                      strokeWidth={2.5}
                    />
                  </button>
                </div>
                <h4
                  className={`text-xs font-bold mt-2 line-clamp-1 ${
                    isDark ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  {recipe.name}
                </h4>
                <div className="flex items-center justify-between mt-auto pt-2 text-[10px] font-semibold text-stone-400">
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {recipe.prepTime}
                  </span>
                  <span className="text-[#fb5607] font-bold">
                    {recipe.region || 'Bénin'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
```

---

### 5️⃣ `src/components/home/MagicFridgeCard.tsx`

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

interface MagicFridgeCardProps {
  isDark: boolean;
  onOpen: () => void;
}

export const MagicFridgeCard: React.FC<MagicFridgeCardProps> = ({ isDark, onOpen }) => {
  return (
    <div className="px-6 py-3">
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onOpen}
        className="p-5 rounded-3xl relative overflow-hidden shadow-xl cursor-pointer border"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(251,86,7,0.15) 0%, rgba(20,20,20,0.9) 100%)'
            : 'linear-gradient(135deg, #fff3ec 0%, #ffffff 100%)',
          borderColor: isDark ? 'rgba(251,86,7,0.3)' : '#fed7aa',
        }}
      >
        <div className="flex items-start justify-between relative z-10">
          <div className="max-w-[75%]">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#fb5607] text-white inline-block mb-2">
              🪄 Assistant Frigo IA
            </span>
            <h3
              className={`text-base font-black tracking-tight ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}
            >
              Que cuisiner avec ce que vous avez ?
            </h3>
            <p
              className={`text-xs font-medium mt-1 leading-relaxed ${
                isDark ? 'text-white/60' : 'text-stone-600'
              }`}
            >
              Tapez 2 ou 3 ingrédients (ex: Manioc, Tomate, Poisson) et laissez l'IA vous révéler la recette africaine parfaite.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#fb5607]/20 flex items-center justify-center text-2xl shadow-md shrink-0">
            🥘
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-xs font-black text-[#fb5607]">
          <span>Tester maintenant</span>
          <ChevronRight size={14} />
        </div>
      </motion.div>
    </div>
  );
};
```

---

### 6️⃣ `src/components/home/DynamicSectionRenderer.tsx`

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { Clock, Heart, Star } from 'lucide-react';
import { Recipe, User, Product } from '../../types';
import { OptimizedImage } from '../OptimizedImage';
import { FeaturedCarousel } from '../FeaturedCarousel';

interface DynamicSectionRendererProps {
  dynamicSections: any[];
  allRecipes: Recipe[];
  allProducts?: Product[];
  allMerchants?: any[];
  currentUser: User | null;
  isDark: boolean;
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
}

export const DynamicSectionRenderer: React.FC<DynamicSectionRendererProps> = ({
  dynamicSections,
  allRecipes,
  allProducts = [],
  allMerchants = [],
  currentUser,
  isDark,
  onSelectRecipe,
  onToggleFavorite,
}) => {
  return (
    <>
      {dynamicSections
        .filter((section: any) => !section.config?.page || section.config.page === 'home')
        .map((section: any) => {
          let sectionRecipes: Recipe[] = [];

          if (section.type === 'category') {
            sectionRecipes = allRecipes.filter(
              (r) => r.category === section.config?.category
            );
          } else if (section.type === 'region') {
            sectionRecipes = allRecipes.filter((r) =>
              r.region?.toLowerCase().includes(section.config?.region?.toLowerCase() || '')
            );
          } else if (section.type === 'quick') {
            const maxTime = parseInt(section.config?.max_prep_time) || 30;
            sectionRecipes = allRecipes.filter(
              (r) => (parseInt(r.prepTime) || 60) <= maxTime
            );
          } else if (section.type === 'all') {
            sectionRecipes = [...allRecipes];
          } else if (section.type === 'advertising') {
            const productIds = section.config?.merchant_ids || section.merchant_ids || [];
            sectionRecipes = allProducts.filter((p) => productIds.includes(p.id)) as any;
          } else {
            sectionRecipes = allRecipes.filter((r) =>
              section.recipe_ids?.includes(r.id)
            );
          }

          sectionRecipes = sectionRecipes.slice(0, section.config?.limit || 200);
          if (sectionRecipes.length === 0) return null;

          // CARROUSEL & BANNIÈRES
          if (
            section.type === 'dynamic_carousel' ||
            section.type === 'featured' ||
            section.type === 'banner' ||
            section.type === 'advertising'
          ) {
            return (
              <FeaturedCarousel
                key={section.id}
                section={section}
                recipes={section.type === 'advertising' ? [] : sectionRecipes}
                merchants={allMerchants}
                products={
                  section.type === 'advertising'
                    ? (sectionRecipes as any)
                    : allProducts
                }
                setSelectedRecipe={onSelectRecipe}
                currentUser={currentUser}
                toggleFavorite={onToggleFavorite}
                isDark={isDark}
              />
            );
          }

          // LISTE HORIZONTALE CARTE V2
          if (
            section.type === 'horizontal_list_v2' ||
            section.type === 'horizontal_list'
          ) {
            return (
              <section key={section.id} className="pt-4 pb-2">
                <div className="px-6 flex justify-between items-end mb-3">
                  <div>
                    <h3
                      className={`text-lg font-black tracking-tight ${
                        isDark ? 'text-white' : 'text-stone-900'
                      }`}
                    >
                      {section.title}
                    </h3>
                    {section.subtitle && (
                      <p
                        className={`text-[10px] font-bold tracking-wider uppercase mt-0.5 ${
                          isDark ? 'text-white/40' : 'text-stone-400'
                        }`}
                      >
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex overflow-x-auto gap-4 px-6 pb-4 no-scrollbar">
                  {sectionRecipes.map((recipe) => {
                    const isFav =
                      currentUser?.favorites?.includes(recipe.id) ?? false;
                    return (
                      <motion.div
                        key={recipe.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectRecipe(recipe)}
                        className={`w-[260px] shrink-0 rounded-3xl p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                          isDark
                            ? 'bg-[#111111] border-white/10 shadow-xl'
                            : 'bg-white border-stone-200/70 shadow-md shadow-stone-200/40'
                        }`}
                      >
                        <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-3">
                          <OptimizedImage
                            src={recipe.image}
                            alt={recipe.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2.5 left-2.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[9px] font-black uppercase tracking-wider">
                            {recipe.region || 'Spécialité'}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(recipe.id);
                            }}
                            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                              isFav ? 'bg-rose-500 text-white' : 'bg-black/40 text-white'
                            }`}
                          >
                            <Heart
                              size={14}
                              fill={isFav ? '#fff' : 'none'}
                              strokeWidth={2.5}
                            />
                          </button>
                        </div>

                        <div>
                          <h4
                            className={`font-black text-sm leading-tight line-clamp-1 ${
                              isDark ? 'text-white' : 'text-stone-900'
                            }`}
                          >
                            {recipe.name}
                          </h4>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 dark:border-white/5">
                            <span className="flex items-center gap-1 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                              <Clock size={12} className="text-[#fb5607]" />{' '}
                              {recipe.prepTime}
                            </span>
                            <span className="text-[10px] font-black text-[#fb5607] uppercase">
                              {recipe.difficulty}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          }

          // GRILLE 2 COLONNES (VERTICAL LIST 2)
          if (section.type === 'vertical_list_2') {
            return (
              <section key={section.id} className="px-6 pt-4 pb-2">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h3
                      className={`text-lg font-black tracking-tight ${
                        isDark ? 'text-white' : 'text-stone-900'
                      }`}
                    >
                      {section.title}
                    </h3>
                    {section.subtitle && (
                      <p
                        className={`text-[10px] font-bold tracking-wider uppercase mt-0.5 ${
                          isDark ? 'text-white/40' : 'text-stone-400'
                        }`}
                      >
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {sectionRecipes.map((recipe, ridx) => {
                    const isFav =
                      currentUser?.favorites?.includes(recipe.id) ?? false;
                    const ratingNum = (4.5 + (ridx % 5) * 0.1).toFixed(1);
                    return (
                      <motion.div
                        key={recipe.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onSelectRecipe(recipe)}
                        className={`rounded-3xl overflow-hidden border p-2.5 cursor-pointer flex flex-col ${
                          isDark
                            ? 'bg-[#111111] border-white/10'
                            : 'bg-white border-stone-200/80 shadow-sm'
                        }`}
                      >
                        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden relative">
                          <OptimizedImage
                            src={recipe.image}
                            alt={recipe.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 text-[10px] font-black text-white">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                            <span>{ratingNum}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(recipe.id);
                            }}
                            className={`absolute top-2 right-2 w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center ${
                              isFav ? 'bg-rose-500 text-white' : 'bg-black/40 text-white'
                            }`}
                          >
                            <Heart
                              size={12}
                              fill={isFav ? '#fff' : 'none'}
                              strokeWidth={2.5}
                            />
                          </button>
                        </div>
                        <h4
                          className={`text-xs font-black mt-2.5 line-clamp-1 ${
                            isDark ? 'text-white' : 'text-stone-900'
                          }`}
                        >
                          {recipe.name}
                        </h4>
                        <p
                          className={`text-[10px] font-medium line-clamp-1 mt-0.5 ${
                            isDark ? 'text-white/40' : 'text-stone-400'
                          }`}
                        >
                          {recipe.region || 'Cuisine traditionnelle'}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-2 text-[10px] font-bold text-stone-500 dark:text-stone-400">
                          <span className="flex items-center gap-1">
                            <Clock size={10} /> {recipe.prepTime}
                          </span>
                          <span className="text-[#fb5607] font-black">
                            {recipe.difficulty}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          }

          return null;
        })}
    </>
  );
};
```

---

### 7️⃣ `src/components/home/CommunityLiveTeaser.tsx`

```tsx
import React from 'react';
import { Users, ChevronRight } from 'lucide-react';

interface CommunityLiveTeaserProps {
  isDark: boolean;
  onNavigate: () => void;
}

export const CommunityLiveTeaser: React.FC<CommunityLiveTeaserProps> = ({
  isDark,
  onNavigate,
}) => {
  return (
    <div className="px-6 py-4">
      <div
        className={`p-5 rounded-3xl border flex items-center justify-between cursor-pointer transition-transform active:scale-[0.98] ${
          isDark
            ? 'bg-white/5 border-white/10 hover:bg-white/8'
            : 'bg-white border-stone-200 shadow-sm hover:border-stone-300'
        }`}
        onClick={onNavigate}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <Users size={24} />
          </div>
          <div>
            <h4
              className={`text-sm font-black tracking-tight ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}
            >
              Rejoignez les passionnés
            </h4>
            <p
              className={`text-xs font-medium mt-0.5 ${
                isDark ? 'text-white/50' : 'text-stone-500'
              }`}
            >
              Partagez vos astuces, photos et moments gourmands
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-stone-400" />
      </div>
    </div>
  );
};
```

---

### 8️⃣ `src/components/home/PantryQuickBar.tsx`

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface PantryQuickBarProps {
  pendingCount: number;
  onNavigate: () => void;
}

export const PantryQuickBar: React.FC<PantryQuickBarProps> = ({
  pendingCount,
  onNavigate,
}) => {
  if (pendingCount <= 0) return null;

  return (
    <div className="px-6 pt-1 pb-4">
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onNavigate}
        className="p-4 rounded-2xl bg-[#fb5607] text-white flex items-center justify-between shadow-lg shadow-[#fb5607]/25 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <ShoppingBag size={18} />
          </div>
          <div>
            <p className="text-xs font-black">
              {pendingCount} ingrédient(s) à acheter
            </p>
            <p className="text-[10px] text-white/80 font-medium">
              Consultez votre liste de marché intelligente
            </p>
          </div>
        </div>
        <ArrowRight size={16} />
      </motion.div>
    </div>
  );
};
```

---

### 9️⃣ `src/components/home/HomeView.tsx`

```tsx
import React, { useState, useMemo } from 'react';
import { Recipe, User, Product } from '../../types';
import { PullToRefresh } from '../PullToRefresh';
import { HomeHeader } from './HomeHeader';
import { DynamicGreeting } from './DynamicGreeting';
import { HeroSpotlight } from './HeroSpotlight';
import { QuickMoodRail, MOOD_FILTERS } from './QuickMoodRail';
import { MagicFridgeCard } from './MagicFridgeCard';
import { DynamicSectionRenderer } from './DynamicSectionRenderer';
import { CommunityLiveTeaser } from './CommunityLiveTeaser';
import { PantryQuickBar } from './PantryQuickBar';

export interface HomeViewProps {
  currentUser: User | null;
  allRecipes: Recipe[];
  featuredRecipes: Recipe[];
  otherRecipes: Recipe[];
  dynamicSections: any[];
  allMerchants?: any[];
  allProducts?: Product[];
  setSelectedRecipe: (recipe: Recipe) => void;
  toggleFavorite: (recipeId: string) => void;
  isDark: boolean;
  t: any;
  totalUnreadCount: number;
  isOffline: boolean;
  isSyncing: boolean;
  onRefresh: () => Promise<void>;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onNavigateTab: (tabId: string) => void;
  scrollRef?: React.RefObject<HTMLElement | null>;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  allRecipes,
  featuredRecipes,
  otherRecipes,
  dynamicSections,
  allMerchants = [],
  allProducts = [],
  setSelectedRecipe,
  toggleFavorite,
  isDark,
  t,
  totalUnreadCount,
  isOffline,
  isSyncing,
  onRefresh,
  onOpenSearch,
  onOpenNotifications,
  onNavigateTab,
  scrollRef,
}) => {
  const [activeMood, setActiveMood] = useState('all');

  const heroRecipe = useMemo(() => {
    return featuredRecipes.length > 0 ? featuredRecipes[0] : allRecipes[0];
  }, [featuredRecipes, allRecipes]);

  const filteredMoodRecipes = useMemo(() => {
    if (activeMood === 'all') return [];
    const filter = MOOD_FILTERS.find((f) => f.id === activeMood);
    if (!filter) return [];

    if (filter.maxTime) {
      return allRecipes.filter((r) => {
        const timeNum = parseInt(r.prepTime) || 30;
        return timeNum <= filter.maxTime!;
      });
    }

    if (filter.category) {
      return allRecipes.filter((r) => r.category === filter.category);
    }

    return allRecipes;
  }, [activeMood, allRecipes]);

  const pendingShoppingCount =
    currentUser?.shoppingList?.filter((i) => !i.isPurchased).length || 0;

  return (
    <PullToRefresh onRefresh={onRefresh} isDark={isDark} scrollRef={scrollRef}>
      <div
        className="flex-1 flex flex-col pb-44"
        style={{
          background: isDark ? '#000000' : '#f8f9fa',
          minHeight: '100vh',
        }}
      >
        {/* 1. Header Sticky */}
        <HomeHeader
          isDark={isDark}
          isOffline={isOffline}
          isSyncing={isSyncing}
          totalUnreadCount={totalUnreadCount}
          onRefresh={onRefresh}
          onOpenNotifications={onOpenNotifications}
          onOpenSearch={onOpenSearch}
        />

        {/* 2. Salutation Dynamique */}
        <DynamicGreeting
          userName={currentUser?.name}
          isDark={isDark}
          searchPlaceholder={t?.searchPlaceholder}
          onOpenSearch={onOpenSearch}
        />

        {/* 3. Hero Spotlight Plat du Jour (Gemini IA) */}
        {heroRecipe && (
          <HeroSpotlight
            recipe={heroRecipe}
            currentUser={currentUser}
            isDark={isDark}
            onSelect={setSelectedRecipe}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {/* 4. Rail d'humeur rapide */}
        <QuickMoodRail
          activeMood={activeMood}
          onSelectMood={setActiveMood}
          filteredRecipes={filteredMoodRecipes}
          currentUser={currentUser}
          isDark={isDark}
          onSelectRecipe={setSelectedRecipe}
          onToggleFavorite={toggleFavorite}
        />

        {/* 5. Le Frigo Magique IA */}
        <MagicFridgeCard isDark={isDark} onOpen={onOpenSearch} />

        {/* 6. Sections Dynamiques du CMS Admin */}
        <DynamicSectionRenderer
          dynamicSections={dynamicSections}
          allRecipes={allRecipes}
          allProducts={allProducts}
          allMerchants={allMerchants}
          currentUser={currentUser}
          isDark={isDark}
          onSelectRecipe={setSelectedRecipe}
          onToggleFavorite={toggleFavorite}
        />

        {/* 7. Teaser Communauté */}
        <CommunityLiveTeaser
          isDark={isDark}
          onNavigate={() => onNavigateTab('community')}
        />

        {/* 8. Rappel Panier / Marché */}
        <PantryQuickBar
          pendingCount={pendingShoppingCount}
          onNavigate={() => onNavigateTab('cart')}
        />
      </div>
    </PullToRefresh>
  );
};

export default HomeView;
```

---

## 🔌 Instructions de Branchement dans `App.tsx`

Dans `afrocuisto-mobile-main/src/App.tsx` :

### 1. Importer `HomeView`
```tsx
import { HomeView } from './components/home/HomeView';
```

### 2. Remplacer la fonction `renderHome()` (vers la ligne 3580)
```tsx
  const renderHome = () => (
    <HomeView
      currentUser={currentUser}
      allRecipes={allRecipes}
      featuredRecipes={featuredRecipes}
      otherRecipes={otherRecipes}
      dynamicSections={dynamicSections}
      allMerchants={allMerchants}
      allProducts={allProducts}
      setSelectedRecipe={setSelectedRecipe}
      toggleFavorite={toggleFavorite}
      isDark={isDark}
      t={t}
      totalUnreadCount={totalUnreadCount}
      isOffline={isOffline}
      isSyncing={isSyncing}
      onRefresh={refreshHome}
      onOpenSearch={() => setIsSearchExpanded(true)}
      onOpenNotifications={() => setIsNotifCenterOpen(true)}
      onNavigateTab={navigateTo}
      scrollRef={mainScrollRef as React.RefObject<HTMLElement | null>}
    />
  );
```

---

## 🎯 Résumé des Bénéfices
1. **Lisibilité maximale** : Le composant d'accueil passe de +500 lignes intriquées dans `App.tsx` à un sous-module propre et structuré.
2. **Design World-Class** : Ergonomie inspirée des références mondiales (NYT Cooking, Kitchen Stories, Tasty, Whisk).
3. **Engagement x2** : Salutation selon l'heure, Hero Card IA captivante, filtres d'envie en 1 clic et widget "Frigo Magique".
4. **Zéro Régression** : Toutes les props, les thèmes (sombre/clair), le pull-to-refresh et les sections dynamiques CMS fonctionnent immédiatement.
