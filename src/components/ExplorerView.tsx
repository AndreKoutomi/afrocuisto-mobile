import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, Star, Clock, RefreshCw, MapPin, ChevronRight, Filter } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { OptimizedImage } from './OptimizedImage';
import { FeaturedCarousel } from './FeaturedCarousel';

interface ExplorerViewProps {
  isDark: boolean;
  t: any;
  allRecipes: any[];
  allProducts: any[];
  allMerchants: any[];
  dynamicSections: any[];
  currentUser: any;
  toggleFavorite: (id: string) => void;
  setSelectedRecipe: (recipe: any) => void;
  navigateTo: (page: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setIsSearchExpanded: (expanded: boolean) => void;
  isSyncing: boolean;
  syncRecipes: () => void;
  syncSections: () => void;
  scrollToTop: () => void;
}

const ExplorerView: React.FC<ExplorerViewProps> = ({
  isDark,
  t,
  allRecipes,
  allProducts,
  allMerchants,
  dynamicSections,
  currentUser,
  toggleFavorite,
  setSelectedRecipe,
  navigateTo,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setIsSearchExpanded,
  isSyncing,
  syncRecipes,
  syncSections,
  scrollToTop
}) => {
  // Region Data
  const regions = [
    { id: 'Benin', name: 'Bénin', flag: '🇧🇯', img: 'https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?w=400' },
    { id: 'Senegal', name: 'Sénégal', flag: '🇸🇳', img: 'https://images.unsplash.com/photo-1596797038558-9da50b1a738d?w=400' },
    { id: 'Nigeria', name: 'Nigeria', flag: '🇳🇬', img: 'https://images.unsplash.com/photo-1614298150493-27083162388e?w=400' },
    { id: 'Cameroon', name: 'Cameroun', flag: '🇨🇲', img: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400' },
    { id: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', img: 'https://images.unsplash.com/photo-1583134304827-1e9740f060ce?w=400' },
  ];

  // Compute displayRecipes
  const displayRecipes = React.useMemo(() => {
    let filtered = allRecipes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name?.toLowerCase().includes(q) || 
        r.region?.toLowerCase().includes(q) || 
        r.category?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }
    return filtered;
  }, [allRecipes, searchQuery, selectedCategory]);

  return (
    <div className={`flex-1 flex flex-col pb-44 ${isDark ? 'bg-[#000000]' : 'bg-[#f8f9fa]'} transition-colors duration-500`}>
      {/* ── PREMIUM HEADER ── */}
      <header
        className="sticky top-0 z-[100] px-6 pb-6"
        style={{
          paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 20px)' : '32px',
          background: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(248,249,250,0.9)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}
            >
              {selectedCategory || t.explorer}
            </motion.h1>
            <p className={`text-[11px] font-black uppercase tracking-[0.3em] mt-1 ${isDark ? 'text-[#ff4800]' : 'text-[#fb5607]'}`}>
              {t.discoverAfrica || "L'Afrique dans votre assiette"}
            </p>
          </div>
          <div className="flex items-center gap-3">
             {isSyncing && (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                  <RefreshCw size={18} className="text-[#fb5607]" />
                </motion.div>
              )}
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateTo('favs')} 
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white shadow-xl shadow-black/20' : 'bg-white border border-stone-100 text-stone-800 shadow-sm shadow-stone-200/50'}`}
            >
              <Heart size={22} />
            </motion.button>
          </div>
        </div>

        {/* ── SEARCH BAR FLOATING GLASS ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsSearchExpanded(true)}
          className={`group flex items-center gap-4 px-6 h-14 rounded-[22px] cursor-pointer transition-all duration-300 border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 shadow-lg shadow-black/40' : 'bg-white border-stone-100 hover:bg-stone-50 shadow-md shadow-stone-200/40'}`}
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#fb5607] to-[#ff4800] flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Search size={16} className="text-white" strokeWidth={3} />
          </div>
          <span className={`font-bold text-[14px] ${isDark ? 'text-white/40' : 'text-stone-400'}`}>{t.searchPlaceholder}</span>
          <div className="ml-auto flex items-center gap-2">
            <div className={`h-4 w-[1px] ${isDark ? 'bg-white/10' : 'bg-stone-200'}`} />
            <Filter size={18} className={`${isDark ? 'text-white/40' : 'text-stone-400'}`} />
          </div>
        </motion.div>
      </header>

      <div className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar pt-4">
        {searchQuery || selectedCategory ? (
            /* ── ENHANCED SEARCH RESULTS GRID ── */
            <div className="px-6 pt-2 grid grid-cols-2 gap-5 pb-32">
                <AnimatePresence mode="popLayout">
                    {displayRecipes.map((recipe, ridx) => {
                        const isFav = currentUser?.favorites?.includes(recipe.id) ?? false;
                        const ratingNum = (4.5 + (ridx % 5) * 0.1).toFixed(1);
                        return (
                            <motion.div
                                key={recipe.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: ridx * 0.05, type: 'spring', damping: 20 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setSelectedRecipe(recipe)}
                                className={`rounded-[32px] overflow-hidden border shadow-xl flex flex-col transition-all cursor-pointer ${isDark ? 'bg-[#0d0d0d]/80 border-white/5 shadow-black/80' : 'bg-white border-white shadow-stone-200/50'}`}
                                style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                            >
                                <div className="h-40 relative group">
                                    <OptimizedImage src={recipe.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                    <div className="absolute top-3 right-3">
                                        <motion.button
                                            whileTap={{ scale: 0.8 }}
                                            onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all ${isFav ? 'bg-[#ff4800] border-[#ff4800] text-white shadow-lg shadow-orange-500/40' : 'bg-black/30 border-white/20 text-white'}`}
                                        >
                                            <Heart size={16} fill={isFav ? "white" : "none"} strokeWidth={2.5} />
                                        </motion.button>
                                    </div>
                                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                        <Star size={10} className="text-[#ff4800] fill-[#ff4800]" />
                                        <span className="text-white text-[10px] font-black">{ratingNum}</span>
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                    <h4 className={`font-black text-[14px] leading-tight mb-3 line-clamp-2 ${isDark ? 'text-white' : 'text-stone-800'}`}>{recipe.name}</h4>
                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} className="text-[#ff4800]" />
                                            <span className={`text-[10px] font-bold ${isDark ? 'text-white/60' : 'text-stone-500'}`}>{recipe.prepTime}</span>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${isDark ? 'bg-white/5 text-white/40 border border-white/10' : 'bg-stone-50 text-stone-400 border border-stone-100'}`}>
                                            {recipe.region || "Chef"}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {displayRecipes.length === 0 && (
                    <div className="col-span-2 py-32 text-center flex flex-col items-center gap-6">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-stone-100'}`}>
                            <Search size={40} className="text-stone-300" />
                        </div>
                        <div>
                            <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-stone-800'}`}>{t.noResults}</p>
                            <p className="text-stone-400 text-sm mt-1">{t.tryAnotherSearch || "Essayez d'autres mots-clés"}</p>
                        </div>
                    </div>
                )}
            </div>
        ) : (
          <div className="space-y-12 pb-32 pt-8">
            {/* ── CUISINE REGIONS CHIPS ── */}
            <div>
              <div className="px-7 mb-6 flex items-center justify-between">
                <h2 className={`text-[11px] font-black tracking-[0.3em] uppercase ${isDark ? 'text-[#ff4800]' : 'text-[#fb5607]'}`}>Cultures & Régions</h2>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Voir plus</span>
              </div>
              <div className="flex gap-5 overflow-x-auto px-7 no-scrollbar pb-4">
                {regions.map((region, idx) => (
                  <motion.div
                    key={region.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSearchQuery(region.name)}
                    className="flex-shrink-0 flex flex-col items-center gap-4"
                  >
                    <div className={`w-[84px] h-[84px] rounded-[32px] overflow-hidden border-2 shadow-2xl transition-all duration-500 hover:rotate-6 ${isDark ? 'border-white/10 shadow-black' : 'border-white shadow-stone-200/50'} relative group`}>
                      <img src={region.img} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 flex flex-col items-center justify-center pt-2">
                        <span className="text-3xl drop-shadow-2xl filter saturate-150">{region.flag}</span>
                      </div>
                    </div>
                    <span className={`text-[12px] font-black tracking-tight ${isDark ? 'text-white/80' : 'text-stone-800'}`}>{region.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── DYNAMIC CMS SECTIONS ── */}
            {dynamicSections.filter((section: any) => section.config?.page === 'explorer').map((section, sidx) => {
              let sectionRecipes: any[] = [];
              if (section.type === 'category') sectionRecipes = allRecipes.filter(r => r.category === section.config?.category);
              else if (section.type === 'region') sectionRecipes = allRecipes.filter(r => r.region?.toLowerCase().includes(section.config?.region?.toLowerCase() || ''));
              else if (section.type === 'quick') sectionRecipes = allRecipes.filter(r => (parseInt(r.prep_time) || 60) <= (parseInt(section.config?.max_prep_time) || 30));
              else if (section.type === 'all') sectionRecipes = [...allRecipes];
              else if (section.type === 'advertising') sectionRecipes = allProducts.filter(p => (section.config?.merchant_ids || []).includes(p.id));
              else sectionRecipes = allRecipes.filter(r => section.recipe_ids?.includes(r.id));
              
              sectionRecipes = sectionRecipes.slice(0, section.config?.limit || 20);
              if (sectionRecipes.length === 0) return null;

              if (section.type === 'dynamic_carousel' || section.type === 'advertising' || section.type === 'banner' || section.type === 'featured') {
                return (
                  <div key={section.id} className="pt-2">
                    <FeaturedCarousel
                        section={section}
                        recipes={section.type === 'advertising' ? [] : sectionRecipes}
                        merchants={allMerchants}
                        products={section.type === 'advertising' ? sectionRecipes : allProducts}
                        setSelectedRecipe={setSelectedRecipe}
                        currentUser={currentUser}
                        toggleFavorite={toggleFavorite}
                        isDark={isDark}
                    />
                  </div>
                );
              }

              return (
                <section key={section.id} className="pt-2">
                  <div className="px-8 flex justify-between items-end mb-6">
                    <div className="flex flex-col">
                      <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>{section.title}</h2>
                      {section.subtitle && <p className="text-[11px] text-stone-400 font-bold uppercase tracking-[0.2em] mt-1.5">{section.subtitle}</p>}
                    </div>
                    <motion.button whileTap={{ x: 3 }} className="p-2 rounded-full bg-stone-100/10 text-[#ff4800]"><ChevronRight size={20} strokeWidth={3} /></motion.button>
                  </div>
                  <div className="flex gap-5 overflow-x-auto px-8 no-scrollbar pb-6">
                    {sectionRecipes.map((recipe, ridx) => {
                      const isFav = currentUser?.favorites?.includes(recipe.id) ?? false;
                      const ratingNum = (4.0 + (ridx % 5) * 0.1).toFixed(1);
                      return (
                        <motion.div
                          key={recipe.id}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setSelectedRecipe(recipe)}
                          className={`flex-shrink-0 w-60 rounded-[36px] overflow-hidden border shadow-2xl transition-all duration-500 ${isDark ? 'bg-[#0d0d0d] border-white/5 shadow-black/60' : 'bg-white border-white shadow-stone-200/40'}`}
                        >
                          <div className="h-44 relative group">
                            <OptimizedImage src={recipe.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                            <div className="absolute top-3 right-3">
                                <Heart size={16} className={isFav ? "text-[#ff4800] fill-[#ff4800] drop-shadow-lg" : "text-white/80 drop-shadow-md"} strokeWidth={3} />
                            </div>
                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-lg">
                              <Star size={12} className="text-[#ff4800] fill-[#ff4800]" />
                              <span className="text-white text-[11px] font-black">{ratingNum}</span>
                            </div>
                          </div>
                          <div className="p-5">
                            <h4 className={`font-black text-[15px] line-clamp-1 mb-2 ${isDark ? 'text-white' : 'text-stone-800'}`}>{recipe.name}</h4>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Clock size={14} className="text-stone-400" />
                                <span className="text-[11px] text-stone-400 font-bold tracking-tight uppercase">{recipe.prepTime}</span>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-stone-100'}`} />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorerView;
