import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChefHat,
  Clock,
  MapPin,
  ChevronLeft,
  Flame,
  UtensilsCrossed,
  Info,
  BookOpen,
  Home,
  Search,
  Heart,
  User as UserIcon,
  ShoppingBag,
  Bell,
  Settings,
  ChevronRight,
  ChevronDown,
  Star,
  Wifi,
  Battery,
  Signal,
  LogOut,
  Mail,
  Lock,
  UserPlus,
  Moon,
  Sun,
  Globe,
  Ruler,
  ShieldCheck,
  Eye,
  EyeOff,
  Key,
  CheckCircle2,
  Camera,
  Edit2,
  Play,
  Bookmark,
  Share2,
  MoreVertical,
  Trash2,
  Plus,
  XCircle,
  SearchIcon,
  Sparkles,
  Check,
  AlertCircle,
  Loader
} from 'lucide-react';
import { recipes } from './data';
import { Recipe, Difficulty, User, UserSettings, ShoppingItem } from './types';
import { getAIRecipeRecommendation } from './aiService';
import { dbService } from './dbService';
import { translations, LanguageCode } from './translations';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SystemBars, SystemBarsStyle } from '@capacitor/core';

// --- Constants & Config ---
const springTransition = { type: 'spring', stiffness: 500, damping: 28, mass: 0.5 };
const layoutTransition = { type: 'spring', stiffness: 350, damping: 25 };

const normalizeString = (str: string) =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// --- Sub-Components & Helpers ---

const DifficultyBadge = ({ difficulty, t }: { difficulty: Difficulty; t: any }) => {
  const colors = {
    'Facile': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Très Facile': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Moyen': 'bg-amber-100 text-amber-700 border-amber-200',
    'Difficile': 'bg-rose-100 text-rose-700 border-rose-200'
  };

  const labels = {
    'Facile': t.easy,
    'Très Facile': t.veryEasy,
    'Moyen': t.medium,
    'Difficile': t.hard
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border ${colors[difficulty as keyof typeof colors] || 'bg-stone-100 text-stone-600'}`}>
      {labels[difficulty as keyof typeof labels]}
    </span>
  );
};

const PreparationStep = ({ step, index, recipeId }: { step: string; index: number; recipeId: string }) => {
  const [isDone, setIsDone] = useState(false);
  return (
    <motion.div
      key={`${recipeId}-step-${index}`}
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      onClick={() => setIsDone(!isDone)}
      className={`group flex gap-4 p-4 rounded-[24px] transition-all duration-300 cursor-pointer border ${isDone ? 'bg-emerald-50/40 border-emerald-100/50' : 'bg-stone-50 border-stone-100/50 active:bg-stone-100'}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isDone ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200' : 'bg-white border-stone-200 group-hover:border-terracotta'}`}>
          {isDone && <CheckCircle2 size={14} className="text-white" />}
          {!isDone && <span className="text-[10px] font-black text-stone-400">{index + 1}</span>}
        </div>
      </div>
      <p className={`text-[13px] font-medium leading-relaxed transition-all duration-300 ${isDone ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
        {step}
      </p>
    </motion.div>
  );
};

// ─── Coverflow Carousel (used for dynamic_carousel sections) ───────────────
const SnapCarousel = ({ recipes, setSelectedRecipe, sectionId, autoplayInterval, currentUser, toggleFavorite }: {
  recipes: Recipe[];
  setSelectedRecipe: (r: Recipe) => void;
  sectionId: string;
  autoplayInterval?: number;
  currentUser?: any;
  toggleFavorite?: (id: string) => void;
}) => {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const n = recipes.length;
  if (!n) return null;

  // ── Scroll to active card (programmatic) ──────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    isProgrammaticScroll.current = true;
    const cardWidth = el.offsetWidth * 0.82 + 16;
    el.scrollTo({ left: active * cardWidth, behavior: 'smooth' });
    // Reset flag after the smooth scroll animation ends (~400ms)
    const t = setTimeout(() => { isProgrammaticScroll.current = false; }, 450);
    return () => clearTimeout(t);
  }, [active]);

  // ── Autoplay — loop infinitely ────────────────────────────────────────────
  useEffect(() => {
    if (!autoplayInterval || isPaused) return;
    const t = setInterval(() => {
      setActive(prev => (prev + 1) % n);
    }, autoplayInterval);
    return () => clearInterval(t);
  }, [autoplayInterval, isPaused, n]);

  // ── Detect active card on native touch swipe only ─────────────────────────
  const onScroll = () => {
    // Ignore scroll events triggered by our own programmatic scrollTo
    if (isProgrammaticScroll.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.offsetWidth * 0.82 + 16;
    const idx = Math.round(el.scrollLeft / cardWidth);
    if (idx !== active && idx >= 0 && idx < n) {
      setActive(idx);
      // Pause autoplay while user is manually swiping, then resume
      setIsPaused(true);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => setIsPaused(false), 4000);
    }
  };

  const goTo = (i: number) => {
    setActive(i);
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => setIsPaused(false), 4000);
  };
  const prev = () => goTo(Math.max(0, active - 1));
  const next = () => goTo(Math.min(n - 1, active + 1));

  return (
    <div className="relative w-full">

      {/* ── Scrollable track ─────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{
          display: 'flex',
          gap: '14px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          paddingLeft: '6vw',
          paddingRight: '6vw',
          paddingTop: '15px',
          paddingBottom: '15px',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {recipes.map((recipe, i) => {
          const isActive = i === active;
          const isFav = currentUser?.favorites?.includes(recipe.id) ?? false;

          return (
            <motion.div
              key={recipe.id}
              animate={{
                scale: isActive ? 1 : 0.93,
                opacity: isActive ? 1 : 0.7,
              }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              onClick={() => { if (isActive) setSelectedRecipe(recipe); else goTo(i); }}
              style={{
                flexShrink: 0,
                width: '82vw',
                maxWidth: '340px',
                scrollSnapAlign: 'center',
                cursor: 'pointer',
                borderRadius: '28px',
                overflow: 'hidden',
                position: 'relative',
                aspectRatio: '3/4',
                boxShadow: isActive
                  ? '0 10px 28px rgba(0,0,0,0.14), 0 3px 8px rgba(0,0,0,0.08)'
                  : '0 3px 10px rgba(0,0,0,0.08)',
              }}
            >
              {/* Photo */}
              <img
                src={recipe.image}
                alt={recipe.name}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Multi-layer gradient overlay with enhanced top scrim for extreme white backgrounds */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.85) 100%)',
              }} />

              {/* Top row: category badge + heart */}
              <div style={{
                position: 'absolute', top: 16, left: 16, right: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                {recipe.category && (
                  <span style={{
                    background: 'rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '10px',
                    fontWeight: 900,
                    color: '#fff',
                    letterSpacing: '0.04em',
                    maxWidth: '70%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    textTransform: 'uppercase',
                  }}>
                    {recipe.category}
                  </span>
                )}
                {toggleFavorite && (
                  <button
                    onClick={e => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: isFav ? '#ef4444' : 'rgba(0,0,0,0.3)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    <Heart size={18} style={{ color: '#fff', fill: isFav ? '#fff' : 'none' }} strokeWidth={isFav ? 0 : 2.5} />
                  </button>
                )}
              </div>

              {/* Bottom content */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 20px 24px' }}>
                {/* Region */}
                {recipe.region && (
                  <p style={{
                    margin: '0 0 6px', fontSize: '11px', fontWeight: 700,
                    color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    📍 {recipe.region}
                  </p>
                )}

                {/* Recipe Name */}
                <h3 style={{
                  margin: '0 0 12px',
                  fontSize: 'clamp(20px, 5.5vw, 26px)',
                  fontWeight: 900,
                  color: '#fff',
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                }}>
                  {recipe.name}
                </h3>

                {/* Bottom row: time + difficulty */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {recipe.prepTime && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'rgba(255,255,255,0.20)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '20px', padding: '5px 12px',
                    }}>
                      <Clock size={12} style={{ color: '#fff' }} />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{recipe.prepTime}</span>
                    </div>
                  )}
                  {recipe.difficulty && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'rgba(255,255,255,0.20)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '20px', padding: '5px 12px',
                    }}>
                      <Flame size={12} style={{ color: '#fff' }} />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{recipe.difficulty}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Prev / Next arrows ─────────────────────────────────────────────── */}
      {active > 0 && (
        <button
          className="carousel-arrow"
          onClick={prev}
          style={{
            position: 'absolute', left: 8, top: '42%', transform: 'translateY(-50%)',
            width: '38px', height: '38px', borderRadius: '50%',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 20, transition: 'all 0.15s',
          }}
          aria-label="Précédent"
        >
          <ChevronLeft size={18} className="carousel-arrow-icon" />
        </button>
      )}
      {active < n - 1 && (
        <button
          className="carousel-arrow"
          onClick={next}
          style={{
            position: 'absolute', right: 8, top: '42%', transform: 'translateY(-50%)',
            width: '38px', height: '38px', borderRadius: '50%',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 20, transition: 'all 0.15s',
          }}
          aria-label="Suivant"
        >
          <ChevronRight size={18} className="carousel-arrow-icon" />
        </button>
      )}

      {/* ── Dot indicators — sur fond sombre ─────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', paddingBottom: '16px', paddingTop: '4px' }}>
        {recipes.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={i === active ? 'carousel-dot-active' : 'carousel-dot'}
            style={{
              width: i === active ? 24 : 7,
              height: 7,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'width 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.25s',
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const AUTOPLAY_DURATION = 4500;

const HeroCarousel = ({ recipes, setSelectedRecipe, currentUser, toggleFavorite, t }: {
  recipes: Recipe[],
  setSelectedRecipe: (r: Recipe) => void,
  currentUser: User | null,
  toggleFavorite: (id: string) => void,
  t: any
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const goTo = (idx: number, dir: 'left' | 'right' = 'right') => {
    setPrevIndex(activeIndex);
    setDirection(dir);
    setActiveIndex(idx);
    setProgress(0);
    progressRef.current = 0;
    startTimeRef.current = null;
  };

  const goNext = () => goTo((activeIndex + 1) % recipes.length, 'right');
  const goPrev = () => goTo((activeIndex - 1 + recipes.length) % recipes.length, 'left');

  useEffect(() => {
    if (recipes.length <= 1 || isPaused) return;
    const animate = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const p = Math.min(elapsed / AUTOPLAY_DURATION, 1);
      setProgress(p);
      progressRef.current = p;
      if (p >= 1) {
        setPrevIndex(activeIndex);
        setDirection('right');
        setActiveIndex(prev => (prev + 1) % recipes.length);
        startTimeRef.current = null;
        setProgress(0);
      } else {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [activeIndex, recipes.length, isPaused]);

  if (!recipes.length) return null;
  const recipe = recipes[activeIndex];
  const isFav = currentUser?.favorites.includes(recipe.id);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: '78vw', maxHeight: '360px', touchAction: 'pan-y', borderRadius: '0 0 32px 32px', marginBottom: 2 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* — Background layers (cross-fade between slides) — */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={recipe.id}
          custom={direction}
          variants={{
            enter: (d: string) => ({ x: d === 'right' ? '100%' : '-100%', scale: 1.1 }),
            center: { x: 0, scale: 1 },
            exit: (d: string) => ({ x: d === 'right' ? '-30%' : '30%', scale: 0.95, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.65, ease: [0.32, 0, 0.18, 1] }}
          className="absolute inset-0"
        >
          <img
            src={recipe.image}
            className="w-full h-full object-cover"
            alt={recipe.name}
          />
          {/* Cinematic gradient with top scrim for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />
          {/* Dual-direction scrim: dark at top for UI buttons visibility on white photos */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* — Shimmer / ambient glow pulse — */}
      <motion.div
        key={`glow-${recipe.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.18, 0] }}
        transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.5 }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 80%, rgba(251,86,7,0.25), transparent)' }}
      />

      {/* — Top bar — */}
      <div className="absolute top-4 left-5 right-5 flex items-center justify-between z-20">
        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {recipes.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > activeIndex ? 'right' : 'left')}
              className="relative overflow-hidden rounded-full transition-all duration-500"
              style={{ width: i === activeIndex ? 24 : 6, height: 6 }}
            >
              <div className="absolute inset-0 bg-white/30 rounded-full" />
              {i === activeIndex && (
                <motion.div
                  className="absolute inset-y-0 left-0 bg-white rounded-full"
                  style={{ width: `${progress * 100}%` }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Favorite button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
          className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-lg transition-all duration-300 ${isFav ? 'bg-white text-[#fb5607] border-white shadow-[#fb5607]/20' : 'bg-black/25 text-white border-white/20'
            }`}
        >
          <Heart size={18} fill={isFav ? 'currentColor' : 'none'} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* — Bottom content — */}
      <div className="absolute bottom-0 inset-x-0 p-5 z-20">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={recipe.id}
            custom={direction}
            variants={{
              enter: (d: string) => ({ x: d === 'right' ? 40 : -40, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: string) => ({ x: d === 'right' ? -20 : 20, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-1.5 mb-2.5"
            >
              <span className="px-2.5 py-1 rounded-xl bg-[#fb5607]/25 border border-[#fb5607]/40 text-[10px] font-black text-[#fb5607] uppercase tracking-widest backdrop-blur-md">
                ✦ Sélection du Chef
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-[10px] font-black text-white/90 backdrop-blur-md flex items-center gap-1">
                <Star size={9} className="fill-amber-400 text-amber-400" /> 4.9
              </span>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="text-white font-black leading-[1.1] mb-3 drop-shadow-lg"
              style={{ fontSize: 'clamp(22px, 6vw, 28px)' }}
            >
              {recipe.name}
            </motion.h2>

            {/* Meta row */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.30 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-white/80 text-xs font-bold">
                  <MapPin size={12} className="text-[#fb5607]" />
                  {recipe.region}
                </span>
                <span className="w-px h-3 bg-white/20" />
                <span className="flex items-center gap-1 text-white/80 text-xs font-bold">
                  <Clock size={12} className="text-white/50" />
                  {recipe.cookTime}
                </span>
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => setSelectedRecipe(recipe)}
                className="flex items-center gap-1.5 bg-[#fb5607] text-white text-[11px] font-black px-4 py-2.5 rounded-2xl shadow-lg shadow-[#fb5607]/30"
              >
                Voir la recette <ChevronRight size={13} strokeWidth={3} />
              </motion.button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* — Touch / swipe nav zones (invisible) — */}
      <button
        className="absolute left-0 inset-y-0 w-1/4 z-10"
        onClick={goPrev}
        style={{ background: 'transparent' }}
        aria-label="Précédent"
      />
      <button
        className="absolute right-0 inset-y-0 w-1/4 z-10"
        onClick={goNext}
        style={{ background: 'transparent' }}
        aria-label="Suivant"
      />
    </div>
  );
};

// --- NavButton ---

type NavButtonProps = {
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
};

const NavButton = ({ icon: Icon, isActive, onClick }: NavButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.84 }}
      transition={{ type: 'spring', stiffness: 600, damping: 28 }}
      className="relative flex items-center justify-center"
      style={{ width: 60, height: 60, flexShrink: 0 }}
    >
      {/* Sliding white bubble (shared layoutId = smooth morphing) */}
      {isActive && (
        <motion.div
          layoutId="nav-white-bubble"
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="absolute inset-0 rounded-full nav-bubble"
        />
      )}

      {/* Icon */}
      <motion.div
        animate={{
          scale: isActive ? 1.1 : 1,
          y: isActive ? -1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 480, damping: 26 }}
        className="relative z-10"
      >
        <Icon
          size={21}
          strokeWidth={isActive ? 2.4 : 1.8}
          color={isActive ? '#F94D00' : 'rgba(255,255,255,0.58)'}
          fill={isActive ? 'none' : 'rgba(255,255,255,0.58)'}
        />
      </motion.div>
    </motion.button>
  );
};

// --- Data Juices ---

const benineseJuices = [
  { id: 'J01', name: 'Jus de Bissap', image: '/images/juices/bissap.png', description: 'Le rafraîchissement iconique à l\'hibiscus rouge.' },
  { id: 'J02', name: 'Jus de Baobab', image: '/images/juices/baobab.jpg', description: 'Onctueux, riche en vitamine C et calcium.' },
  { id: 'J03', name: 'Jus d\'Ananas', image: '/images/juices/ananas.jpg', description: 'La douceur pure de l\'ananas Pain de Sucre.' },
  { id: 'J04', name: 'Jus de Tamarin', image: '/images/juices/tamarin.jpg', description: 'Une saveur acidulée, digestive et rafraîchissante.' },
  { id: 'J05', name: 'Jus de Mangue', image: '/images/juices/mangue.jpg', description: 'Le velouté des meilleures mangues du Bénin.' },
  { id: 'J06', name: 'Jus de Corossol', image: 'https://picsum.photos/seed/corossol/600/800', description: 'Une texture onctueuse aux notes exotiques.' },
  { id: 'J07', name: 'Jus de Passion', image: 'https://picsum.photos/seed/passion/600/800', description: 'Un parfum intense et une acidité parfaite.' },
  { id: 'J08', name: 'Jus de Gingembre', image: 'https://picsum.photos/seed/ginger/600/800', description: 'Un punch naturel, tonifiant et épicé.' },
];

// --- Deep Views ---

const AccountSecurityView = ({ currentUser, setCurrentUser, t, securitySubView, setSecuritySubView, goBack, showAlert }: any) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ current: '', new: '', confirm: '', email: currentUser?.email || '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const handleSave = () => {
    if (!currentUser) return;

    if (securitySubView === 'password') {
      if (!formData.new || formData.new !== formData.confirm) {
        showAlert("Les mots de passe ne correspondent pas", "error");
        return;
      }
      if (formData.current !== currentUser.password) {
        showAlert("Mot de passe actuel incorrect", "error");
        return;
      }
      const updatedUser = { ...currentUser, password: formData.new };
      setCurrentUser(updatedUser);
      dbService.setCurrentUser(updatedUser);
    } else if (securitySubView === 'email') {
      if (!formData.email || !formData.email.includes('@')) {
        showAlert("Email invalide", "error");
        return;
      }
      const updatedUser = { ...currentUser, email: formData.email };
      setCurrentUser(updatedUser);
      dbService.setCurrentUser(updatedUser);
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSecuritySubView('main');
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="font-bold text-stone-800">{t.save} !</h3>
        <p className="text-stone-400 text-xs">Vos modifications ont été enregistrées avec succès.</p>
      </div>
    );
  }

  switch (securitySubView) {
    case 'password':
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={springTransition} className="space-y-4">
          <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
            <h3 className="text-[10px] font-black uppercase text-stone-400 mb-4">{t.changePassword}</h3>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPass.current ? "text" : "password"}
                  placeholder={t.currentPassword}
                  className="w-full bg-white border border-stone-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                  value={formData.current}
                  onChange={e => setFormData({ ...formData, current: e.target.value })}
                />
                <button type="button" onClick={() => setShowPass({ ...showPass, current: !showPass.current })} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 p-1">
                  {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass.new ? "text" : "password"}
                  placeholder={t.newPassword}
                  className="w-full bg-white border border-stone-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                  value={formData.new}
                  onChange={e => setFormData({ ...formData, new: e.target.value })}
                />
                <button type="button" onClick={() => setShowPass({ ...showPass, new: !showPass.new })} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 p-1">
                  {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass.confirm ? "text" : "password"}
                  placeholder={t.confirmPassword}
                  className="w-full bg-white border border-stone-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                  value={formData.confirm}
                  onChange={e => setFormData({ ...formData, confirm: e.target.value })}
                />
                <button type="button" onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 p-1">
                  {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-stone-400 italic">{t.passwordSecurityNote}</p>
          </div>
          <button onClick={handleSave} className="w-full bg-terracotta text-white py-4 rounded-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-terracotta/20">{t.save}</button>
          <button onClick={() => setSecuritySubView('main')} className="w-full text-stone-400 py-2 font-bold text-sm">{t.back}</button>
        </motion.div>
      );
    case 'email':
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={springTransition} className="space-y-4">
          <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
            <h3 className="text-[10px] font-black uppercase text-stone-400 mb-4">{t.changeEmail}</h3>
            <div className="space-y-4">
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white border border-stone-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
              <div className="relative">
                <input type="text" placeholder={t.authCode} className="w-full bg-white border border-stone-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta" />
                <button className="absolute right-2 top-1.5 px-3 py-1.5 bg-stone-100 rounded-lg text-[10px] font-bold text-stone-500 uppercase">Envoyer</button>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-stone-400 italic">{t.authCodeDesc}</p>
          </div>
          <button onClick={handleSave} className="w-full bg-terracotta text-white py-4 rounded-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-terracotta/20">{t.save}</button>
          <button onClick={() => setSecuritySubView('main')} className="w-full text-stone-400 py-2 font-bold text-sm">{t.back}</button>
        </motion.div>
      );
    default:
      return (
        <div className="space-y-3">
          <button onClick={() => setSecuritySubView('password')} className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 active:bg-stone-100 transition-colors">
            <div className="flex items-center gap-3">
              <Key size={18} className="text-stone-500" />
              <span className="font-bold text-stone-700 text-sm">{t.changePassword}</span>
            </div>
            <ChevronRight size={16} className="text-stone-400" />
          </button>
          <button onClick={() => setSecuritySubView('email')} className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 active:bg-stone-100 transition-colors">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-stone-500" />
              <span className="font-bold text-stone-700 text-sm">{t.changeEmail}</span>
            </div>
            <ChevronRight size={16} className="text-stone-400" />
          </button>
        </div>
      );
  }
};

const PersonalInfoView = ({ currentUser, setCurrentUser, t, showAlert }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const updatedUser = dbService.updateAvatar(currentUser.id, base64String);
        if (updatedUser) {
          setCurrentUser({ ...updatedUser });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!currentUser || !name.trim()) return;
    setIsSaving(true);
    try {
      const updatedUser = { ...currentUser, name: name.trim() };
      setCurrentUser(updatedUser);
      dbService.setCurrentUser(updatedUser);
      await dbService.syncUserToCloud(updatedUser);
      setIsEditing(false);
      showAlert(t.saveSuccess || "Modifications enregistrées !", "success");
    } catch (err) {
      showAlert("Erreur lors de la sauvegarde", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center mb-6">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-stone-100">
            <img
              src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`}
              className="w-full h-full object-cover"
              alt="Avatar"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2.5 bg-terracotta text-white rounded-full shadow-lg border-2 border-white hover:scale-110 active:scale-95 transition-all"
          >
            <Camera size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </div>
        <p className="mt-3 text-[10px] font-black text-stone-400 uppercase tracking-widest">{t.changeProfilePhoto}</p>
      </div>

      <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest">{t.identity}</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-[10px] font-black uppercase text-terracotta tracking-widest px-3 py-1 bg-terracotta/5 rounded-lg"
            >
              {t.edit}
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-stone-400 uppercase">{t.fullName}</label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-stone-100 rounded-xl p-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-terracotta mt-1 transition-all"
                placeholder={t.fullName}
              />
            ) : (
              <p className="font-bold text-stone-800 border-b border-stone-100 pb-2 transition-all">{currentUser?.name}</p>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold text-stone-400 uppercase">{t.emailAddr}</label>
            <p className="font-bold text-stone-400 border-b border-stone-100 pb-2">{currentUser?.email}</p>
            <p className="text-[9px] text-stone-300 italic mt-1">L'email ne peut pas être modifié ici pour des raisons de sécurité.</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-stone-400 uppercase">{t.memberSince}</label>
            <p className="font-bold text-stone-800">{currentUser?.joinedDate}</p>
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="flex gap-3">
          <button
            onClick={() => { setIsEditing(false); setName(currentUser?.name || ''); }}
            className="flex-1 py-4 rounded-full font-bold text-sm text-stone-400 bg-stone-100 active:scale-95 transition-all"
          >
            {t.back || "Annuler"}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-2 bg-terracotta text-white py-4 px-8 rounded-full font-bold text-sm shadow-lg shadow-terracotta/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
            {t.save}
          </button>
        </div>
      ) : (
        <p className="text-center text-[10px] text-stone-400 font-medium px-6">
          Vos informations sont stockées en toute sécurité et synchronisées sur tous vos appareils.
        </p>
      )}
    </div>
  );
};

const ProfileSubViewRenderer = ({ profileSubView, setProfileSubView, currentUser, setCurrentUser, t, securitySubView, setSecuritySubView, goBack, updateSettings, handleLogout, settings, handleSaveSettings, isSyncing, hasLoadedAtLeastOnce, showAlert }: any) => {
  const views: Record<string, () => React.JSX.Element> = {
    'personalInfo': () => (
      <PersonalInfoView
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        t={t}
        showAlert={showAlert}
      />
    ),
    'notifications': () => (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-stone-50 rounded-3xl border border-stone-100">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
          <Bell size={32} />
        </div>
        <h3 className="font-bold text-stone-800 mb-1">{t.noNotifications}</h3>
        <p className="text-stone-400 text-xs">{t.notificationDesc}</p>
      </div>
    ),
    'settings': () => (
      <div className="space-y-3">
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              {settings.darkMode ? <Moon size={16} /> : <Sun size={16} />}
            </div>
            <span className="font-bold text-stone-700 text-sm">Mode sombre</span>
          </div>
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${settings.darkMode ? 'bg-indigo-600' : 'bg-stone-200'}`}
          >
            <motion.div
              animate={{ x: settings.darkMode ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>

        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Globe size={18} />
            </div>
            <span className="font-bold text-stone-700 text-sm">{t.language}</span>
          </div>
          <div className="flex gap-2">
            {(['fr', 'en', 'es'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => updateSettings({ language: lang })}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-all border ${settings.language === lang ? 'bg-terracotta text-white border-terracotta' : 'bg-white text-stone-500 border-stone-100'}`}
              >
                {lang === 'fr' ? 'FR' : lang === 'en' ? 'EN' : 'ES'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Ruler size={18} />
            </div>
            <span className="font-bold text-stone-700 text-sm">{t.units}</span>
          </div>
          <button
            onClick={() => updateSettings({ unitSystem: settings.unitSystem === 'metric' ? 'imperial' : 'metric' })}
            className="px-3 py-1.5 bg-white border border-stone-100 rounded-full text-[10px] font-black uppercase text-terracotta"
          >
            {settings.unitSystem === 'metric' ? t.metric.split(' ')[0] : t.imperial.split(' ')[0]}
          </button>
        </div>
        <button
          onClick={() => {
            setProfileSubView('security');
            setSecuritySubView('main');
          }}
          className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 active:bg-stone-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <ShieldCheck size={18} />
            </div>
            <span className="font-bold text-stone-700 text-sm">{t.security}</span>
          </div>
          <ChevronRight size={16} className="text-stone-400" />
        </button>
        <button
          onClick={handleSaveSettings}
          className="w-full mt-6 bg-terracotta text-white py-4 rounded-full font-bold font-sm shadow-lg shadow-terracotta/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={18} />
          {t.save} {t.settings.toLowerCase()}
        </button>

        {/* Sync Status Indicator moved here */}
        {(isSyncing || !hasLoadedAtLeastOnce) && (
          <div className="flex justify-center mt-6">
            <div className="bg-white px-4 py-2 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fb5607] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fb5607]"></span>
              </span>
              <span className="text-[10px] font-black text-[#fb5607] tracking-widest uppercase">Cloud Sync en cours...</span>
            </div>
          </div>
        )}
      </div>
    ),
    'security': () => (
      <AccountSecurityView
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        t={t}
        securitySubView={securitySubView}
        setSecuritySubView={setSecuritySubView}
        goBack={goBack}
        showAlert={showAlert}
      />
    ),
    'privacy': () => (
      <div className="space-y-6">
        <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
          <h3 className="text-[10px] font-black uppercase text-stone-400 mb-6">{t.privacyMenu}</h3>
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="pr-4">
                <h4 className="text-sm font-bold text-stone-700 mb-1">{t.tracking}</h4>
                <p className="text-[10px] text-stone-400 leading-relaxed">{t.trackingDesc}</p>
              </div>
              <div className="w-10 h-5 bg-terracotta rounded-full relative flex-shrink-0">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        <button className="w-full border border-rose-100 bg-rose-50 text-rose-500 py-4 rounded-2xl font-bold text-sm">
          {t.deleteAccount}
        </button>
      </div>
    ),
    'about': () => (
      <div className="space-y-8 text-center py-6">
        <div className="relative mx-auto w-24 h-24 mb-4">
          <div className="absolute inset-0 bg-terracotta/5 dark:bg-terracotta/10 rounded-[32px] animate-pulse" />
          <div className="relative flex items-center justify-center h-full">
            <img
              src="/images/chef_icon_v2.png"
              className="w-20 h-20 object-contain drop-shadow-xl"
              alt="AfroCuisto Logo"
            />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-white tracking-tight mb-2">AfroCuisto v1.0.6</h2>
          <p className="text-stone-500 dark:text-stone-400 font-medium text-sm px-8 leading-relaxed">
            L'excellence de la cuisine béninoise à portée de main. Découvrez le patrimoine culinaire du Bénin.
          </p>
        </div>

        <div className="pt-4 pb-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100/50 dark:bg-white/5 rounded-full border border-stone-200/50 dark:border-white/10 transition-colors">
            <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">Powered by</span>
            <span className="text-[11px] font-bold text-terracotta">André Koutomi</span>
          </div>
        </div>

        <p className="text-[10px] text-stone-400 dark:text-stone-600 italic transition-colors">
          &copy; {new Date().getFullYear()} AfroCuisto. Tous droits réservés.
        </p>
      </div>
    )
  };

  const renderView = views[profileSubView] || views['settings'] || (() => null);
  return renderView();
};

// --- Main Application ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(dbService.getCurrentUser());
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authFormData, setAuthFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Initial Auth Check
    const initAuth = async () => {
      if (!dbService.supabase) return;
      const { data: { session } } = await dbService.supabase.auth.getSession();

      const updateUserObject = async (sessionUser: any) => {
        setIsSyncing(true);
        try {
          // Fetch remote profile
          const remoteProfile = await dbService.getRemoteUserProfile(sessionUser.id);
          const existingLocal = dbService.getUsers().find(u => u.email === sessionUser.email) || null;

          const userObj: User = {
            id: sessionUser.id,
            name: remoteProfile?.name || sessionUser.user_metadata?.full_name || existingLocal?.name || sessionUser.email?.split('@')[0] || "User",
            email: sessionUser.email!,
            favorites: remoteProfile?.favorites || existingLocal?.favorites || [],
            shoppingList: remoteProfile?.shoppingList || existingLocal?.shoppingList || [],
            joinedDate: existingLocal?.joinedDate || new Date(sessionUser.created_at || Date.now()).toLocaleDateString(),
            settings: remoteProfile?.settings || existingLocal?.settings || { darkMode: false, language: 'fr', unitSystem: 'metric' },
            avatar: existingLocal?.avatar || remoteProfile?.avatar
          };

          setCurrentUser(userObj);
          dbService.setCurrentUser(userObj);
          setHasLoadedAtLeastOnce(true);

          // If no remote profile was found, create one now to ensure persistence
          if (!remoteProfile) {
            await dbService.syncUserToCloud(userObj);
          }
        } catch (err) {
          console.error('Error syncing user object:', err);
        } finally {
          setIsSyncing(false);
        }
      };

      if (session?.user) {
        updateUserObject(session.user);
      }

      dbService.supabase.auth.onAuthStateChange((_event, curSession) => {
        if (curSession?.user) {
          updateUserObject(curSession.user);
        } else {
          setCurrentUser(null);
          dbService.setCurrentUser(null);
        }
      });
    };
    initAuth();
  }, []);

  // Cloud Sync & Internet Dependency
  const [allRecipes, setAllRecipes] = useState<Recipe[]>(recipes); // Use static data as first fallback
  const [isSyncing, setIsSyncing] = useState(true);
  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
    onConfirm?: () => void;
  }>({ show: false, message: '', type: 'info' });

  const showAlert = (message: string, type?: 'success' | 'error' | 'info', onConfirm?: () => void) => {
    let finalType = type || 'info';
    if (!type) {
      const lower = message.toLowerCase();
      if (lower.includes('succès') || lower.includes('ajouté') || lower.includes('enregistré') || lower.includes('merci') || lower.includes('bienvenue') || lower.includes('parti')) finalType = 'success';
      else if (lower.includes('erreur') || lower.includes('incorrect') || lower.includes('invalide') || lower.includes('échec') || lower.includes('correspondent pas')) finalType = 'error';
    }
    setAlertConfig({ show: true, message, type: finalType, onConfirm });
  };

  const ModernAlert = () => (
    <AnimatePresence>
      {alertConfig.show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md"
          onClick={() => setAlertConfig({ ...alertConfig, show: false })}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="w-full max-w-[320px] bg-white rounded-[40px] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.3)] border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`h-32 flex items-center justify-center relative overflow-hidden ${alertConfig.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
              alertConfig.type === 'error' ? 'bg-rose-50 text-rose-500' :
                'bg-[#fb5607]/5 text-[#fb5607]'
              }`}>
              {/* Background Glow */}
              <div className={`absolute inset-0 opacity-20 blur-3xl ${alertConfig.type === 'success' ? 'bg-emerald-400' :
                alertConfig.type === 'error' ? 'bg-rose-400' :
                  'bg-[#fb5607]'
                }`} />

              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                className="relative z-10"
              >
                {alertConfig.type === 'success' && <CheckCircle2 size={42} strokeWidth={2.5} />}
                {alertConfig.type === 'error' && <AlertCircle size={42} strokeWidth={2.5} />}
                {alertConfig.type === 'info' && <Info size={42} strokeWidth={2.5} />}
              </motion.div>
            </div>

            <div className="p-8 pb-10 text-center">
              <p className="text-sm font-black text-stone-900 leading-relaxed mb-8 px-2">{alertConfig.message}</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                    setAlertConfig({ ...alertConfig, show: false });
                  }}
                  className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${alertConfig.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                    alertConfig.type === 'error' ? 'bg-rose-500 text-white shadow-rose-500/20' :
                      'bg-stone-900 text-white shadow-stone-900/20'
                    }`}
                >
                  {alertConfig.onConfirm ? "Confirmer" : "C'est compris"}
                </button>
                {alertConfig.onConfirm && (
                  <button
                    onClick={() => setAlertConfig({ ...alertConfig, show: false })}
                    className="w-full py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncError, setSyncError] = useState(false);
  const [hasLoadedAtLeastOnce, setHasLoadedAtLeastOnce] = useState(false);
  const [dynamicSections, setDynamicSections] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const syncRecipes = async () => {
      setIsSyncing(true);
      setSyncError(false);
      try {
        const remote = await dbService.getRemoteRecipes();
        if (remote && remote.length > 0) {
          setAllRecipes(remote);
          setHasLoadedAtLeastOnce(true);
        } else if (allRecipes.length === 0) {
          setSyncError(true);
        }
      } catch (err) {
        console.error('Initial sync failed:', err);
        if (allRecipes.length === 0) {
          setSyncError(true);
        }
      } finally {
        setIsSyncing(false);
      }
    };

    const syncSections = async () => {
      try {
        const sections = await dbService.getRemoteSections();
        setDynamicSections(sections || []);
      } catch (err) {
        console.error('Sections sync failed:', err);
      }
    };

    // Always attempt sync; dbService handles offline fallback to cache
    syncRecipes();
    syncSections();

    // 1. Realtime Sync Subscription
    let channel: any;
    let sectionsChannel: any;
    if (dbService.supabase) {
      channel = dbService.supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'recipes' },
          () => {
            console.log('Change detected in Supabase, re-syncing recipes...');
            syncRecipes();
          }
        )
        .subscribe();

      sectionsChannel = dbService.supabase
        .channel('sections-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'home_sections' },
          () => {
            console.log('Home sections changed, re-syncing sections...');
            syncSections();
          }
        )
        .subscribe();
    }

    // 2. Foreground Sync (Capacitor)
    const handleAppStateChange = (state: any) => {
      if (state.isActive) {
        console.log('App resumed, syncing recipes and sections...');
        syncRecipes();
        syncSections();
      }
    };
    const appListener = CapacitorApp.addListener('appStateChange', handleAppStateChange);

    return () => {
      if (channel) dbService.supabase?.removeChannel(channel);
      if (sectionsChannel) dbService.supabase?.removeChannel(sectionsChannel);
      appListener.then(l => l.remove());
    };
  }, []);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [history, setHistory] = useState<string[]>(['home']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [profileSubView, setProfileSubView] = useState<string | null>(null);
  const [securitySubView, setSecuritySubView] = useState<'main' | 'password' | 'email' | 'validation'>('main');
  const [aiRecommendation, setAiRecommendation] = useState<string>("Chargement de votre suggestion personnalisée...");
  const [kidPageIndex, setKidPageIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const juicesRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (activeTab !== 'home' || !juicesRef.current) return;

    let animationId: number;
    const container = juicesRef.current;

    const scroll = () => {
      if (container) {
        container.scrollLeft += 0.8;
        if (container.scrollLeft >= (container.scrollWidth - container.clientWidth) - 1) {
          container.scrollLeft = 0;
        }
        animationId = requestAnimationFrame(scroll);
      }
    };

    return () => cancelAnimationFrame(animationId);
  }, [activeTab, selectedRecipe]);

  const detailScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRecipe && detailScrollRef.current) {
      detailScrollRef.current.scrollTo(0, 0);
    }
  }, [selectedRecipe]);

  // Navigation Logic
  const navigateTo = (tab: string) => {
    if (tab === activeTab) return;
    setHistory(prev => [...prev, tab]);
    setActiveTab(tab);
    setSelectedRecipe(null);
    setProfileSubView(null);
    setSecuritySubView('main');
    setIsScrolled(false);
    if (mainScrollRef.current) mainScrollRef.current.scrollTo(0, 0);
  };

  const onMainScroll = (e: React.UIEvent<HTMLElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 50);
    if (e.currentTarget.scrollTop <= 50) setIsSearchExpanded(false);
  };

  const goBack = () => {
    if (selectedRecipe) {
      setSelectedRecipe(null);
      return;
    }
    if (profileSubView === 'Sécurité du compte' && securitySubView !== 'main') {
      setSecuritySubView('main');
      return;
    }
    if (profileSubView) {
      setProfileSubView(null);
      return;
    }
    if (selectedCategory || selectedRegion || searchQuery) {
      setSelectedCategory(null);
      setSelectedRegion(null);
      setSearchQuery('');
      return;
    }
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const prevTab = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setActiveTab(prevTab);
      return;
    }
    CapacitorApp.exitApp();
  };

  useEffect(() => {
    const handleBackButton = () => {
      goBack();
    };
    const listener = CapacitorApp.addListener('backButton', handleBackButton);
    return () => { listener.then(l => l.remove()); };
  }, [selectedRecipe, profileSubView, selectedCategory, selectedRegion, searchQuery, history, securitySubView]);

  // Dark mode: read from localStorage if user is not logged in, otherwise from user settings
  const savedDarkMode = typeof window !== 'undefined' ? localStorage.getItem('afrocuisto_dark_mode') === 'true' : false;
  const settings = currentUser?.settings || { darkMode: savedDarkMode, language: 'fr', unitSystem: 'metric' };
  const t = translations[settings.language as LanguageCode] || translations.fr;

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        settings: { ...(currentUser.settings || { darkMode: false, language: 'fr', unitSystem: 'metric' }), ...newSettings }
      };
      setCurrentUser(updatedUser);
      dbService.setCurrentUser(updatedUser);
      // Persist dark mode preference to localStorage for login screen
      if ('darkMode' in newSettings) {
        localStorage.setItem('afrocuisto_dark_mode', String(newSettings.darkMode));
      }
    }
  };

  const handleSaveSettings = async () => {
    if (currentUser) {
      dbService.setCurrentUser(currentUser);
      // Sync to Supabase cloud
      await dbService.syncUserToCloud(currentUser);
      showAlert("Paramètres enregistrés et synchronisés !", "success");
    }
  };

  const handleLogout = async () => {
    // Persist current dark mode preference before clearing user
    const currentDarkMode = currentUser?.settings?.darkMode === true;
    localStorage.setItem('afrocuisto_dark_mode', String(currentDarkMode));
    await dbService.signOut();
    dbService.setCurrentUser(null);
    setCurrentUser(null);
    setActiveTab('home');
    setHistory(['home']);
    setSelectedRecipe(null);
    showAlert("Vous êtes maintenant déconnecté", "success");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await dbService.signIn(authFormData.email.trim(), authFormData.password);
    } catch (err: any) {
      let msg = err.message || "Email ou mot de passe incorrect";
      if (msg.includes("Email not confirmed")) {
        msg = "Veuillez confirmer votre adresse email avant de vous connecter. Vérifiez vos spams !";
      } else if (msg.includes("Invalid login credentials")) {
        msg = "Email ou mot de passe incorrect. Vérifiez vos identifiants.";
      }
      setAuthError(msg);
      showAlert(msg, "error");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const data = await dbService.signUp(authFormData.email.trim(), authFormData.password, authFormData.name.trim());

      if (data?.session) {
        showAlert("Compte créé avec succès ! Bienvenue.", "success");
      } else {
        showAlert("Compte créé ! Veuillez vérifier votre boîte mail pour confirmer votre inscription.", "info");
        setAuthMode('login');
        // On garde l'email mais on vide le mot de passe pour la sécurité
        setAuthFormData(prev => ({ ...prev, password: '' }));
      }
    } catch (err: any) {
      setAuthError(err.message || "Erreur lors de la création du compte.");
      showAlert("Échec de l'inscription", "error");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const toggleFavorite = (recipeId: string) => {
    if (!currentUser) return;
    const updatedUser = dbService.toggleFavorite(currentUser.id, recipeId);
    if (updatedUser) setCurrentUser({ ...updatedUser });
  };

  const updateShoppingList = (newList: ShoppingItem[]) => {
    if (!currentUser) return;
    const updatedUser = dbService.updateShoppingList(currentUser.id, newList);
    if (updatedUser) setCurrentUser({ ...updatedUser });
  };

  useEffect(() => {
    if (currentUser) {
      getAIRecipeRecommendation(allRecipes, currentUser.name).then(setAiRecommendation);
    }
  }, [currentUser]);

  const filteredRecipes = useMemo(() => {
    let result = allRecipes;
    if (searchQuery) {
      const normalizedQuery = normalizeString(searchQuery);
      result = result.filter(r =>
        normalizeString(r.name).includes(normalizedQuery) ||
        normalizeString(r.region).includes(normalizedQuery)
      );
    }
    if (selectedCategory) result = result.filter(r => r.category === selectedCategory);
    if (selectedRegion) result = result.filter(r => r.region.toLowerCase().includes(selectedRegion.toLowerCase()));
    return result;
  }, [allRecipes, searchQuery, selectedCategory, selectedRegion]);

  const displayRecipes = filteredRecipes;
  const featuredRecipes = displayRecipes.slice(0, 5);
  const otherRecipes = displayRecipes.length > 5 ? displayRecipes.slice(5) : allRecipes.filter(r => !featuredRecipes.find(fr => fr.id === r.id)).slice(0, 5);

  const isDark = settings.darkMode === true;

  // Sync Android status bar icons & theme-color meta tag with dark mode
  useEffect(() => {
    // 1. Update <html> class for color-scheme propagation
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Update the <meta name="theme-color"> tag dynamically
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#111113' : '#BF4E30');
    }

    // 3. Update Android status bar icon colors via Capacitor SystemBars plugin
    if (Capacitor.isNativePlatform()) {
      SystemBars.setStyle({
        // Dark style = light/white icons (for dark backgrounds)
        // Light style = dark icons (for light backgrounds)
        style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
      }).catch(() => {
        // Silently fail on platforms that don't support this
      });
    }
  }, [isDark]);

  const navItems = [
    { id: 'home', icon: Home, label: t.home },
    { id: 'search', icon: Search, label: t.explorer },
    { id: 'favs', icon: Heart, label: t.favorites },
    { id: 'cart', icon: ShoppingBag, label: t.shoppingList },
    { id: 'profile', icon: UserIcon, label: t.profile },
  ];

  // --- Sub-Renderers (extracted for clarity) ---

  const renderHome = () => (
    <div className="flex-1 flex flex-col pb-44">
      {/* Sleek Persistent Header */}
      <header className="px-6 pt-6 pb-6 bg-white/95 backdrop-blur-2xl sticky top-0 z-[100] border-b border-stone-100 flex flex-col gap-6 transition-all duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              whileTap={{ scale: 0.9 }}
              onClick={() => mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className="cursor-pointer"
            >
              <img src="/images/chef_icon_v2.png" className={`w-14 h-14 object-contain -ml-1 ${isDark ? 'logo-dark-mode' : ''}`} alt="AfroCuisto Logo" />
            </motion.div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-stone-900 tracking-tight leading-none">Afro<span className="text-[#fb5607]">Cuisto</span></h1>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{t.homeSlogan}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSyncing && (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="text-[#fb5607]">
                <Wifi size={16} />
              </motion.div>
            )}
            <button
              onClick={() => setIsSearchExpanded(true)}
              className="w-10 h-10 bg-stone-100 text-stone-600 rounded-full flex items-center justify-center border border-stone-200/50"
            >
              <Search size={18} />
            </button>
          </div>
        </div>

      </header>

      <AnimatePresence>
        {isSearchExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-[200] flex flex-col ${isDark ? '' : 'search-overlay-light'}`}
            style={{ background: isDark ? 'rgba(10,10,12,0.96)' : 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)' }}
          >
            {/* Search Header */}
            <div className="px-5 pt-[env(safe-area-inset-top,16px)] pb-4 pt-12 flex items-center gap-3">
              <button
                onClick={() => { setIsSearchExpanded(false); setSearchQuery(''); }}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${isDark ? 'bg-white/10 text-white border-white/10' : 'bg-stone-100 text-stone-600 border-stone-200/50'}`}
              >
                <ChevronLeft size={20} />
              </button>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex-1 relative"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fb5607]" size={18} />
                <input
                  type="text"
                  autoFocus
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-full py-3.5 pl-11 pr-5 focus:outline-none font-bold text-[15px] transition-all ${isDark ? 'bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:border-[#fb5607]/60 focus:bg-white/15' : 'bg-stone-50 border border-stone-200/40 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#fb5607]/10'}`}
                />
              </motion.div>
            </div>

            {/* Results area */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-20">
              {searchQuery.length > 0 ? (
                <div className="space-y-2.5 mt-2">
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
                    {allRecipes.filter(r => normalizeString(r.name).includes(normalizeString(searchQuery)) || normalizeString(r.region).includes(normalizeString(searchQuery))).length} résultat(s)
                  </p>
                  {allRecipes
                    .filter(r => normalizeString(r.name).includes(normalizeString(searchQuery)) || normalizeString(r.region).includes(normalizeString(searchQuery)))
                    .map((recipe, i) => (
                      <motion.div
                        key={recipe.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => {
                          setSelectedRecipe(recipe);
                          setIsSearchExpanded(false);
                          setSearchQuery('');
                        }}
                        className={`rounded-2xl flex items-center gap-4 p-3 active:scale-[0.98] transition-all cursor-pointer overflow-hidden ${isDark ? '' : 'bg-stone-50 border border-stone-100'}`}
                        style={isDark ? { background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.07)' } : {}}
                      >
                        <img
                          src={recipe.image}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                          alt={recipe.name}
                          onError={e => { (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%23333%22/></svg>'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-bold text-sm leading-tight truncate ${isDark ? 'text-white' : 'text-stone-900'}`}>{recipe.name}</h4>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] bg-[#fb5607]/20 text-[#fb5607] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">{recipe.region}</span>
                            <span className={`text-[10px] font-bold flex items-center gap-1 ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
                              <Clock size={9} /> {recipe.prepTime}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className={`shrink-0 ${isDark ? 'text-white/25' : 'text-stone-300'}`} />
                      </motion.div>
                    ))}
                  {allRecipes.filter(r => normalizeString(r.name).includes(normalizeString(searchQuery)) || normalizeString(r.region).includes(normalizeString(searchQuery))).length === 0 && (
                    <div className="py-20 text-center">
                      <div className="text-5xl mb-4">🔍</div>
                      <p className={`font-bold ${isDark ? 'text-white/50' : 'text-stone-400'}`}>Aucun résultat pour</p>
                      <p className="text-[#fb5607] font-black text-lg mt-1">"{searchQuery}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8 mt-4">
                  {/* Trending tags */}
                  <div>
                    <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
                      <span className="w-1.5 h-1.5 bg-[#fb5607] rounded-full"></span> Tendances
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['Sauces', 'Ablo', 'Pôyô', 'Aloko', 'Boissons', 'Tchatchanga', 'Piron'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => setSearchQuery(tag)}
                          className={`px-4 py-2 border rounded-full text-[12px] font-bold active:scale-95 transition-all ${isDark ? 'border-white/10 text-white/70' : 'border-stone-200 text-stone-600'}`}
                          style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.03)' }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent / Suggested recipes */}
                  <div>
                    <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> Suggestions du chef
                    </h3>
                    <div className="space-y-2">
                      {allRecipes.slice(0, 5).map((recipe, i) => (
                        <motion.div
                          key={recipe.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          onClick={() => { setSelectedRecipe(recipe); setIsSearchExpanded(false); }}
                          className={`flex items-center gap-3 p-3 rounded-2xl active:scale-[0.97] transition-all cursor-pointer ${isDark ? '' : 'bg-stone-50'}`}
                          style={isDark ? { background: 'rgba(255,255,255,0.05)' } : {}}
                        >
                          <img src={recipe.image} className="w-10 h-10 rounded-xl object-cover" alt={recipe.name} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${isDark ? 'text-white/80' : 'text-stone-800'}`}>{recipe.name}</p>
                            <p className={`text-[10px] ${isDark ? 'text-white/30' : 'text-stone-400'}`}>{recipe.region}</p>
                          </div>
                          <ChevronRight size={14} className={`shrink-0 ${isDark ? 'text-white/20' : 'text-stone-300'}`} />
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



      {/* Categories Horizontal Pills */}
      <section className="mt-5 mb-8 pl-6">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pr-6">
          {[
            { name: 'Pâtes et Céréales (Wɔ̌)', short: t.catPates, icon: '🥣' },
            { name: 'Sauces (Nùsúnnú)', short: t.catSauces, icon: '🍲' },
            { name: 'Protéines & Grillades', short: t.catGrillades, icon: '🍗' },
            { name: 'Boissons & Douceurs', short: t.catBoissons, icon: '🍹' },
          ].map((cat, i) => (
            <motion.div
              key={cat.short}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setSelectedCategory(cat.name); setActiveTab('search'); }}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl cursor-pointer shadow-sm border transition-all ${selectedCategory === cat.name ? 'bg-terracotta text-white border-terracotta shadow-terracotta/20' : 'bg-white text-stone-700 border-stone-100/80 hover:bg-stone-50'}`}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="font-bold text-xs">{cat.short}</span>
            </motion.div>
          ))}
        </div>
      </section>


      {/* Dynamic Sections from Admin CMS */}
      {dynamicSections.filter((section: any) => !section.config?.page || section.config.page === 'home').map((section, sidx) => {
        let sectionRecipes: Recipe[] = [];

        if (section.type === 'category') {
          sectionRecipes = allRecipes.filter(r => r.category === section.config?.category);
        } else if (section.type === 'region') {
          sectionRecipes = allRecipes.filter(r => r.region?.toLowerCase().includes(section.config?.region?.toLowerCase() || ''));
        } else if (section.type === 'quick') {
          const maxTime = parseInt(section.config?.max_prep_time) || 30;
          sectionRecipes = allRecipes.filter(r => (parseInt(r.prep_time) || 60) <= maxTime);
        } else if (section.type === 'all') {
          sectionRecipes = [...allRecipes];
        } else {
          // Default to manual selection or 'query' (backwards compatibility)
          sectionRecipes = allRecipes.filter(r => section.recipe_ids?.includes(r.id));
        }

        // Apply limit only if explicitly configured — default to 200 to show all selected recipes
        sectionRecipes = sectionRecipes.slice(0, section.config?.limit || 200);

        if (sectionRecipes.length === 0) return null;

        if (section.type === 'dynamic_carousel') {
          return (
            <section key={section.id} className="mb-6">
              <div className="px-6 flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                  {section.subtitle && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{section.subtitle}</p>}
                </div>
              </div>
              <SnapCarousel
                recipes={sectionRecipes}
                setSelectedRecipe={setSelectedRecipe}
                sectionId={section.id}
                currentUser={currentUser}
                toggleFavorite={toggleFavorite}
                autoplayInterval={
                  (section.config?.autoplay === true || section.config?.autoplay === 'true')
                    ? (parseInt(section.config?.autoplay_interval) || 3000)
                    : undefined
                }
              />
            </section>
          );
        }


        // ── FEATURED — Mise en avant (Groupées si consécutives) ──
        if (section.type === 'featured') {
          const homeSections = dynamicSections.filter((s: any) => !s.config?.page || s.config.page === 'home');
          const currentIdxInFiltered = homeSections.findIndex((s: any) => s.id === section.id);

          // Si la section précédente était déjà 'featured', on ne fait rien (elle a été rendue dans le groupe)
          if (currentIdxInFiltered > 0 && homeSections[currentIdxInFiltered - 1].type === 'featured') {
            return null;
          }

          // Rechercher toutes les sections 'featured' consécutives
          const featuredGroup = [section];
          let nextIdx = currentIdxInFiltered + 1;
          while (nextIdx < homeSections.length && homeSections[nextIdx].type === 'featured') {
            featuredGroup.push(homeSections[nextIdx++]);
          }

          // Si on a plus d'une section, rendu horizontal. Sinon rendu vertical classique.
          if (featuredGroup.length > 1) {
            return (
              <section key={`featured-group-${section.id}`} className="mb-14 pt-2">
                <div className="flex gap-6 overflow-x-auto no-scrollbar px-6 pb-10">
                  {featuredGroup.map((fs, fidx) => {
                    const fsRecipes = allRecipes.filter(r => fs.recipe_ids?.includes(r.id));
                    const fr = fsRecipes[0];
                    if (!fr) return null;

                    return (
                      <motion.div
                        key={fs.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: fidx * 0.18 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedRecipe(fr)}
                        className="featured-card"
                        style={{
                          flexShrink: 0,
                          width: '425px',
                          borderRadius: '36px',
                          padding: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '28px',
                          position: 'relative',
                          cursor: 'pointer',
                        }}
                      >
                        {/* Image — Gauche */}
                        <div className="featured-card-img" style={{
                          flexShrink: 0,
                          width: '165px',
                          height: '165px',
                          borderRadius: '30px',
                          overflow: 'hidden',
                          boxShadow: '0 15px 32px rgba(0,0,0,0.18)',
                        }}>
                          <img
                            src={fr.image}
                            alt={fr.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        {/* Contenu — Droite */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="featured-badge" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            borderRadius: '20px',
                            padding: '6px 16px',
                            marginBottom: '15px',
                          }}>
                            <span style={{ fontSize: '14px' }}>⭐</span>
                            <span className="featured-badge-text" style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              {fs.subtitle || 'Exclusivité'}
                            </span>
                          </div>
                          <h2 className="featured-title" style={{
                            margin: '0 0 16px',
                            fontSize: '25px',
                            fontWeight: 900,
                            lineHeight: 1.15,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            letterSpacing: '-0.02em',
                          }}>
                            {fr.name}
                          </h2>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="featured-cta" style={{ fontSize: '16px', fontWeight: 900 }}>Découvrir le plat →</span>
                          </div>
                        </div>

                        {/* Décoration subtile */}
                        <div style={{
                          position: 'absolute', right: '18px', top: '18px',
                          opacity: 0.18, color: '#e55820', pointerEvents: 'none'
                        }}>
                          <Sparkles size={26} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          }

          // Rendu Single (FORMAT TITANESQUE)
          const featuredRecipe = sectionRecipes[0];
          if (!featuredRecipe) return null;
          return (
            <section key={section.id} className="px-6 mb-14">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRecipe(featuredRecipe)}
                style={{
                  borderRadius: '42px',
                  background: 'linear-gradient(135deg, #c0392b 0%, #e55820 50%, #f59e0b 100%)',
                  padding: '40px 36px 40px 42px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '28px',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  boxShadow: '0 20px 55px rgba(229,88,32,0.45), 0 6px 18px rgba(0,0,0,0.25)',
                }}
              >
                {/* Cercles décoratifs de fond encore plus grands */}
                <div style={{
                  position: 'absolute', right: '-40px', top: '-40px',
                  width: '220px', height: '220px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                }} />
                <div style={{
                  position: 'absolute', right: '120px', bottom: '-70px',
                  width: '160px', height: '160px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                }} />

                {/* Contenu gauche */}
                <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
                  {/* Plus gros Badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(255,255,255,0.28)',
                    borderRadius: '24px', padding: '6px 20px', marginBottom: '18px',
                  }}>
                    <span style={{ fontSize: '15px' }}>💎</span>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {section.subtitle || 'Chef d\'œuvre'}
                    </span>
                  </div>
                  {/* Nom de la recette Titanesque */}
                  <h2 style={{
                    margin: '0 0 24px',
                    fontSize: 'clamp(28px, 9vw, 40px)',
                    fontWeight: 900,
                    color: '#fff',
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {featuredRecipe.name}
                  </h2>
                  {/* Plus gros Bouton */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedRecipe(featuredRecipe); }}
                    style={{
                      background: '#fff',
                      border: 'none',
                      borderRadius: '28px',
                      padding: '14px 34px',
                      fontSize: '17px',
                      fontWeight: 900,
                      color: '#c0392b',
                      cursor: 'pointer',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.28)',
                      transition: 'all 0.2s',
                    }}
                  >
                    Voir l'histoire du plat →
                  </button>
                </div>

                {/* Image du plat — droite Titanesque */}
                <div style={{
                  flexShrink: 0,
                  width: 'min(185px, 45vw)',
                  height: 'min(185px, 45vw)',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '6px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 15px 45px rgba(0,0,0,0.4)',
                  zIndex: 1,
                }}>
                  <img
                    src={featuredRecipe.image}
                    alt={featuredRecipe.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </motion.div>
            </section>
          );
        }

        if (section.type === 'horizontal_list') {
          return (
            <section key={section.id} className="mb-10">
              {/* Section header */}
              <div className="px-6 flex justify-between items-end mb-4">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                  {section.subtitle && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{section.subtitle}</p>}
                </div>

              </div>

              {/* Horizontal scroll tray — food delivery style cards */}
              <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar pb-3">
                {sectionRecipes.map((recipe, ridx) => {
                  const isFav = currentUser?.favorites?.includes(recipe.id) ?? false;
                  const ratingNum = (4.0 + (ridx % 5) * 0.2).toFixed(1); // e.g. 4.0–4.8
                  return (
                    <motion.div
                      key={recipe.id}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: ridx * 0.07 }}
                      onClick={() => setSelectedRecipe(recipe)}
                      className="flex-shrink-0 cursor-pointer"
                      style={{ width: 'min(48vw, 185px)' }}
                    >
                      {/* Card container */}
                      <div className="hlist-card" style={{
                        borderRadius: '20px',
                        overflow: 'hidden',
                      }}>
                        {/* Image area */}
                        <div className="relative" style={{ aspectRatio: '4 / 3' }}>
                          <img
                            src={recipe.image}
                            alt={recipe.name}
                            className="w-full h-full object-cover"
                          />



                          {/* Heart — top right */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                            style={{
                              position: 'absolute', top: '10px', right: '10px',
                              width: '30px', height: '30px', borderRadius: '50%',
                              background: isFav ? '#ef4444' : 'rgba(255,255,255,0.85)',
                              backdropFilter: 'blur(4px)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: 'none', cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Heart
                              size={14}
                              style={{
                                color: isFav ? '#fff' : '#ef4444',
                                fill: isFav ? '#fff' : 'none',
                              }}
                              strokeWidth={isFav ? 0 : 2.5}
                            />
                          </button>

                          {/* Rating badge — bottom left */}
                          <div style={{
                            position: 'absolute', bottom: '10px', left: '10px',
                            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)',
                            borderRadius: '8px', padding: '3px 8px',
                            display: 'flex', alignItems: 'center', gap: '3px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                          }}>
                            <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#374151', lineHeight: 1 }}>
                              {ratingNum}
                            </span>
                          </div>
                        </div>

                        {/* Text content area */}
                        <div style={{ padding: '12px 14px 14px' }}>
                          {/* Recipe name */}
                          <h3 className="hlist-card-title" style={{
                            fontSize: '15px', fontWeight: 800,
                            lineHeight: 1.25, margin: '0 0 6px',
                            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {recipe.name}
                          </h3>

                          {/* Temps de préparation */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                            <div className="hlist-card-badge" style={{ borderRadius: '20px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={10} className="hlist-card-clock" />
                              <span className="hlist-card-time" style={{ fontSize: '11px', fontWeight: 700 }}>
                                {recipe.prepTime ? `${recipe.prepTime} min` : '30 min'}
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          <p style={{
                            fontSize: '11px', color: '#9ca3af', fontWeight: 500,
                            lineHeight: 1.4, margin: '0 0 10px',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {recipe.description || recipe.region || recipe.category || 'Recette traditionnelle africaine avec des saveurs authentiques...'}
                          </p>


                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        }

        if (section.type === 'vertical_list_2') {
          return (
            <section key={section.id} className="mb-10">
              {/* En-tête */}
              <div className="px-6 flex justify-between items-end mb-4">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                  {section.subtitle && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{section.subtitle}</p>}
                </div>

              </div>

              {/* Grille 2 colonnes — style card horizontal_list */}
              <div className="px-6 grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {sectionRecipes.map((recipe, ridx) => {
                  const isFav = currentUser?.favorites?.includes(recipe.id) ?? false;
                  const ratingNum = (4.0 + (ridx % 5) * 0.2).toFixed(1);
                  return (
                    <motion.div
                      key={recipe.id}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ridx * 0.06 }}
                      onClick={() => setSelectedRecipe(recipe)}
                      className="cursor-pointer"
                    >
                      <div className="hlist-card" style={{
                        borderRadius: '20px',
                        overflow: 'hidden',
                      }}>
                        {/* Zone image */}
                        <div className="relative" style={{ aspectRatio: '4 / 3' }}>
                          <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />

                          {/* Bouton cœur — haut droite */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                            style={{
                              position: 'absolute', top: '8px', right: '8px',
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: isFav ? '#ef4444' : 'rgba(255,255,255,0.85)',
                              backdropFilter: 'blur(4px)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: 'none', cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Heart size={13} style={{ color: isFav ? '#fff' : '#ef4444', fill: isFav ? '#fff' : 'none' }} strokeWidth={isFav ? 0 : 2.5} />
                          </button>

                          {/* Badge note — bas gauche */}
                          <div style={{
                            position: 'absolute', bottom: '8px', left: '8px',
                            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)',
                            borderRadius: '8px', padding: '2px 7px',
                            display: 'flex', alignItems: 'center', gap: '3px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                          }}>
                            <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#374151', lineHeight: 1 }}>{ratingNum}</span>
                          </div>
                        </div>

                        {/* Contenu texte */}
                        <div style={{ padding: '10px 12px 12px' }}>
                          {/* Nom */}
                          <h3 className="hlist-card-title" style={{
                            fontSize: '13px', fontWeight: 800,
                            lineHeight: 1.25, margin: '0 0 5px',
                            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {recipe.name}
                          </h3>
                          {/* Temps de préparation */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                            <div className="hlist-card-badge" style={{ borderRadius: '20px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={10} className="hlist-card-clock" />
                              <span className="hlist-card-time" style={{ fontSize: '11px', fontWeight: 700 }}>
                                {recipe.prepTime ? `${recipe.prepTime} min` : '30 min'}
                              </span>
                            </div>
                          </div>
                          {/* Description */}
                          <p style={{
                            fontSize: '10px', color: '#9ca3af', fontWeight: 500,
                            lineHeight: 1.4, margin: '0 0 8px',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {recipe.description || recipe.region || recipe.category || 'Recette africaine traditionnelle'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        }

        // ── VERTICAL LIST (vertical_list_1 et fallback) ──
        return (
          <section key={section.id} className="mb-10">
            <div className="px-6 flex justify-between items-end mb-4">
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                {section.subtitle && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{section.subtitle}</p>}
              </div>

            </div>

            {/* Vertical list — food delivery row cards */}
            <div className="px-6 flex flex-col gap-3">
              {sectionRecipes.map((recipe, ridx) => {
                const isFav = currentUser?.favorites?.includes(recipe.id) ?? false;
                const ratingNum = (4.0 + (ridx % 5) * 0.1).toFixed(1);
                return (
                  <motion.div
                    key={recipe.id}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ridx * 0.06 }}
                    onClick={() => setSelectedRecipe(recipe)}
                    style={{
                      background: '#fff',
                      borderRadius: '18px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                      border: '1px solid rgba(0,0,0,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Image */}
                    <div style={{
                      width: '76px', height: '76px', flexShrink: 0,
                      borderRadius: '14px', overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    }}>
                      <img
                        src={recipe.image}
                        alt={recipe.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Center info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Name */}
                      <p style={{
                        fontSize: '14px', fontWeight: 800, color: '#1a1a1a',
                        margin: '0 0 5px', lineHeight: 1.25,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {recipe.name}
                      </p>
                      {/* Time row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <Clock size={11} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af' }}>
                          {recipe.prepTime ? `${recipe.prepTime} min` : '30 min'}
                        </span>
                      </div>
                      {/* Rating + category */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Star size={11} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{ratingNum}</span>
                        <span style={{ fontSize: '10px', color: '#d1d5db' }}>·</span>
                        <span style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {recipe.region || recipe.category || 'Africain'}
                        </span>
                      </div>
                    </div>

                    {/* Right: difficulty badge + chevron */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      <DifficultyBadge difficulty={recipe.difficulty} t={t} />
                      <ChevronRight size={16} style={{ color: '#d1d5db' }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}


    </div >
  );

  const renderExplorer = () => (
    <div className="flex-1 flex flex-col pb-44">
      {/* Immersive Search Header */}
      <header className="px-6 pt-4 pb-6 bg-white/90 backdrop-blur-2xl sticky top-0 z-40">
        <h1 className="text-3xl font-black text-stone-900 mb-6 drop-shadow-sm">{selectedCategory || 'Explorer'}</h1>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-terracotta transition-colors" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchDishRegion}
            className="w-full bg-white border border-stone-100/80 rounded-full py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta/30 transition-all font-medium"
          />
        </div>
      </header>

      {/* Dynamic Content Area */}
      {searchQuery || selectedCategory ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={springTransition} className="px-6 pt-6 grid grid-cols-2 gap-4">
          {displayRecipes.map(recipe => (
            <motion.div
              key={recipe.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedRecipe(recipe)}
              className="bg-white rounded-3xl overflow-hidden shadow-sm shadow-stone-200/50 flex flex-col h-full cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="h-32 relative flex-shrink-0">
                <img src={recipe.image} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg text-white text-[10px] font-black tracking-widest">
                  {recipe.cookTime}
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-bold text-stone-800 text-sm leading-tight line-clamp-2 mb-1">{recipe.name}</h4>
                <p className="text-[10px] text-stone-400 mb-2 font-medium flex items-center gap-1"><MapPin size={10} /> {recipe.region}</p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-stone-50">
                  <DifficultyBadge difficulty={recipe.difficulty} t={t} />
                </div>
              </div>
            </motion.div>
          ))}
          {displayRecipes.length === 0 && (
            <div className="col-span-2 py-20 text-center text-stone-400 font-medium">{t.noResults}</div>
          )}
        </motion.div>
      ) : (
        <div className="pt-2 space-y-12 pb-10">




          {/* Dynamic Sections from Admin CMS (Explorer) */}
          {dynamicSections.filter((section: any) => section.config?.page === 'explorer').map((section, sidx) => {
            let sectionRecipes: Recipe[] = [];

            if (section.type === 'category') {
              sectionRecipes = allRecipes.filter(r => r.category === section.config?.category);
            } else if (section.type === 'region') {
              sectionRecipes = allRecipes.filter(r => r.region?.toLowerCase().includes(section.config?.region?.toLowerCase() || ''));
            } else if (section.type === 'quick') {
              const maxTime = parseInt(section.config?.max_prep_time) || 30;
              sectionRecipes = allRecipes.filter(r => (parseInt(r.prep_time) || 60) <= maxTime);
            } else if (section.type === 'all') {
              sectionRecipes = [...allRecipes];
            } else {
              sectionRecipes = allRecipes.filter(r => section.recipe_ids?.includes(r.id));
            }

            // Apply limit only if explicitly configured — default to 200 to show all selected recipes
            sectionRecipes = sectionRecipes.slice(0, section.config?.limit || 200);

            if (sectionRecipes.length === 0) return null;

            if (section.type === 'dynamic_carousel') {
              return (
                <section key={section.id} className="mb-8">
                  <div className="px-6 flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-black text-stone-900 tracking-tight">{section.title}</h2>
                      {section.subtitle && <p className="text-[10px] text-[#fb5607] font-bold uppercase tracking-widest mt-0.5">{section.subtitle}</p>}
                    </div>
                  </div>
                  <div className="flex gap-3 overflow-x-auto px-6 no-scrollbar pb-8 pt-4">
                    {sectionRecipes.map((recipe, ridx) => {
                      const ratingNum = (4.0 + (ridx % 5) * 0.2).toFixed(1);
                      return (
                        <motion.div
                          key={recipe.id}
                          whileTap={{ scale: 0.96 }}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: ridx * 0.08 }}
                          onClick={() => setSelectedRecipe(recipe)}
                          className="flex-shrink-0 cursor-pointer group"
                          style={{ width: '190px' }}
                        >
                          {/* Card — no border, just shadow */}
                          <div style={{
                            background: 'linear-gradient(160deg, #ff6b1a 0%, #fb5607 50%, #e84d00 100%)',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.18), 0 3px 8px rgba(0,0,0,0.10)',
                          }}>
                            {/* Image top — 4:3 for more height */}
                            <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                              <img
                                src={recipe.image}
                                alt={recipe.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                                className="group-hover:scale-105"
                              />
                            </div>

                            {/* Content — fixed height */}
                            <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {/* Title + category */}
                              <div>
                                <h3 style={{
                                  fontSize: '14px', fontWeight: 800, color: '#fff',
                                  lineHeight: 1.25, margin: '0 0 3px',
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>{recipe.name}</h3>
                                <p style={{
                                  fontSize: '11px', color: 'rgba(255,255,255,0.70)', fontWeight: 500, margin: 0,
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>{recipe.category || recipe.region}</p>
                              </div>

                              {/* Rating pill button */}
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                background: 'rgba(255,255,255,0.20)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '20px',
                                padding: '5px 10px',
                                alignSelf: 'flex-start',
                              }}>
                                <Star size={12} style={{ color: '#fde68a', fill: '#fde68a', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{ratingNum}</span>
                              </div>

                              {/* CTA row */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.90)', letterSpacing: '0.03em' }}>
                                  Voir la recette
                                </span>
                                <div style={{
                                  width: '28px', height: '28px',
                                  background: '#fff',
                                  borderRadius: '50%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                                  transition: 'transform 0.2s',
                                }} className="group-hover:scale-110">
                                  <ChevronRight size={14} style={{ color: '#fb5607' }} strokeWidth={3} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              );
            }

            if (section.type === 'horizontal_list') {
              return (
                <section key={section.id} className="mb-10">
                  <div className="px-6 flex justify-between items-end mb-4">
                    <div className="flex flex-col">
                      <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                      {section.subtitle && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{section.subtitle}</p>}
                    </div>

                  </div>
                  <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar pb-3">
                    {sectionRecipes.map((recipe, ridx) => {
                      const isFav = currentUser?.favorites?.includes(recipe.id) ?? false;
                      const ratingNum = (4.0 + (ridx % 5) * 0.2).toFixed(1);
                      return (
                        <motion.div
                          key={recipe.id}
                          whileTap={{ scale: 0.97 }}
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: ridx * 0.07 }}
                          onClick={() => setSelectedRecipe(recipe)}
                          className="flex-shrink-0 cursor-pointer"
                          style={{ width: 'min(48vw, 185px)' }}
                        >
                          <div style={{
                            background: '#fff', borderRadius: '20px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                            overflow: 'hidden', border: '1px solid rgba(0,0,0,0.04)',
                          }}>
                            <div className="relative" style={{ aspectRatio: '4 / 3' }}>
                              <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />

                              <button onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }} style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', borderRadius: '50%', background: isFav ? '#ef4444' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', transition: 'all 0.2s' }}>
                                <Heart size={14} style={{ color: isFav ? '#fff' : '#ef4444', fill: isFav ? '#fff' : 'none' }} strokeWidth={isFav ? 0 : 2.5} />
                              </button>
                              <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', borderRadius: '8px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '3px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
                                <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#374151', lineHeight: 1 }}>{ratingNum}</span>
                              </div>
                            </div>
                            <div style={{ padding: '12px 14px 14px' }}>
                              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1a1a1a', lineHeight: 1.25, margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{recipe.name}</h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                                <div style={{ background: '#f3f4f6', borderRadius: '20px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={10} style={{ color: '#6b7280' }} />
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{recipe.prepTime ? `${recipe.prepTime} min` : '30 min'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              );
            }

            if (section.type === 'vertical_list_2') {
              return (
                <section key={section.id} className="mb-10">
                  <div className="px-6 flex justify-between items-end mb-4">
                    <div className="flex flex-col">
                      <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                      {section.subtitle && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{section.subtitle}</p>}
                    </div>

                  </div>
                  <div className="px-6 grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    {sectionRecipes.map((recipe, ridx) => {
                      const isFav = currentUser?.favorites?.includes(recipe.id) ?? false;
                      const ratingNum = (4.0 + (ridx % 5) * 0.2).toFixed(1);
                      return (
                        <motion.div
                          key={recipe.id}
                          whileTap={{ scale: 0.97 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: ridx * 0.06 }}
                          onClick={() => setSelectedRecipe(recipe)}
                          className="cursor-pointer"
                        >
                          <div className="hlist-card" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="relative" style={{ aspectRatio: '4 / 3' }}>
                              <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
                              <button onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }} style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: isFav ? '#ef4444' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', transition: 'all 0.2s' }}>
                                <Heart size={13} style={{ color: isFav ? '#fff' : '#ef4444', fill: isFav ? '#fff' : 'none' }} strokeWidth={isFav ? 0 : 2.5} />
                              </button>
                              <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', borderRadius: '8px', padding: '2px 7px', display: 'flex', alignItems: 'center', gap: '3px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
                                <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                                <span style={{ fontSize: '10px', fontWeight: 800, color: '#374151', lineHeight: 1 }}>{ratingNum}</span>
                              </div>
                            </div>
                            <div style={{ padding: '10px 12px 12px' }}>
                              <h3 className="hlist-card-title" style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.25, margin: '0 0 5px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{recipe.name}</h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                                <div className="hlist-card-badge" style={{ borderRadius: '20px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={10} className="hlist-card-clock" />
                                  <span className="hlist-card-time" style={{ fontSize: '11px', fontWeight: 700 }}>{recipe.prepTime ? `${recipe.prepTime} min` : '30 min'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              );
            }

            // ── VERTICAL LIST (fallback Explorer) ──
            return (
              <section key={section.id} className="mb-10">
                <div className="px-6 flex justify-between items-end mb-4">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                    {section.subtitle && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{section.subtitle}</p>}
                  </div>

                </div>
                <div className="px-6 flex flex-col gap-3">
                  {sectionRecipes.map((recipe, ridx) => {
                    const isFav = currentUser?.favorites?.includes(recipe.id) ?? false;
                    const ratingNum = (4.0 + (ridx % 5) * 0.1).toFixed(1);
                    return (
                      <motion.div
                        key={recipe.id}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: ridx * 0.06 }}
                        onClick={() => setSelectedRecipe(recipe)}
                        className="hlist-card"
                        style={{
                          borderRadius: '18px',
                          display: 'flex', alignItems: 'center', gap: '14px',
                          padding: '12px', cursor: 'pointer', overflow: 'hidden',
                        }}
                      >
                        <div style={{ width: '76px', height: '76px', flexShrink: 0, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
                          <img src={recipe.image} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="hlist-card-title" style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 5px', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {recipe.name}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                            <Clock size={11} style={{ color: '#9ca3af', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af' }}>{recipe.prepTime ? `${recipe.prepTime} min` : '30 min'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Star size={11} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{ratingNum}</span>
                            <span style={{ fontSize: '10px', color: '#d1d5db' }}>·</span>
                            <span style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recipe.region || recipe.category || 'Africain'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                          <DifficultyBadge difficulty={recipe.difficulty} t={t} />
                          <ChevronRight size={16} style={{ color: '#d1d5db' }} />
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
  );

  const renderFavorites = () => {
    const favoriteRecipes = dbService.getFavorites(currentUser!, allRecipes);

    return (
      <div className="flex-1 flex flex-col pb-44 pt-4">
        <header className="p-6 pt-4">
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">{t.favorites}</h1>
        </header>
        <div className="px-6 space-y-4">
          {favoriteRecipes.length > 0 ? (
            favoriteRecipes.map(recipe => (
              <div key={recipe.id} onClick={() => setSelectedRecipe(recipe)} className="bg-white p-3 rounded-3xl border border-stone-100 flex items-center gap-4">
                <img src={recipe.image} className="w-16 h-16 rounded-2xl object-cover" />
                <div className="flex-1">
                  <h4 className="font-bold text-stone-800 text-sm">{recipe.name}</h4>
                  <p className="text-[10px] text-stone-400">{recipe.region}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); toggleFavorite(recipe.id); }} className="text-rose-500 p-2"><Heart size={20} fill="currentColor" /></button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-stone-300 mb-6">
                <Heart size={40} />
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">{t.noFavorites}</h3>
              <p className="text-stone-400 text-sm max-w-[200px] leading-relaxed italic">"{t.noFavoritesDesc}"</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="flex-1 flex flex-col pb-44 pt-4 relative bg-stone-50">
      <AnimatePresence>
        {profileSubView && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={springTransition} className={`absolute inset-0 z-50 p-6 pt-6 flex flex-col ${isDark ? 'bg-[#111113]' : 'bg-white'}`}>
            <header className="flex items-center gap-4 mb-8 shrink-0">
              <button onClick={() => setProfileSubView(null)} className="p-2 btn-back-circle bg-stone-50 rounded-full"><ChevronLeft size={20} /></button>
              <h2 className="text-xl font-black text-stone-800 tracking-tight">
                {profileSubView === 'personalInfo' ? t.personalInfo :
                  profileSubView === 'security' ? t.security :
                    profileSubView === 'notifications' ? t.notifications :
                      profileSubView === 'shopping' ? "Ma liste de courses" :
                        profileSubView === 'about' ? t.about :
                          t.settings}
              </h2>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
              {profileSubView === 'shopping' ? (
                <div className="space-y-6">
                  {currentUser?.shoppingList && currentUser.shoppingList.length > 0 ? (
                    <div className="space-y-3">
                      {currentUser.shoppingList.map((shopItem) => (
                        <motion.div
                          key={shopItem.id}
                          layout
                          className={`p-4 rounded-[28px] border transition-all flex items-center gap-4 ${shopItem.isPurchased ? 'bg-emerald-50 border-emerald-100 opacity-70' : 'bg-white border-stone-100 shadow-sm'}`}
                        >
                          <button
                            onClick={() => {
                              const newList = currentUser.shoppingList.map(i =>
                                i.id === shopItem.id ? { ...i, isPurchased: !i.isPurchased } : i
                              );
                              updateShoppingList(newList);
                            }}
                            className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all ${shopItem.isPurchased ? 'bg-emerald-500 scale-110 rotate-[360deg]' : 'bg-stone-50 border-2 border-stone-200'}`}
                          >
                            {shopItem.isPurchased && <Check size={14} className="text-white" />}
                          </button>
                          <div className="flex-1">
                            <p className={`text-[13px] font-bold leading-none mb-1 transition-all ${shopItem.isPurchased ? 'text-emerald-900 line-through' : 'text-stone-800'}`}>{shopItem.item}</p>
                            <p className={`text-[11px] font-medium ${shopItem.isPurchased ? 'text-emerald-600' : 'text-[#fb5607]'}`}>{shopItem.amount}</p>
                            {shopItem.recipeName && (
                              <p className="text-[9px] font-bold text-stone-400 mt-1 uppercase tracking-widest">{shopItem.recipeName}</p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const newList = currentUser.shoppingList.filter(i => i.id !== shopItem.id);
                              updateShoppingList(newList);
                            }}
                            className="p-2 text-stone-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </motion.div>
                      ))}

                      <button
                        onClick={() => {
                          showAlert("Voulez-vous vraiment vider toute votre liste de courses ?", "info", () => updateShoppingList([]));
                        }}
                        className="w-full py-4 text-rose-500 font-bold text-xs uppercase tracking-widest mt-4"
                      >
                        Vider la liste
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-6 relative">
                        <span className="text-4xl">🛒</span>
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                          <Plus size={16} className="text-stone-300" />
                        </div>
                      </div>
                      <h3 className="text-lg font-black text-stone-800 mb-2 tracking-tight">Liste vide</h3>
                      <p className="text-stone-400 text-xs max-w-[220px] leading-relaxed font-medium">
                        Ajoutez des ingrédients depuis les fiches de recettes pour préparer vos prochaines courses !
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <ProfileSubViewRenderer
                  profileSubView={profileSubView}
                  setProfileSubView={setProfileSubView}
                  currentUser={currentUser}
                  setCurrentUser={setCurrentUser}
                  t={t}
                  securitySubView={securitySubView}
                  setSecuritySubView={setSecuritySubView}
                  goBack={goBack}
                  updateSettings={updateSettings}
                  handleLogout={handleLogout}
                  settings={settings}
                  handleSaveSettings={handleSaveSettings}
                  isSyncing={isSyncing}
                  hasLoadedAtLeastOnce={hasLoadedAtLeastOnce}
                  showAlert={showAlert}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col items-center py-10">
        <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden mb-4 bg-stone-100">
          <img
            src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`}
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-2xl font-bold text-stone-800">{currentUser?.name}</h2>
        <p className="text-stone-500 text-sm">{currentUser?.email}</p>

        {/* Cloud Connection Status */}
        <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-stone-100 shadow-sm">
          <div className={`w-2 h-2 rounded-full animate-pulse ${dbService.supabase ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
            Cloud Sync: {dbService.supabase ? 'Activé' : 'Désactivé'}
          </span>
        </div>
      </header>

      <section className="px-6 space-y-3">
        <button onClick={() => setProfileSubView('personalInfo')} className="w-full flex items-center justify-between p-5 bg-white rounded-[32px] border border-stone-100 shadow-sm active:scale-95 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-600">
              <UserIcon size={20} />
            </div>
            <span className="font-black text-stone-800 text-sm tracking-tight">{t.personalInfo}</span>
          </div>
          <ChevronRight size={18} className="text-stone-300" />
        </button>

        {/* New Shopping List Menu */}

        <button onClick={() => setProfileSubView('settings')} className="w-full flex items-center justify-between p-5 bg-white rounded-[32px] border border-stone-100 shadow-sm active:scale-95 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-600">
              <Settings size={20} />
            </div>
            <span className="font-black text-stone-800 text-sm tracking-tight">{t.settings}</span>
          </div>
          <ChevronRight size={18} className="text-stone-300" />
        </button>

        <button onClick={() => setProfileSubView('about')} className="w-full flex items-center justify-between p-5 bg-white rounded-[32px] border border-stone-100 shadow-sm active:scale-95 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-600">
              <Info size={20} />
            </div>
            <span className="font-black text-stone-800 text-sm tracking-tight">{t.about}</span>
          </div>
          <ChevronRight size={18} className="text-stone-300" />
        </button>

        <button
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-between p-4 bg-white/50 rounded-3xl border border-dashed border-stone-200 shadow-sm active:bg-stone-50 transition-colors mt-4"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center ${isSyncing ? 'text-terracotta' : 'text-stone-400'}`}>
              <motion.div animate={isSyncing ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Wifi size={20} />
              </motion.div>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-stone-700 text-sm">Actualiser les recettes</span>
              <span className="text-[10px] text-stone-400 font-medium tracking-tight">Vérifier les nouveaux plats sur le serveur</span>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${isSyncing ? 'bg-terracotta/10 text-terracotta' : 'bg-stone-100 text-stone-400'}`}>
            {isSyncing ? 'Sync...' : 'Prêt'}
          </div>
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 bg-rose-50 rounded-3xl text-rose-600 font-bold mt-6"><LogOut size={20} /> {t.logout}</button>
      </section>
    </div>
  );

  const ReviewSection = ({ recipe, currentUser, t }: { recipe: Recipe; currentUser: User | null; t: any }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
      if (!currentUser || rating === 0) return;
      setIsSubmitting(true);
      try {
        const result = await dbService.submitReview({
          recipe_id: recipe.id,
          recipe_name: recipe.name,
          user_id: currentUser.id,
          user_name: currentUser.name,
          rating,
          comment
        });

        if (!result) throw new Error('Failed to submit review');

        setIsSubmitting(false);
        setSubmitted(true);
        setRating(0);
        setComment('');
        setTimeout(() => setSubmitted(false), 3000);
      } catch (err: any) {
        setIsSubmitting(false);
        console.warn('Review fallback:', err?.message);
        // Graceful degradation — store locally
        const pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        pending.push({ recipe_id: recipe.id, recipe_name: recipe.name, user_id: currentUser.id, user_name: currentUser.name, rating, comment, created_at: new Date().toISOString() });
        localStorage.setItem('pending_reviews', JSON.stringify(pending));
        setSubmitted(true);
        setRating(0);
        setComment('');
        setTimeout(() => setSubmitted(false), 3000);
      }
    };

    return (
      <div className="mb-12">
        <h3 className="text-lg font-black text-stone-900 mb-4 tracking-tight">{t.reviewsTitle}</h3>
        <div className="bg-stone-50 border border-stone-100 rounded-[32px] p-6 shadow-inner">
          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} />
              </div>
              <p className="font-bold text-emerald-800">{t.reviewSuccess}</p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.1em] mb-3">{t.ratingLabel}</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform active:scale-90"
                    >
                      <Star
                        size={32}
                        className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}
                        strokeWidth={star <= rating ? 0 : 2}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.1em] mb-3">Votre commentaire</p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t.commentPlaceholder}
                  className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-terracotta/20 min-h-[100px] no-scrollbar resize-none shadow-sm"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all ${rating === 0 || isSubmitting ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-stone-900 text-white shadow-lg active:scale-95'
                  }`}
              >
                {isSubmitting ? 'Envoi...' : t.submitReview}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Store RecipeDetail in a ref so its identity is stable across App re-renders
  // (prevents React from unmounting/remounting when parent state like currentUser changes)
  const RecipeDetailRef = useRef<React.FC<any>>(null);
  if (!RecipeDetailRef.current) {
    RecipeDetailRef.current = ({ recipe, allRecipes, currentUser, toggleFavorite, goBack, detailScrollRef, t, updateShoppingList, showAlert: showAlertProp, setSelectedRecipe: setRecipeProp }: {
      recipe: Recipe;
      allRecipes: Recipe[];
      currentUser: User | null;
      toggleFavorite: (id: string) => void;
      goBack: () => void;
      detailScrollRef: React.RefObject<HTMLDivElement>;
      t: any;
      updateShoppingList: (newList: ShoppingItem[]) => void;
      showAlert: (msg: string, type?: any) => void;
      setSelectedRecipe: (r: Recipe) => void;
    }) => {
      const [selectedIngs, setSelectedIngs] = useState<number[]>([]);
      const charCodeSum = recipe.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const fakeCalories = 250 + (charCodeSum % 300);
      const fakeProtein = 10 + (charCodeSum % 30);
      const fakeCarbs = 20 + (charCodeSum % 50);
      const fakeFat = 5 + (charCodeSum % 25);

      let related = allRecipes.filter(r => r.category === recipe.category && r.id !== recipe.id).slice(0, 3);
      if (related.length === 0) {
        related = allRecipes.filter(r => r.id !== recipe.id).slice(0, 3);
      }
      const youtubeQuery = encodeURIComponent(`préparation recette ${recipe.name}`);

      const [showStepHint, setShowStepHint] = useState(true);

      useEffect(() => {
        const timer = setTimeout(() => setShowStepHint(false), 6000);
        return () => clearTimeout(timer);
      }, [recipe.id]);

      return (
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={springTransition}
          className="absolute inset-0 z-[100] bg-white overflow-hidden w-full flex flex-col"
        >
          <div className="absolute top-0 inset-x-0 z-[110] pointer-events-none p-6 pt-12">
            <div className="relative w-full flex justify-between items-start pointer-events-none">
              <button onClick={goBack} className="w-10 h-10 bg-[#fb5607]/80 backdrop-blur-md rounded-full text-white flex items-center justify-center border border-white/30 shadow-lg shadow-[#fb5607]/20 pointer-events-auto"><ChevronLeft size={24} /></button>
              <button onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }} className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-md transition-all pointer-events-auto ${currentUser?.favorites.includes(recipe.id) ? 'bg-white border-white text-rose-500' : 'bg-white border-stone-100 text-stone-400'}`}><Heart size={20} fill={currentUser?.favorites.includes(recipe.id) ? 'currentColor' : 'none'} /></button>
            </div>
          </div>

          <div ref={detailScrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-36 relative min-h-0 bg-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={springTransition}
                className="absolute inset-x-0 top-0"
              >
                <div className="relative h-[40vh] w-full shrink-0">
                  <img
                    src={recipe.image}
                    className="w-full h-full object-cover"
                    alt={recipe.name}
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.style.display = 'none';
                      const parent = img.parentElement;
                      if (parent && !parent.querySelector('.img-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'img-fallback';
                        fallback.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:linear-gradient(135deg,#f97316 0%,#ea580c 40%,#c2410c 100%);';
                        fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span style="color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;text-align:center;padding:0 16px">Image non disponible hors connexion</span>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                <div className="p-6 -mt-8 bg-white rounded-t-[32px] relative z-10 min-h-screen shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                  <div className="flex justify-between items-start gap-4 mb-2 relative">
                    <h1 className="text-2xl font-black text-stone-900 leading-tight flex-1">{recipe.name}</h1>
                    <button
                      onClick={() => setShowStepHint(!showStepHint)}
                      className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-[210] ${showStepHint ? 'bg-terracotta text-white rotate-[360deg] shadow-lg shadow-terracotta/30' : 'bg-stone-50 text-stone-400 border border-stone-100 hover:bg-stone-100 hover:text-terracotta'}`}
                    >
                      <Info size={20} />
                    </button>

                    {/* Integrated Hint Popup */}
                    <AnimatePresence>
                      {showStepHint && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5, x: 20, y: -10 }}
                          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                          exit={{ opacity: 0, scale: 0.5, x: 20, y: -10 }}
                          className="absolute right-12 top-0 z-[200] w-[80%] max-w-[240px]"
                        >
                          <div className="bg-terracotta shadow-xl shadow-terracotta/20 text-white p-3 rounded-2xl border border-white/20 flex items-center gap-3 relative">
                            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                              <CheckCircle2 size={16} className="text-white" />
                            </div>
                            <p className="text-[10px] font-bold leading-tight flex-1 text-left">Touchez les étapes pour suivre votre progression !</p>
                            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-terracotta rotate-45 border-t border-r border-white/20"></div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="text-[#fb5607] font-black text-xs mb-6 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={14} />{recipe.region}</p>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-stone-50/80 p-4 rounded-[24px] flex flex-col items-center border border-stone-100/50">
                      <Clock size={18} className="text-[#fb5607] mb-2" />
                      <span className="text-[10px] uppercase font-black text-stone-400">{t.prepTime}</span>
                      <span className="text-sm font-black text-stone-800 tracking-tight">{recipe.prepTime}</span>
                    </div>
                    <div className="bg-stone-50/80 p-4 rounded-[24px] flex flex-col items-center border border-stone-100/50">
                      <Flame size={18} className="text-[#fb5607] mb-2" />
                      <span className="text-[10px] uppercase font-black text-stone-400">{t.cookTime}</span>
                      <span className="text-sm font-black text-stone-800 tracking-tight">{recipe.cookTime}</span>
                    </div>
                    <div className="bg-stone-50/80 p-4 rounded-[24px] flex flex-col items-center border border-stone-100/50">
                      <UtensilsCrossed size={18} className="text-[#fb5607] mb-2" />
                      <span className="text-[10px] uppercase font-black text-stone-400">{t.level}</span>
                      <span className="text-sm font-black text-stone-800 tracking-tight">{recipe.difficulty}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-black text-stone-900 tracking-tight">{t.ingredients}</h3>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">Cochez pour préparer</p>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    {recipe.ingredients?.map((ing, i) => {
                      const isSelected = selectedIngs.includes(i);
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => {
                            if (isSelected) setSelectedIngs(selectedIngs.filter(idx => idx !== i));
                            else setSelectedIngs([...selectedIngs, i]);
                          }}
                          className={`flex items-center gap-4 p-4 rounded-[24px] border transition-all duration-300 cursor-pointer ${isSelected ? 'bg-amber-50 border-amber-200' : 'bg-stone-50 border-stone-100 hover:border-stone-200 active:scale-[0.98]'}`}
                        >
                          <div className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-amber-500 scale-110 rotate-[360deg] shadow-lg shadow-amber-500/30' : 'bg-white border-2 border-stone-200'}`}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className={`text-[13px] font-bold leading-none mb-1 transition-colors ${isSelected ? 'text-amber-900' : 'text-stone-700'}`}>{ing.item}</p>
                            <p className={`text-[11px] font-medium transition-colors ${isSelected ? 'text-amber-600' : 'text-[#fb5607]'}`}>{ing.amount}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      const selectedList = (recipe.ingredients || [])
                        .filter((_, i) => selectedIngs.includes(i))
                        .map(ing => ({
                          id: Math.random().toString(36).substr(2, 9),
                          item: ing.item,
                          amount: ing.amount,
                          isPurchased: false,
                          recipeName: recipe.name,
                          recipeId: recipe.id
                        }));

                      const currentList = currentUser?.shoppingList || [];
                      updateShoppingList([...currentList, ...selectedList]);
                      showAlertProp(`${selectedList.length} ingrédients ajoutés à votre liste de courses !`);
                      setSelectedIngs([]);
                    }}
                    disabled={selectedIngs.length === 0}
                    className={`w-full py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${selectedIngs.length > 0 ? 'bg-stone-900 text-white shadow-stone-900/20 active:scale-95' : 'bg-stone-100 text-stone-400 opacity-60 grayscale cursor-not-allowed'}`}
                  >
                    <Plus size={20} />
                    Ajouter à ma liste de courses ({selectedIngs.length})
                  </button>

                  <div className="h-px bg-stone-100 my-8" />

                  <h3 className="text-lg font-black text-stone-900 mb-4 tracking-tight">{t.preparation}</h3>
                  <div className="space-y-4 mb-8">
                    {recipe.steps?.map((step: string, i: number) => {
                      const Comp = PreparationStep as any;
                      return <Comp key={`${recipe.id}-step-${i}`} step={step} index={i} recipeId={recipe.id} />;
                    })}
                  </div>

                  <hr className="mb-8 border-stone-100" />

                  <h3 className="text-lg font-black text-stone-900 mb-4 tracking-tight">{t.nutrition}</h3>
                  <div className="bg-stone-50 border border-stone-100 rounded-3xl p-5 mb-10 shadow-inner">
                    <div className="grid grid-cols-4 gap-2 text-center divide-x divide-stone-200/60">
                      <div>
                        <span className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">{t.calories}</span>
                        <span className="text-lg font-black text-[#fb5607]">{250 + (recipe.id.length * 15) % 300}</span>
                        <span className="text-[9px] text-stone-400 font-bold block mt-0.5">kcal</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">{t.proteins}</span>
                        <span className="text-lg font-black text-stone-900">{10 + (recipe.id.length * 2) % 30}</span>
                        <span className="text-[9px] text-stone-400 font-bold block mt-0.5">g</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">{t.carbs}</span>
                        <span className="text-lg font-black text-stone-900">{20 + (recipe.id.length * 5) % 50}</span>
                        <span className="text-[9px] text-stone-400 font-bold block mt-0.5">g</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">{t.lipids}</span>
                        <span className="text-lg font-black text-stone-900">{5 + (recipe.id.length * 3) % 25}</span>
                        <span className="text-[9px] text-stone-400 font-bold block mt-0.5">g</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-stone-900 mb-4 tracking-tight">{t.videoGuide}</h3>
                  <div className="mb-10 rounded-[32px] overflow-hidden bg-stone-900 h-56 relative shadow-xl group border border-stone-200">
                    <iframe
                      className="w-full h-full absolute inset-0 z-10"
                      src={recipe.videoUrl
                        ? (recipe.videoUrl.includes('youtu.be/')
                          ? `https://www.youtube.com/embed/${recipe.videoUrl.split('youtu.be/')[1].split('?')[0]}`
                          : `https://www.youtube.com/embed/${recipe.videoUrl.split('v=')[1]?.split('&')[0]}`)
                        : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent('recette ' + recipe.name)}&controls=1`}
                      title="Tutoriel de préparation"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>

                  <div className="h-px bg-stone-100 my-8" />

                  <ReviewSection
                    recipe={recipe}
                    currentUser={currentUser}
                    t={t}
                  />

                  {related.length > 0 && (
                    <>
                      <h3 className="text-lg font-black text-stone-900 mb-4 tracking-tight">{t.similarDishes}</h3>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-10 pr-6 -mr-6">
                        {related.map(r => (
                          <motion.div
                            whileTap={{ scale: 0.95 }}
                            key={r.id}
                            onClick={() => {
                              // Scroll back to top for the new recipe
                              if (detailScrollRef.current) detailScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                              setRecipeProp(r);
                            }}
                            className="flex-shrink-0 w-36 cursor-pointer group"
                          >
                            <div className="h-32 rounded-[24px] overflow-hidden mb-3 relative shadow-md border border-stone-100 transition-transform group-hover:scale-95 duration-500">
                              <img src={r.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={r.name} />
                            </div>
                            <h4 className="font-bold text-sm text-stone-900 leading-tight truncate mb-1">{r.name}</h4>
                            <span className="text-[10px] font-black text-stone-400 flex items-center gap-1 uppercase tracking-tighter">
                              <Clock size={10} className="text-[#fb5607]" /> {r.cookTime} • <DifficultyBadge difficulty={r.difficulty} t={t} />
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      );
    };
  }
  const RecipeDetail = RecipeDetailRef.current!;

  const renderShoppingList = () => {
    const list = currentUser?.shoppingList || [];
    const purchased = list.filter(i => i.isPurchased);
    const toBuy = list.filter(i => !i.isPurchased);
    const UNITS = ['g', 'kg', 'L', 'mL', 'cl', 'pcs', 'tbsp', 'tsp', 'pinch'];

    const ShoppingItemRow = ({ item, dimmed }: { item: any; dimmed?: boolean }) => {
      const [editQty, setEditQty] = React.useState(item.quantity ?? '');
      const [editUnit, setEditUnit] = React.useState(item.unit ?? 'g');
      const [editPrice, setEditPrice] = React.useState(item.priceXOF ?? '');
      const [isEditing, setIsEditing] = React.useState(false);

      const save = () => {
        const newList = list.map(i => i.id === item.id
          ? { ...i, quantity: editQty, unit: editUnit, priceXOF: editPrice }
          : i);
        updateShoppingList(newList);
        setIsEditing(false);
      };

      return (
        <motion.div layout key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`bg-white rounded-[24px] border shadow-sm overflow-hidden ${dimmed ? 'opacity-60 border-emerald-100' : 'border-stone-100'}`}
        >
          <div className="p-4 flex items-center gap-3">
            {/* Checkbox */}
            <button
              onClick={() => {
                const newList = list.map(i => i.id === item.id ? { ...i, isPurchased: !i.isPurchased } : i);
                updateShoppingList(newList);
              }}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.isPurchased ? 'bg-emerald-500 border-emerald-500 shadow-sm' : 'border-stone-200 hover:border-[#fb5607]'
                }`}
            >
              {item.isPurchased && <Check size={13} className="text-white" />}
            </button>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-bold leading-tight ${item.isPurchased ? 'line-through text-stone-400' : 'text-stone-800'}`}>{item.item}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {item.quantity && <span className="text-[11px] font-black text-[#fb5607]">{item.quantity} {item.unit}</span>}
                {item.priceXOF && <span className="text-[10px] font-bold text-stone-400">{parseInt(item.priceXOF).toLocaleString()} XOF</span>}
                {!item.quantity && !item.priceXOF && <span className="text-[11px] text-stone-300 italic">Appuyez ✎ pour ajouter qté &amp; prix</span>}
                {item.recipeName && <><span className="w-1 h-1 rounded-full bg-stone-200 inline-block" /><span className="text-[10px] text-stone-400 truncate max-w-[90px]">↳ {item.recipeName}</span></>}
              </div>
            </div>
            {/* Edit btn */}
            <button onClick={() => setIsEditing(!isEditing)}
              className="w-8 h-8 rounded-full bg-stone-50 text-stone-400 flex items-center justify-center hover:bg-[#fb5607]/10 hover:text-[#fb5607] transition-all"
            >
              <Edit2 size={13} />
            </button>
            {/* Delete btn */}
            <button onClick={() => { const nl = list.filter(i => i.id !== item.id); updateShoppingList(nl); }}
              className="w-8 h-8 rounded-full bg-stone-50 text-stone-300 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Inline edit panel */}
          <AnimatePresence>
            {isEditing && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-stone-100 bg-stone-50"
              >
                <div className="p-4 space-y-3">
                  {/* Qty + Unit row */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 block">Quantité</label>
                      <input
                        type="number"
                        value={editQty}
                        onChange={e => setEditQty(e.target.value)}
                        placeholder="Ex: 500"
                        className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#fb5607]/20"
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 block">Unité</label>
                      <select
                        value={editUnit}
                        onChange={e => setEditUnit(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#fb5607]/20"
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Price */}
                  <div>
                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 block">Prix estimé (XOF)</label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      placeholder="Ex: 1500"
                      className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#fb5607]/20"
                    />
                  </div>
                  <button onClick={save}
                    className="w-full py-3 bg-[#fb5607] text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                  >
                    Enregistrer
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    };

    // Compute total estimated cost
    const totalXOF = list.reduce((acc, i) => acc + (parseFloat(i.priceXOF ?? '0') || 0), 0);

    return (
      <div className="flex-1 flex flex-col pb-44 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="px-6 pt-10 pb-6 bg-white/95 backdrop-blur-2xl sticky top-0 z-[100] border-b border-stone-100 flex flex-col gap-1 transition-all duration-500">
          <h2 className="text-[24px] font-black text-stone-900 tracking-tight leading-none">{t.myShoppingList}</h2>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">{list.length} {t.ingredients}</p>
            {totalXOF > 0 && <p className="text-[11px] font-black text-[#fb5607]">≈ {totalXOF.toLocaleString()} XOF</p>}
          </div>
        </header>

        <div className="p-6 space-y-8">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-10">
              <div className="w-20 h-20 bg-stone-100 rounded-[32px] flex items-center justify-center text-stone-300 mb-6 border-4 border-white shadow-sm">
                <ShoppingBag size={32} />
              </div>
              <h3 className="text-lg font-black text-stone-800 mb-2">{t.noShoppingItems}</h3>
              <p className="text-sm font-medium text-stone-400 leading-relaxed mb-8">{t.noShoppingItemsDesc}</p>
              <button onClick={() => navigateTo('home')}
                className="bg-stone-900 text-white px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-stone-900/20 active:scale-95 transition-all"
              >
                {t.discover}
              </button>
            </div>
          ) : (
            <>
              {toBuy.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-[#fb5607] tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fb5607]"></span> {t.toBuy}
                  </h3>
                  <div className="space-y-3">
                    {toBuy.map(item => <ShoppingItemRow key={item.id} item={item} />)}
                  </div>
                </div>
              )}

              {purchased.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t.purchased}
                  </h3>
                  <div className="space-y-3">
                    {purchased.map(item => <ShoppingItemRow key={item.id} item={item} dimmed />)}
                  </div>
                </div>
              )}

              <button
                onClick={() => { if (window.confirm(t.clearList + "?")) { updateShoppingList([]); } }}
                className="w-full py-4 rounded-full border-2 border-stone-100 text-stone-400 font-black text-[10px] uppercase tracking-widest hover:bg-stone-50 hover:text-stone-600 transition-all active:scale-95 mt-4"
              >
                {t.clearList}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderAuth = () => (
    <div className={`flex-1 flex flex-col justify-center min-h-screen relative overflow-hidden ${isDark ? 'bg-[#0f0f11]' : 'bg-[#faf9f6]'}`}>
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-3xl opacity-70 animate-blob ${isDark ? 'bg-[#fb5607]/5' : 'bg-[#fb5607]/10 mix-blend-multiply'}`}></div>
        <div className={`absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-3xl opacity-70 animate-blob animation-delay-2000 ${isDark ? 'bg-amber-400/5' : 'bg-amber-400/10 mix-blend-multiply'}`}></div>
        <div className={`absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full blur-3xl opacity-70 animate-blob animation-delay-4000 ${isDark ? 'bg-emerald-500/5' : 'bg-emerald-500/10 mix-blend-multiply'}`}></div>
      </div>

      <div className="relative z-10 px-8 py-10 w-full max-w-md mx-auto flex flex-col h-full justify-center">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <div className={`w-32 h-32 p-5 rounded-[40px] mx-auto mb-6 backdrop-blur-xl border relative ${isDark ? 'bg-white/5 border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3)]' : 'bg-white/60 border-white shadow-[0_20px_40px_rgba(0,0,0,0.04)]'}`}>
            <div className={`absolute inset-0 rounded-[40px] border pointer-events-none ${isDark ? 'border-white/5' : 'border-stone-200/40'}`}></div>
            <img src="/images/chef_icon_v2.png" className={`w-full h-full object-contain ${isDark ? 'logo-dark-mode' : ''}`} alt="AfroCuisto Logo" />
          </div>
          <h1 className={`text-[32px] font-black tracking-tight leading-none mb-3 ${isDark ? 'text-white' : 'text-stone-900'}`}>Afro<span className="text-[#fb5607]">Cuisto</span></h1>
          <p className={`text-[13px] font-medium inline-block px-4 py-1.5 rounded-full shadow-sm backdrop-blur-md border ${isDark ? 'text-white/60 border-white/10 bg-white/5' : 'text-stone-500 border-stone-200/50 bg-white/50'}`}>Le Goût de l'Excellence</p>
        </motion.div>

        {/* Auth Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full backdrop-blur-2xl px-6 py-8 rounded-[40px] border relative ${isDark ? 'bg-white/5 border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)]' : 'bg-white/70 border-white/80 shadow-[0_30px_60px_rgba(0,0,0,0.06)]'}`}
        >
          {/* Mode Tabs */}
          <div className={`p-1.5 rounded-[22px] flex mb-8 relative border ${isDark ? 'bg-white/5 border-white/10' : 'bg-stone-100/80 border-stone-200/30'}`}>
            <motion.div
              layoutId="auth-tab-pill"
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-[18px] z-0 ${isDark ? 'bg-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/10' : 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-white'}`}
              initial={false}
              animate={{ x: authMode === 'login' ? 0 : '100%' }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
            <button onClick={() => { setAuthMode('login'); setAuthError(null); }} className={`flex-1 py-3 text-[14px] font-bold z-10 transition-colors ${authMode === 'login' ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/40' : 'text-stone-400')}`}>Connexion</button>
            <button onClick={() => { setAuthMode('signup'); setAuthError(null); }} className={`flex-1 py-3 text-[14px] font-bold z-10 transition-colors ${authMode === 'signup' ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/40' : 'text-stone-400')}`}>Inscription</button>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="space-y-4 relative">
            <AnimatePresence mode="popLayout">
              {authMode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.9 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.9 }}
                  transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                >
                  <div className="relative group">
                    <UserIcon size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#fb5607] transition-colors ${isDark ? 'text-white/30' : 'text-stone-400'}`} />
                    <input type="text" placeholder="Nom complet" required minLength={2} value={authFormData.name} onChange={e => setAuthFormData({ ...authFormData, name: e.target.value })} className={`w-full border rounded-full py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-[#fb5607]/20 focus:border-[#fb5607]/40 font-bold text-sm transition-all shadow-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/25' : 'bg-white border-stone-200/60 text-stone-800 placeholder:text-stone-400'}`} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <Mail size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#fb5607] transition-colors ${isDark ? 'text-white/30' : 'text-stone-400'}`} />
              <input type="email" placeholder="Adresse email" required value={authFormData.email} onChange={e => setAuthFormData({ ...authFormData, email: e.target.value })} className={`w-full border rounded-full py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-[#fb5607]/20 focus:border-[#fb5607]/40 font-bold text-sm transition-all shadow-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/25' : 'bg-white border-stone-200/60 text-stone-800 placeholder:text-stone-400'}`} />
            </div>

            <div className="relative group">
              <Lock size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#fb5607] transition-colors ${isDark ? 'text-white/30' : 'text-stone-400'}`} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                required
                minLength={6}
                value={authFormData.password}
                onChange={e => setAuthFormData({ ...authFormData, password: e.target.value })}
                className={`w-full border rounded-full py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-[#fb5607]/20 focus:border-[#fb5607]/40 font-bold text-sm transition-all shadow-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/25' : 'bg-white border-stone-200/60 text-stone-800 placeholder:text-stone-400'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 transition-colors ${isDark ? 'text-white/30 hover:text-[#fb5607]' : 'text-stone-400 hover:text-[#fb5607]'}`}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <AnimatePresence>
              {authError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="bg-rose-50 border border-rose-100/50 p-3 rounded-[16px] flex items-center gap-3">
                  <AlertCircle size={16} className="text-rose-500 shrink-0" />
                  <p className="text-[11px] font-bold text-rose-600 leading-tight">{authError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {authMode === 'login' && (
              <div className="flex justify-end pt-1 pb-3">
                <button type="button" className={`text-[11px] font-bold transition-colors px-2 ${isDark ? 'text-white/40 hover:text-[#fb5607]' : 'text-stone-500 hover:text-[#fb5607]'}`}>Mot de passe oublié ?</button>
              </div>
            )}

            <button type="submit" disabled={isAuthLoading} className={`w-full bg-[#fb5607] text-white py-4 mt-2 rounded-full font-black text-sm uppercase tracking-widest flex justify-center items-center shadow-[0_15px_30px_rgba(251,86,7,0.25)] transition-all ${isAuthLoading ? 'opacity-80 cursor-wait' : 'hover:bg-[#eb4b05] active:scale-[0.98]'}`}>
              {isAuthLoading ? <Loader size={20} className="animate-spin" /> : (authMode === 'login' ? 'Se connecter' : "C'est parti !")}
            </button>
          </form>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 8s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2.5s;
        }
        .animation-delay-4000 {
          animation-delay: 5s;
        }
      `}} />
    </div>
  );

  // --- Return JSX ---

  if (!currentUser) return (
    <div className={`h-screen max-w-md mx-auto relative overflow-hidden flex flex-col shadow-2xl pt-[env(safe-area-inset-top,4px)] transition-colors duration-300 ${isDark ? 'dark bg-[#111113]' : 'bg-stone-50'}`}>
      {renderAuth()}
      <ModernAlert />
    </div>
  );

  return (
    <div className={`h-screen max-w-md mx-auto shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-300 pt-[env(safe-area-inset-top,4px)] ${isDark ? 'dark bg-[#111113]' : 'bg-stone-50'}`}>
      <main onScroll={onMainScroll} ref={mainScrollRef as any} className="flex-1 overflow-y-auto no-scrollbar relative min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={springTransition} className="h-full">{renderHome()}</motion.div>}
          {activeTab === 'search' && <motion.div key="search" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={springTransition} className="h-full">{renderExplorer()}</motion.div>}
          {activeTab === 'favs' && <motion.div key="favs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={springTransition} className="h-full">{renderFavorites()}</motion.div>}
          {activeTab === 'cart' && <motion.div key="cart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={springTransition} className="h-full">{renderShoppingList()}</motion.div>}
          {activeTab === 'profile' && <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={springTransition} className="h-full">{renderProfile()}</motion.div>}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedRecipe && (
          <RecipeDetail
            key="recipe-detail"
            recipe={selectedRecipe}
            allRecipes={allRecipes}
            currentUser={currentUser}
            toggleFavorite={toggleFavorite}
            goBack={goBack}
            detailScrollRef={detailScrollRef}
            t={t}
            updateShoppingList={updateShoppingList}
            showAlert={showAlert}
            setSelectedRecipe={setSelectedRecipe}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!selectedRecipe && (
          <motion.nav
            initial={{ y: 100, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', damping: 24, stiffness: 360, mass: 0.85 }}
            className="absolute bottom-6 left-4 right-4 z-[110]"
          >
            {/* Ambient drop shadow */}
            <div
              className="absolute inset-0 rounded-[40px]"
              style={{
                borderRadius: 40,
                boxShadow: '0 16px 48px rgba(249,77,0,0.38), 0 4px 12px rgba(0,0,0,0.18)',
              }}
            />

            {/* Main pill */}
            <div
              className="relative flex items-center justify-between px-2 rounded-[40px] overflow-hidden"
              style={{
                height: 76,
                background: 'linear-gradient(160deg, #ff6120 0%, #F94D00 55%, #d93d00 100%)',
              }}
            >
              {/* Inner highlight at top */}
              <div
                className="absolute top-0 inset-x-6 h-px"
                style={{
                  background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.45), transparent)',
                }}
              />
              {/* Subtle inner top arc light */}
              <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 w-3/4 h-12 rounded-full pointer-events-none"
                style={{ background: 'rgba(255,255,255,0.06)', filter: 'blur(12px)' }}
              />

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <React.Fragment key={item.id}>
                    <NavButton
                      icon={Icon}
                      isActive={isActive}
                      onClick={() => navigateTo(item.id)}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      <ModernAlert />
    </div>
  );
}
