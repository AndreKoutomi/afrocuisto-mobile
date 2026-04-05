import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, Clock, ChevronRight, Filter, TrendingUp, Sparkles } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';

interface SearchViewProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  t: any;
  isDark: boolean;
  allRecipes: any[];
  setSelectedRecipe: (recipe: any) => void;
  normalizeString: (str: string) => string;
}

const SearchView: React.FC<SearchViewProps> = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  t,
  isDark,
  allRecipes,
  setSelectedRecipe,
  normalizeString
}) => {
  const filteredRecipes = React.useMemo(() => {
    if (!searchQuery) return [];
    const q = normalizeString(searchQuery);
    return allRecipes.filter(r => 
      normalizeString(r.name || "").includes(q) || 
      normalizeString(r.region || "").includes(q)
    );
  }, [searchQuery, allRecipes, normalizeString]);

  const trendingTags = ['Sauces', 'Ablo', 'Pôyô', 'Aloko', 'Boissons', 'Tchatchanga', 'Piron'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(32px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.3 }}
          className={`fixed inset-0 z-[1000] flex flex-col ${isDark ? 'bg-black/90' : 'bg-white/95'}`}
          style={{ WebkitBackdropFilter: 'blur(32px)' }}
        >
          {/* ── HEADER ── */}
          <header className="px-6 pb-6 pt-16 md:pt-20 shrink-0">
            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { onClose(); setSearchQuery(''); }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isDark ? 'bg-white/5 text-white border-white/10' : 'bg-stone-100 text-stone-800 border-stone-200'}`}
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </motion.button>
              
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fb5607]" size={20} strokeWidth={3} />
                <input
                  type="text"
                  autoFocus
                  placeholder={t.searchPlaceholder || "Rechercher une recette..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-2xl py-4 pl-12 pr-12 focus:outline-none font-bold text-[16px] transition-all shadow-lg ${isDark ? 'bg-white/10 border border-white/10 text-white placeholder:text-white/20 focus:border-[#fb5607]/60 focus:bg-white/15 shadow-black/40' : 'bg-white border border-stone-200 text-stone-900 placeholder:text-stone-300 focus:ring-4 focus:ring-[#fb5607]/5 shadow-stone-200/40'}`}
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                        <Sparkles size={16} className="text-[#fb5607] animate-pulse" />
                    </button>
                )}
              </div>
            </div>
          </header>

          {/* ── CONTENT ── */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32">
            {searchQuery.length > 0 ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between mb-2">
                    <p className={`text-[10px] font-black tracking-[0.3em] uppercase ${isDark ? 'text-white/20' : 'text-stone-400'}`}>
                        {filteredRecipes.length} résultat{filteredRecipes.length > 1 ? 's' : ''}
                    </p>
                    <Filter size={14} className={isDark ? 'text-white/20' : 'text-stone-300'} />
                </div>

                <AnimatePresence mode="popLayout">
                    {filteredRecipes.map((recipe, i) => (
                    <motion.div
                        key={recipe.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, type: 'spring', damping: 20 }}
                        onClick={() => {
                          setSelectedRecipe(recipe);
                          onClose();
                        }}
                        className={`group rounded-[28px] flex items-center gap-4 p-3.5 transition-all cursor-pointer border ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-stone-100 hover:bg-stone-50 shadow-sm shadow-stone-200/20'}`}
                    >
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-white/10 shrink-0">
                            <OptimizedImage
                            src={recipe.image}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            alt={recipe.name}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-black text-[15px] leading-tight mb-1.5 truncate ${isDark ? 'text-white' : 'text-stone-900'}`}>{recipe.name}</h4>
                          <div className="flex items-center gap-3">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${isDark ? 'bg-[#fb5607]/10 text-[#fb5607] border border-[#fb5607]/20' : 'bg-[#fb5607]/5 text-[#fb5607]'}`}>{recipe.region}</span>
                            <div className={`flex items-center gap-1 ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
                              <Clock size={10} />
                              <span className="text-[10px] font-bold">{recipe.prepTime}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/5 text-white/30' : 'bg-stone-100 text-stone-400 group-hover:bg-[#fb5607] group-hover:text-white'}`}>
                            <ChevronRight size={18} strokeWidth={3} />
                        </div>
                    </motion.div>
                    ))}
                </AnimatePresence>

                {filteredRecipes.length === 0 && (
                  <div className="py-24 text-center flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-white/5' : 'bg-stone-100 shadow-inner'}`}>
                        <Search size={32} className="text-stone-300" />
                    </div>
                    <p className={`text-lg font-black ${isDark ? 'text-white/60' : 'text-stone-800'}`}>Aucune pépite trouvée</p>
                    <p className="text-[#fb5607] font-black text-[14px] mt-1 bg-orange-500/10 px-4 py-1.5 rounded-full">"{searchQuery}"</p>
                  </div>
                )}
              </div>
            ) : (
                <div className="space-y-12 mt-6">
                    {/* Trending tags with modern design */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <TrendingUp size={16} className="text-[#fb5607]" />
                            </div>
                            <h3 className={`text-[12px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-white/40' : 'text-stone-500'}`}>
                                Tendances
                            </h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {trendingTags.map((tag, idx) => (
                                <motion.button
                                    key={tag}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setSearchQuery(tag)}
                                    className={`px-5 py-2.5 rounded-[20px] text-[13px] font-bold transition-all active:scale-95 border ${isDark ? 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white' : 'bg-white border-stone-100 text-stone-600 hover:bg-stone-50 hover:border-stone-200 shadow-sm'}`}
                                >
                                    #{tag}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Suggested recipes */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Sparkles size={16} className="text-blue-500" />
                            </div>
                            <h3 className={`text-[12px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-white/40' : 'text-stone-500'}`}>
                                Suggestions
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {allRecipes.slice(0, 4).map((recipe, i) => (
                                <motion.div
                                    key={recipe.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => { setSelectedRecipe(recipe); onClose(); }}
                                    className={`flex items-center gap-4 p-3 rounded-[24px] active:scale-[0.98] transition-all cursor-pointer border ${isDark ? 'bg-white/5 border-white/5' : 'bg-stone-50 border-white shadow-sm'}`}
                                >
                                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md">
                                        <OptimizedImage src={recipe.image} className="w-full h-full object-cover" alt={recipe.name} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[14px] font-black truncate ${isDark ? 'text-white/80' : 'text-stone-800'}`}>{recipe.name}</p>
                                        <p className={`text-[10px] font-bold uppercase tracking-tight ${isDark ? 'text-white/20' : 'text-stone-400'}`}>{recipe.region}</p>
                                    </div>
                                    <div className={`p-2 rounded-full ${isDark ? 'bg-white/5 text-white/20' : 'bg-white text-stone-300 shadow-sm border border-stone-50'}`}>
                                        <ChevronRight size={14} strokeWidth={3} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchView;
