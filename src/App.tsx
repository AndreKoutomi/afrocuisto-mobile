/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Cœur de l'application mobile. Gère l'interface utilisateur (UI), la navigation entre les onglets (Accueil, Explorer, Favoris, Profil), les animations fluides, l'affichage des détails d'une recette, et l'état global de l'application.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import DishSuggestionForm from './components/DishSuggestionForm';
import { FeaturedCarousel } from './components/FeaturedCarousel';
import { motion, AnimatePresence } from 'motion/react';
import { PullToRefresh } from './components/PullToRefresh';
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
  WifiOff,
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
  Loader,
  Phone,
  RefreshCw,
  CreditCard,
  Truck,
  Wallet,
  SlidersHorizontal,
  Minus,
  ArrowLeft,
  Tag,
  Loader2,
  Navigation,
  Edit3,
  Maximize2,
  ClipboardList,
  Calendar
} from 'lucide-react';
import { recipes } from './data';
import { Recipe, Difficulty, User, UserSettings, ShoppingItem, Product } from './types';
import { getAIRecipeRecommendation } from './aiService';
import { dbService } from './dbService';
import { translations, LanguageCode } from './translations';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PushNotifBanner, NotifCenter, usePushNotifications, PushNotif } from './components/PushNotifications';
import { NotifDetail } from './components/NotifDetail';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications, PushNotificationSchema, Token, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

// --- Constants & Config ---
const springTransition = { type: 'spring', stiffness: 700, damping: 36, mass: 0.35 };
const layoutTransition = { type: 'spring', stiffness: 500, damping: 32 };

const normalizeString = (str: string) =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const getInitials = (name: string | undefined | null) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// --- Sub-Components & Helpers ---

// Petit badge pour afficher la difficulté d'une recette avec une couleur spécifique
const DifficultyBadge = ({ difficulty, t }: { difficulty: Difficulty; t: any }) => {
  const colors: Record<string, string> = {
    'Facile': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Très Facile': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Moyen': 'bg-amber-100 text-amber-700 border-amber-200',
    'Difficile': 'bg-rose-100 text-rose-700 border-rose-200'
  };

  const labels: Record<string, string> = {
    'Facile': t?.easy || 'Facile',
    'Très Facile': t?.veryEasy || 'Très Facile',
    'Moyen': t?.medium || 'Moyen',
    'Difficile': t?.hard || 'Difficile'
  };

  const colorClass = colors[difficulty] || 'bg-stone-100 text-stone-600 border-stone-200';
  const label = labels[difficulty] || difficulty || '—';

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${colorClass}`}>
      {label}
    </span>
  );
};

// Composant pour afficher une étape de préparation (ex: 1. Faire bouillir l'eau)
const PreparationStep = ({ step, index, recipeId }: { step: string; index: number; recipeId: string }) => {
  const [isDone, setIsDone] = useState(false); // État interne : l'utilisateur a-t-il coché cette étape ?
  return (
    <motion.div
      key={`${recipeId}-step-${index}`}
      initial={{ opacity: 0, x: -10 }} // Animation d'entrée : arrive de la gauche
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }} // Petit décalage pour un effet cascade
      onClick={() => setIsDone(!isDone)} // Au clic, on inverse "isDone"
      className={`group flex gap-4 p-4 rounded-[24px] transition-all duration-300 cursor-pointer border ${isDone ? 'bg-emerald-50/40 border-emerald-100/50' : 'bg-stone-50 border-stone-100/50 active:bg-stone-100'}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {/* Rond de numérotation qui se transforme en coche verte si terminée */}
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isDone ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200' : 'bg-white border-stone-200 group-hover:border-terracotta'}`}>
          {isDone && <CheckCircle2 size={14} className="text-white" />}
          {!isDone && <span className="text-[10px] font-black text-stone-400">{index + 1}</span>}
        </div>
      </div>
      {/* Le texte de l'étape, barré si terminé */}
      <p className={`text-[13px] font-medium leading-relaxed transition-all duration-300 ${isDone ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
        {step}
      </p>
    </motion.div>
  );
};




const AUTOPLAY_DURATION = 4500;






// Material-style SVG icons (filled active, outlined inactive)
// Icônes personnalisées pour la barre de navigation
const NavIcon = ({ id, active, isDark }: { id: string; active: boolean; isDark?: boolean }) => {
  // Couleur active : orange en mode clair, blanc en mode sombre AMOLED
  const color = active ? (isDark ? '#F94D00' : '#F94D00') : 'rgba(255,255,255,0.65)';
  const icons: Record<string, React.ReactElement> = {
    home: active ? (
      // Icône Accueil (Home) pleine
      <svg width="22" height="22" viewBox="0 0 24 24" fill={color}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
    ) : (
      // Icône Accueil (Home) vide
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round"><path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" /></svg>
    ),
    search: active ? (
      // Icône Recherche (Search) pleine
      <svg width="22" height="22" viewBox="0 0 24 24" fill={color}><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14" /></svg>
    ) : (
      // Icône Recherche (Search) vide
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" /></svg>
    ),
    favs: active ? (
      // Icône Favoris (Hearts) pleine
      <svg width="22" height="22" viewBox="0 0 24 24" fill={color}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" /></svg>
    ) : (
      // Icône Favoris (Hearts) vide
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
    ),
    cart: active ? (
      // Icône Panier (Cart) pleine
      <svg width="22" height="22" viewBox="0 0 24 24" fill={color}><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm0 10a2 2 0 110-4 2 2 0 010 4z" /></svg>
    ) : (
      // Icône Panier (Cart) vide
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg>
    ),
    profile: active ? (
      // Icône Profil pleine
      <svg width="22" height="22" viewBox="0 0 24 24" fill={color}><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
    ) : (
      // Icône Profil vide
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    ),
  };
  return icons[id] || null;
};

const NavButton = ({ iconId, isActive, onClick, isDark }: { iconId: string; isActive: boolean; onClick: () => void; isDark?: boolean }) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.84 }}
      transition={{ type: 'spring', stiffness: 600, damping: 28 }}
      className="relative flex items-center justify-center"
      style={{ width: 60, height: 60, flexShrink: 0 }}
    >
      {/* Sliding bubble — white in light mode, AMOLED black in dark mode */}
      {isActive && (
        <motion.div
          layoutId="nav-white-bubble"
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="absolute inset-0 rounded-full nav-bubble"
        />
      )}
      <motion.div
        animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
        transition={{ type: 'spring', stiffness: 480, damping: 26 }}
        className="relative z-10"
      >
        <NavIcon id={iconId} active={isActive} isDark={isDark} />
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

const ShoppingAddModal = ({ isOpen, onClose, onAdd, t, isDark }: any) => {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('g');
  const [price, setPrice] = useState('');
  const UNITS = ['g', 'kg', 'L', 'mL', 'cl', 'pcs', 'tbsp', 'tsp', 'pinch'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: `custom_${Date.now()}`,
      item: name,
      quantity: qty,
      unit: unit,
      priceXOF: price,
      isPurchased: false
    });
    setName(''); setQty(''); setPrice('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`relative w-full max-w-lg rounded-t-[32px] p-6 pb-12 shadow-2xl ${isDark ? 'bg-[#121212] border-t border-white/10' : 'bg-white'}`}
          >
            <div className="w-12 h-1.5 bg-stone-300/40 rounded-full mx-auto mb-8" />

            <div className="flex items-center justify-between mb-8">
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>Nouvel Ingrédient</h2>
              <button onClick={onClose} className="p-2 rounded-full bg-stone-100 text-stone-400">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Nom de l'ingrédient</label>
                <input
                  autoFocus
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Tomates fraîches"
                  className={`w-full py-4 px-5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#fb5607]/10 transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-stone-50 border border-stone-100 text-stone-900'}`}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Quantité</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    placeholder="Ex: 500"
                    className={`w-full py-4 px-5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#fb5607]/10 transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-stone-50 border border-stone-100 text-stone-900'}`}
                  />
                </div>
                <div className="w-32">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Unité</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className={`w-full py-4 px-5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#fb5607]/10 transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-stone-50 border border-stone-100 text-stone-900'}`}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Prix estimé (XOF)</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="Ex: 1500"
                  className={`w-full py-4 px-5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#fb5607]/10 transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-stone-50 border border-stone-100 text-stone-900'}`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-[#fb5607] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#fb5607]/30 active:scale-95 transition-all mt-4"
              >
                Ajouter à ma liste
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Deep Views ---

const AccountSecurityView = ({ currentUser, setCurrentUser, t, securitySubView, setSecuritySubView, goBack, showAlert }: any) => {
  const [showSuccess, setShowSuccess] = useState(false); // Affiche un message de succès après modification
  const [formData, setFormData] = useState({ current: '', new: '', confirm: '', email: currentUser?.email || '', phone: currentUser?.phone || '', otp: '' }); // Formulaire temporaire
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false }); // Gérer l'affichage des mots de passe (oeil)
  const [phoneCountry, setPhoneCountry] = useState('+229');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [sentOtp, setSentOtp] = useState('');

  // Fonction pour enregistrer les changements
  const handleSave = async () => {
    if (!currentUser) return;

    if (securitySubView === 'password') {
      // Vérifications pour le mot de passe
      if (!formData.new || formData.new !== formData.confirm) {
        showAlert("Les mots de passe ne correspondent pas", "error");
        return;
      }
      if (formData.current !== currentUser.password) {
        showAlert("Mot de passe actuel incorrect", "error");
        return;
      }
      setIsAuthLoading(true);
      try {
        const updatedUser = { ...currentUser, password: formData.new };
        setCurrentUser(updatedUser);
        dbService.setCurrentUser(updatedUser); // Sauvegarde locale
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setSecuritySubView('main');
        }, 2000);
      } catch (e: any) {
        showAlert(e.message || "Erreur lors de la modification", "error");
      } finally {
        setIsAuthLoading(false);
      }
    } else if (securitySubView === 'email') {
      // Vérifications pour l'email
      if (!formData.email || !formData.email.includes('@')) {
        showAlert("Email invalide", "error");
        return;
      }
      setIsAuthLoading(true);
      try {
        const updatedUser = { ...currentUser, email: formData.email };
        setCurrentUser(updatedUser);
        dbService.setCurrentUser(updatedUser);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setSecuritySubView('main');
        }, 2000);
      } catch (e: any) {
        showAlert(e.message || "Erreur", "error");
      } finally {
        setIsAuthLoading(false);
      }
    } else if (securitySubView === 'phone') {
      if (!formData.phone) {
        showAlert("Numéro invalide", "error");
        return;
      }
      setIsAuthLoading(true);
      try {
        const fullPhone = `${phoneCountry}${formData.phone.trim()}`;
        dbService.formatPhone(fullPhone);

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        setSentOtp(otp);
        const success = await dbService.sendEmail(currentUser.email, currentUser.name, otp);
        if (!success) {
          throw new Error("Impossible d'envoyer l'email de sécurité");
        }

        setSecuritySubView('phone-validation');
      } catch (err: any) {
        showAlert(err.message || "Impossible d'envoyer le code", "error");
      } finally {
        setIsAuthLoading(false);
      }
    } else if (securitySubView === 'phone-validation') {
      if (!formData.otp) {
        return;
      }
      if (formData.otp !== sentOtp) {
        showAlert("Code incorrect. Veuillez vérifier vos emails.", "error");
        return;
      }

      setIsAuthLoading(true);
      try {
        const fullPhone = `${phoneCountry}${formData.phone.trim()}`;
        const cleanPhone = dbService.formatPhone(fullPhone);

        await dbService.adminUpdateUserPhone(currentUser.id, cleanPhone);

        const updatedUser = { ...currentUser, phone: cleanPhone };
        setCurrentUser(updatedUser);
        dbService.setCurrentUser(updatedUser);
        dbService.syncUserToCloud(updatedUser);

        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setSecuritySubView('main');
        }, 2000);
      } catch (err: any) {
        showAlert(err.message || "Erreur de mise à jour", "error");
      } finally {
        setIsAuthLoading(false);
      }
    }
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
          <button onClick={handleSave} disabled={isAuthLoading} className="w-full bg-terracotta text-white py-4 rounded-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-terracotta/20">{isAuthLoading ? "Chargement..." : t.save}</button>
          <button onClick={() => setSecuritySubView('main')} className="w-full text-stone-400 py-2 font-bold text-sm">{t.back}</button>
        </motion.div>
      );
    case 'phone':
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={springTransition} className="space-y-4">
          <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
            <h3 className="text-[10px] font-black uppercase text-stone-400 mb-4">Configurer un numéro</h3>
            <div className="space-y-4">
              <div className="flex gap-2 relative">
                <div className="relative w-[110px] shrink-0">
                  <select
                    value={phoneCountry}
                    onChange={e => setPhoneCountry(e.target.value)}
                    className="w-full appearance-none bg-white rounded-xl border border-stone-100 py-3 pl-3 pr-8 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-terracotta text-stone-900"
                  >
                    <option value="+229">🇧🇯 +229</option>
                    <option value="+225">🇨🇮 +225</option>
                    <option value="+221">🇸🇳 +221</option>
                    <option value="+228">🇹🇬 +228</option>
                    <option value="+237">🇨🇲 +237</option>
                    <option value="+241">🇬🇦 +241</option>
                    <option value="+243">🇨🇩 +243</option>
                    <option value="+33">🇫🇷 +33</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                </div>
                <div className="relative flex-1">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input type="tel" placeholder="01 23 45 67"
                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white border border-stone-100 rounded-xl py-3 pl-9 pr-4 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-terracotta text-stone-900" />
                </div>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-stone-400 italic">Un code de sécurité sera envoyé sur votre adresse email ({currentUser?.email}) pour valider cette modification.</p>
          </div>
          <button onClick={handleSave} disabled={isAuthLoading} className="w-full bg-terracotta text-white py-4 rounded-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-terracotta/20">{isAuthLoading ? "Envoi du code..." : "Continuer"}</button>
          <button onClick={() => setSecuritySubView('main')} className="w-full text-stone-400 py-2 font-bold text-sm">{t.back}</button>
        </motion.div>
      );
    case 'phone-validation':
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={springTransition} className="space-y-4">
          <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
            <h3 className="text-[10px] font-black uppercase text-stone-400 mb-4">Code de sécurité Email</h3>
            <p className="text-[12px] text-stone-500 mb-4">
              Veuillez entrer le code à 4 chiffres envoyé à l'adresse <span className="font-bold text-terracotta">{currentUser?.email}</span>.
            </p>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Code OTP"
                value={formData.otp}
                onChange={e => setFormData({ ...formData, otp: e.target.value })}
                className="w-full bg-white border border-stone-100 rounded-xl p-3 text-sm font-bold text-center tracking-[0.2em] focus:outline-none focus:ring-1 focus:ring-terracotta text-stone-900"
              />
            </div>
          </div>
          <button onClick={handleSave} disabled={isAuthLoading} className="w-full bg-terracotta text-white py-4 rounded-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-terracotta/20">{isAuthLoading ? "Vérification..." : "Valider"}</button>
          <button onClick={() => setSecuritySubView('phone')} className="w-full text-stone-400 py-2 font-bold text-sm">{t.back}</button>
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
          <button onClick={() => setSecuritySubView('phone')} className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 active:bg-stone-100 transition-colors">
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-stone-500" />
              <span className="font-bold text-stone-700 text-sm">Ajouter/Modifier numéro</span>
            </div>
            <ChevronRight size={16} className="text-stone-400" />
          </button>
        </div>
      );
  }
};

// Vue pour gérer les informations personnelles (nom, photo)
const PersonalInfoView = ({ currentUser, setCurrentUser, t, showAlert }: any) => {
  const [isEditing, setIsEditing] = useState(false); // Mode édition activé ou non
  const [name, setName] = useState(currentUser?.name || ''); // Nom à modifier
  const [isSaving, setIsSaving] = useState(false); // Est-on en train d'enregistrer sur Internet ?
  // Fonction pour enregistrer le nouveau nom
  const handleSave = async () => {
    if (!currentUser || !name.trim()) return;
    setIsSaving(true);
    try {
      const updatedUser = { ...currentUser, name: name.trim() };
      setCurrentUser(updatedUser);
      dbService.setCurrentUser(updatedUser);
      await dbService.syncUserToCloud(updatedUser); // Synchro cloud
      setIsEditing(false); // Quitter le mode édition
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
          <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-stone-100 flex items-center justify-center">
            <span className="text-4xl font-black text-terracotta tracking-tight">
              {getInitials(currentUser?.name)}
            </span>
          </div>
        </div>
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

const OrdersHistoryView = ({ currentUser, t, isDark }: { currentUser: any; t: any; isDark: boolean }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchOrders = async () => {
      try {
        const data = await dbService.getUserOrders(currentUser.id);
        if (data) setOrders(data);
      } catch (err) {
        console.error("Error fetching user orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Real-time synchronization for order updates (status, etc.)
    const channel = dbService.supabase
      ?.channel(`public:orders:user_id=eq.${currentUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${currentUser.id}`
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setOrders(current => current.map(o => o.id === payload.new.id ? payload.new : o));
        } else if (payload.eventType === 'INSERT') {
          setOrders(current => [payload.new, ...current]);
        }
      })
      .subscribe();

    return () => {
      if (channel) dbService.supabase?.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'En attente' };
      case 'processing': return { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'En préparation' };
      case 'shipped': return { bg: 'bg-indigo-500/10', text: 'text-indigo-600', label: 'Expédiée' };
      case 'delivered': return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'Livrée' };
      case 'cancelled': return { bg: 'bg-rose-500/10', text: 'text-rose-600', label: 'Annulée' };
      default: return { bg: 'bg-stone-500/10', text: 'text-stone-600', label: status };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader className="animate-spin text-[#38b000]" size={32} />
        <p className={`font-bold text-xs uppercase tracking-widest ${isDark ? 'text-[#38b000]/80' : 'text-[#38b000]'}`}>Chargement de vos commandes...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-8">
        <div className={`w-24 h-24 rounded-[40px] flex items-center justify-center mb-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-100 shadow-inner'}`}>
          <ShoppingBag size={48} className="text-stone-200" />
        </div>
        <h3 className={`text-xl font-black mb-2 tracking-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>{t.noOrders || 'Aucune commande'}</h3>
        <p className="text-sm font-medium text-stone-400 leading-relaxed max-w-[240px]">
          {t.noOrdersDesc || "Vous n'avez pas encore passé de commande. Vos délices apparaîtront ici !"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => {
        const s = getStatusColor(order.status);
        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-[32px] border shadow-sm ${isDark ? 'bg-[#111111] border-white/8' : 'bg-white border-stone-100 shadow-stone-200/20'}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Commande</span>
                <p className={`font-black tracking-tight text-sm ${isDark ? 'text-white' : 'text-stone-800'}`}>#{order.id.toString().slice(-8).toUpperCase()}</p>
              </div>
              <div className={`px-4 py-1.5 rounded-full ${s.bg} ${s.text} text-[10px] font-black uppercase tracking-widest border border-current opacity-80`}>
                {s.label}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-stone-50'}`}>
                    <Calendar size={18} className="text-stone-400" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Date</span>
                    <p className={`text-xs font-bold ${isDark ? 'text-white/80' : 'text-stone-600'}`}>{new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Total</span>
                  <p className="text-lg font-black text-[#fb5607]">{order.total_amount?.toLocaleString()} XOF</p>
                </div>
              </div>

              <div className={`h-px w-full ${isDark ? 'bg-white/5' : 'bg-stone-50'}`} />

              <div className="flex items-center justify-between">
                <div className="flex -space-x-3 overflow-hidden">
                  {(order.items || []).slice(0, 4).map((item: any, idx: number) => (
                    <div key={idx} className={`w-10 h-10 rounded-xl border-2 ${isDark ? 'border-[#111111] bg-stone-800' : 'border-white bg-stone-100'} flex items-center justify-center text-xs shadow-sm overflow-hidden`}>
                      {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : '📦'}
                    </div>
                  ))}
                  {order.items?.length > 4 && (
                    <div className={`w-10 h-10 rounded-xl border-2 ${isDark ? 'border-[#111111] bg-stone-800' : 'border-white bg-stone-200'} flex items-center justify-center text-[10px] font-black text-stone-500`}>
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>
                <button className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isDark ? 'bg-white/5 text-white/60 border border-white/10' : 'bg-stone-900 text-white shadow-lg shadow-stone-900/10'}`}>
                  {t.orderDetail || 'Détails'} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const ProfileSubViewRenderer = ({ profileSubView, setProfileSubView, currentUser, setCurrentUser, t, securitySubView, setSecuritySubView, goBack, updateSettings, handleLogout, settings, isSyncing, hasLoadedAtLeastOnce, showAlert, handleDeleteAccount }: any) => {
  const renderViewContent = () => {
    switch (profileSubView) {
      case 'personalInfo':
        return (
          <PersonalInfoView
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            t={t}
            showAlert={showAlert}
          />
        );
      case 'notifications':
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-stone-50 rounded-3xl border border-stone-100">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
              <Bell size={32} />
            </div>
            <h3 className="font-bold text-stone-800 mb-1">{t.noNotifications}</h3>
            <p className="text-stone-400 text-xs">{t.notificationDesc}</p>
          </div>
        );
      case 'settings':
        return (
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
              onClick={() => setProfileSubView('privacy')}
              className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 active:bg-stone-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                  <Eye size={18} />
                </div>
                <span className="font-bold text-stone-700 text-sm">{t.privacy}</span>
              </div>
              <ChevronRight size={16} className="text-stone-400" />
            </button>

            {/* Sync Status Indicator */}
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
        );
      case 'contribution':
        return (
          <div className="space-y-6">
            <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <Heart size={22} fill="currentColor" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-800 mb-2">{t.contribution}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    {t.contributionDesc}
                  </p>
                </div>
              </div>

              <DishSuggestionForm
                onSubmit={async (dish) => {
                  const result = await dbService.submitDishSuggestion(dish);
                  if (result.success) {
                    showAlert("Suggestion envoyée avec succès. Merci !", "success");
                    return true;
                  }
                  // Log technical error for developers, show friendly message to user
                  console.error("Suggestion submission failed:", result.error);
                  showAlert("Oups ! Nous n'avons pas pu envoyer votre suggestion. Réessayez dans quelques instants.", "error");
                  return false;
                }}
              />
            </div>
          </div>
        );
      case 'security':
        return (
          <AccountSecurityView
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            t={t}
            securitySubView={securitySubView}
            setSecuritySubView={setSecuritySubView}
            goBack={goBack}
            showAlert={showAlert}
          />
        );
      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
              <h3 className="text-[10px] font-black uppercase text-stone-400 mb-6">{t.privacyMenu}</h3>
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-stone-700 mb-1">{t.tracking}</h4>
                    <p className="text-[10px] text-stone-400 leading-relaxed">{t.trackingDesc}</p>
                  </div>
                  <div className="w-10 h-6 bg-emerald-500 rounded-full relative flex-shrink-0 transition-colors">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-stone-700 mb-1">{t.dataSharing}</h4>
                    <p className="text-[10px] text-stone-400 leading-relaxed">{t.dataSharingDesc}</p>
                  </div>
                  <div className="w-10 h-6 bg-stone-200 rounded-full relative flex-shrink-0 transition-colors">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100/50">
              <h4 className="text-sm font-bold text-rose-800 mb-1">{t.deleteAccount}</h4>
              <p className="text-[10px] text-rose-600/70 leading-relaxed mb-6">{t.deleteAccountDesc}</p>
              <button
                onClick={handleDeleteAccount}
                className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
              >
                {t.deleteAccount}
              </button>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="space-y-8 text-center py-6">
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div className="absolute inset-0 bg-terracotta/5 dark:bg-terracotta/10 rounded-[32px] animate-pulse" />
              <div className="relative flex items-center justify-center h-full rounded-[28px] shadow-2xl overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
                <img
                  src="/images/chef_icon_v2.png"
                  className="w-16 h-16 object-contain drop-shadow-md"
                  alt="AfroCuisto Logo"
                />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-stone-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-br dark:from-white dark:via-white dark:to-white/40 tracking-tight mb-2">AfroCuisto v1.0.6</h2>
              <p className="text-stone-500 dark:text-stone-300 font-medium text-sm px-8 leading-relaxed max-w-[280px] mx-auto italic transition-colors">
                L'excellence de la cuisine béninoise à portée de main.
              </p>
            </div>

            <div className="pt-4 pb-2">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-stone-200/40 dark:bg-white/[0.08] backdrop-blur-xl rounded-full border border-stone-300/50 dark:border-white/10 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-default">
                <span className="text-[9px] font-black text-stone-500 dark:text-white/60 uppercase tracking-[0.2em]">Powered by</span>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400/30 dark:bg-white/20" />
                <span className="text-[14px] font-black text-terracotta tracking-tight drop-shadow-[0_2px_10px_rgba(230,88,32,0.3)]">André Koutomi</span>
              </div>
            </div>

            <p className="text-[10px] text-stone-400 dark:text-stone-500 italic transition-colors mt-8">
              &copy; {new Date().getFullYear()} AfroCuisto. Tous droits réservés.
            </p>
          </div>
        );
      default:
        // Default to settings if profileSubView is null or invalid
        return renderViewContentInternal('settings');
    }
  };

  // Small helper to avoid recursion
  const renderViewContentInternal = (view: string) => {
    switch (view) {
      case 'settings':
        return (
          <div className="space-y-3">
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
            {/* ... other settings items omitted for brevity as they are repeated in the main switch ... */}
          </div>
        );
      default: return null;
    }
  };

  return renderViewContent();
};

// --- Modern Alert Component ---

// Composant d'alerte moderne (Pop-up) personnalisé
const ModernAlertComponent = ({
  show,
  message,
  type,
  onConfirm,
  onClose
}: {
  show: boolean;
  message: string;
  type: string;
  onConfirm?: () => void;
  onClose: () => void;
}) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          className="w-full max-w-[320px] bg-white rounded-[40px] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.3)] border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête de l'alerte (couleur selon le type) */}
          <div className={`h-32 flex items-center justify-center relative overflow-hidden ${type === 'success' ? 'bg-emerald-50 text-emerald-500' :
            type === 'error' ? 'bg-rose-50 text-rose-500' :
              'bg-[#fb5607]/5 text-[#fb5607]'
            }`}>
            {/* Effet lumineux en arrière-plan */}
            <div className={`absolute inset-0 opacity-20 blur-3xl ${type === 'success' ? 'bg-emerald-400' :
              type === 'error' ? 'bg-rose-400' :
                'bg-[#fb5607]'
              }`} />

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              className="relative z-10"
            >
              {type === 'success' && <CheckCircle2 size={42} strokeWidth={2.5} />}
              {type === 'error' && <AlertCircle size={42} strokeWidth={2.5} />}
              {type === 'info' && <Info size={42} strokeWidth={2.5} />}
            </motion.div>
          </div>

          <div className="p-8 pb-10 text-center">
            <p className="text-sm font-black text-stone-900 leading-relaxed mb-8 px-2">{message}</p>
            <div className="flex flex-col gap-2">
              {/* Bouton de confirmation ou simple bouton fermer */}
              <button
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                  type === 'error' ? 'bg-rose-500 text-white shadow-rose-500/20' :
                    'bg-stone-900 text-white shadow-stone-900/20'
                  }`}
              >
                {onConfirm ? "Confirmer" : "C'est compris"}
              </button>
              {/* Bouton Annuler (si confirmation demandée) */}
              {onConfirm && (
                <button
                  onClick={onClose}
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

// --- Constants & Components for Shopping List ---
const SHOPPING_UNITS = ['g', 'kg', 'L', 'mL', 'cl', 'pcs', 'tbsp', 'tsp', 'pinch'];
const STORE_CATEGORIES = ['Tout', 'Épices', 'Boissons', 'Huiles', 'Féculents', 'Légumes', 'Viandes', 'Poissons'];
const STORE_PRODUCTS = [
  {
    id: 'p1',
    name: 'Huile de Palme Bio',
    brand: 'NaturAfrik',
    price: 2800,
    unit: '1L',
    image_url: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=400',
    category: 'Huiles',
    badge: 'Populaire',
    color: '#38b000',
    description: "Une huile de palme pure, extraite de manière traditionnelle et issue de l'agriculture biologique. Parfaite pour vos plats locaux comme le ragoût d'igname ou la sauce graine.",
    rating: 4.8,
    reviews_count: 124
  },
  {
    id: 'p2',
    name: 'Riz Parfumé Long Grain',
    brand: 'Goldenrice',
    price: 4500,
    unit: '5kg',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=400',
    category: 'Féculents',
    badge: 'Promo -15%',
    color: '#10b981',
    description: "Riz parfumé de haute qualité, cultivé dans les plaines fertiles. Ses grains longs et sa texture légère en font l'accompagnement idéal pour tous vos mets.",
    rating: 4.5,
    reviews_count: 85
  },
  {
    id: 'p3',
    name: 'Ndolé Séché Premium',
    brand: 'TasteOfCMR',
    price: 1800,
    unit: '200g',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400',
    category: 'Légumes',
    badge: 'Nouveau',
    color: '#6366f1',
    description: "Feuilles de Ndolé soigneusement sélectionnées, lavées et séchées pour conserver toute leur saveur et leurs bienfaits nutritionnels. Prêt pour la cuisson.",
    rating: 4.9,
    reviews_count: 56
  },
  {
    id: 'p4',
    name: 'Gingembre Frais Moulu',
    brand: 'SpiceLab',
    price: 750,
    unit: '100g',
    image_url: 'https://images.unsplash.com/photo-1615485240318-10f4889b9ba9?q=80&w=400',
    category: 'Épices',
    badge: null,
    color: '#f59e0b',
    description: "Poudre de gingembre 100% naturelle, moulue à partir de racines fraîches. Un arôme puissant et piquant pour sublimer vos boissons et vos marinades.",
    rating: 4.7,
    reviews_count: 210
  },
  {
    id: 'p5',
    name: 'Piment Scotch Bonnet',
    brand: 'AfroSpice',
    price: 950,
    unit: '250g',
    image_url: 'https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?q=80&w=400',
    category: 'Épices',
    badge: 'Best-seller',
    color: '#ef4444',
    description: "Le fameux piment antillais, réputé pour son parfum fruité et sa force de caractère. Cultivé sans pesticides pour une saveur authentique.",
    rating: 4.6,
    reviews_count: 142
  },
  {
    id: 'p6',
    name: 'Tomates Fraîches',
    brand: 'Maraîcher Local',
    price: 3650,
    unit: '1kg',
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=400',
    category: 'Légumes',
    badge: 'Frais',
    color: '#ef4444',
    description: "Tomates fraîches et juteuses, cultivées localement. Elles sont riches en lycopène et parfaites pour vos sauces, salades et soupes préférées.",
    rating: 4.5,
    reviews_count: 89
  },
];

const SHOPPING_BANNERS = [
  { id: 1, title: 'Livraison Express Abidjan', sub: 'Recevez vos ingrédients en moins de 2h !', image_url: 'https://images.unsplash.com/photo-1526367790999-0150786486a9?q=80&w=400', bg: 'linear-gradient(135deg, #fb5607 0%, #ff006e 100%)', tag: 'OFFRE' },
  { id: 2, title: 'Bio & Équitable', sub: 'Soutenez les producteurs locaux avec NaturAfrik.', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400', bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', tag: 'ÉCO' },
  { id: 3, title: 'Promo Semaine', sub: '-20% sur tout le rayon épices ce weekend.', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400', bg: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', tag: 'SOLDE' },
];

const ShoppingItemRow: React.FC<{
  item: ShoppingItem;
  dimmed?: boolean;
  list: ShoppingItem[];
  updateShoppingList: (nl: ShoppingItem[]) => void;
  UNITS: string[];
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  isDark?: boolean;
}> = ({ item, dimmed, list, updateShoppingList, UNITS, isSelected, onToggleSelection, isDark }) => {
  const [editQty, setEditQty] = useState(item.quantity ?? '');
  const [editUnit, setEditUnit] = useState(item.unit ?? 'g');
  const [editPrice, setEditPrice] = useState(item.priceXOF ?? '');
  const [isEditing, setIsEditing] = useState(false);

  const isStoreItem = item.id.startsWith('store_');

  const save = () => {
    const newList = list.map(i => i.id === item.id
      ? { ...i, quantity: editQty, unit: editUnit, priceXOF: editPrice }
      : i);
    updateShoppingList(newList);
    setIsEditing(false);
  };

  const active = isStoreItem ? isSelected : item.isPurchased;

  return (
    <motion.div layout key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-[24px] border shadow-sm overflow-hidden transition-all ${isDark ? (active ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5') : (active ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-stone-100')}`}
    >
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={() => {
            if (isStoreItem) {
              onToggleSelection?.(item.id);
            } else {
              const newList = list.map(i => i.id === item.id ? { ...i, isPurchased: !i.isPurchased } : i);
              updateShoppingList(newList);
            }
          }}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${active ? 'bg-[#38b000] border-[#38b000] shadow-sm' : (isDark ? 'border-white/20 hover:border-[#38b000]' : 'border-stone-200 hover:border-[#38b000]')}`}
        >
          {active && <Check size={13} className="text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-bold leading-tight ${active && !isStoreItem ? 'line-through text-stone-400' : (isDark ? 'text-white/90' : 'text-stone-800')}`}>{item.item}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {item.quantity && <span className="text-[11px] font-black text-[#38b000]">{item.quantity} {item.unit}</span>}
            {item.priceXOF && <span className={`text-[10px] font-bold ${isDark ? 'text-white/30' : 'text-stone-400'}`}>{parseInt(item.priceXOF).toLocaleString()} XOF</span>}
            {!item.quantity && !item.priceXOF && <span className="text-[11px] text-stone-300 italic">Appuyez ✎ pour ajouter qté &amp; prix</span>}
            {item.recipeName && <><span className={`w-1 h-1 rounded-full inline-block ${isDark ? 'bg-white/10' : 'bg-stone-200'}`} /><span className={`text-[10px] truncate max-w-[90px] ${isDark ? 'text-white/30' : 'text-stone-400'}`}>↳ {item.recipeName}</span></>}
            {isStoreItem && item.isInCart && (
              <span className="text-[8px] font-black uppercase bg-[#38b000]/20 text-[#38b000] px-1.5 py-0.5 rounded-full">Panier</span>
            )}
          </div>
        </div>
        {!isStoreItem && (
          <button onClick={() => setIsEditing(!isEditing)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-white/40 hover:bg-[#38b000]/20 hover:text-[#38b000]' : 'bg-stone-50 text-stone-400 hover:bg-[#38b000]/10 hover:text-[#38b000]'}`}
          >
            <Edit2 size={13} />
          </button>
        )}
        <button onClick={() => { const nl = list.filter(i => i.id !== item.id); updateShoppingList(nl); }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-white/20 hover:bg-rose-500/20 hover:text-rose-500' : 'bg-stone-50 text-stone-300 hover:bg-rose-50 hover:text-rose-500'}`}
        >
          <Trash2 size={13} />
        </button>
      </div>
      <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className={`overflow-hidden border-t ${isDark ? 'border-white/5 bg-white/2' : 'border-stone-100 bg-stone-50'}`}
          >
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 block">Quantité</label>
                  <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} placeholder="Ex: 500"
                    className={`w-full border rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#38b000]/20 ${isDark ? 'bg-white/8 border-white/10 text-white' : 'bg-white border-stone-200'}`} />
                </div>
                <div className="w-28">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 block">Unité</label>
                  <select value={editUnit} onChange={e => setEditUnit(e.target.value)}
                    className={`w-full border rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#38b000]/20 ${isDark ? 'bg-white/8 border-white/10 text-white' : 'bg-white border-stone-200'}`}
                  >
                    {UNITS.map(u => <option key={u} value={u} className={isDark ? 'bg-stone-900' : ''}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 block">Prix estimé (XOF)</label>
                <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} placeholder="Ex: 1500"
                  className={`w-full border rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#38b000]/20 ${isDark ? 'bg-white/8 border-white/10 text-white' : 'bg-white border-stone-200'}`} />
              </div>
              <button onClick={save} className="w-full py-3 bg-[#38b000] text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-sm">
                Enregistrer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
// --- Modal de sélection de position sur carte ---
const MapPickerModal = ({ isOpen, onClose, onSelect, initialCoords, isDark }: any) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [tempCoords, setTempCoords] = React.useState(initialCoords || { lat: 6.3654, lng: 2.4183 });
  const [isLoading, setIsLoading] = React.useState(false);
  const mapInstance = React.useRef<any>(null);
  const markerInstance = React.useRef<any>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const initMap = () => {
      if (!mapRef.current) return;
      const L = (window as any).L;
      if (!L) return;

      if (mapInstance.current) {
        mapInstance.current.remove();
      }

      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        fadeAnimation: true
      }).setView([tempCoords.lat, tempCoords.lng], 15);

      // Utilisation d'OSM Standard pour une compatibilité maximale
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap builders',
        maxZoom: 19
      }).addTo(mapInstance.current);

      L.control.zoom({ position: 'topright' }).addTo(mapInstance.current);

      markerInstance.current = L.marker([tempCoords.lat, tempCoords.lng], {
        draggable: true
      }).addTo(mapInstance.current);

      mapInstance.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        markerInstance.current.setLatLng([lat, lng]);
        setTempCoords({ lat, lng });
      });

      markerInstance.current.on('dragend', () => {
        const { lat, lng } = markerInstance.current.getLatLng();
        setTempCoords({ lat, lng });
      });

      // Correction critique pour les "tuiles grises" : invalidateSize répétée pendant l'animation
      let count = 0;
      const timer = setInterval(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
          count++;
        }
        if (count > 10) clearInterval(timer);
      }, 300);
    };

    if (!(window as any).L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      setTimeout(initMap, 100);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempCoords.lat}&lon=${tempCoords.lng}`);
      const data = await response.json();
      onSelect(tempCoords, data.display_name || `${tempCoords.lat.toFixed(4)}, ${tempCoords.lng.toFixed(4)}`);
      onClose();
    } catch (error) {
      onSelect(tempCoords, `${tempCoords.lat.toFixed(4)}, ${tempCoords.lng.toFixed(4)}`);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[2000] flex flex-col bg-white"
    >
      <div className={`p-6 flex items-center justify-between ${isDark ? 'bg-black text-white' : 'bg-white text-stone-900'} border-b border-stone-100`}>
        <button onClick={onClose} className="p-2 -ml-2">
          <ArrowLeft size={24} />
        </button>
        <h3 className="text-lg font-black">Choisir ma position</h3>
        <div className="w-10" />
      </div>

      <div ref={mapRef} className="flex-1 w-full bg-stone-100" />

      <div className="absolute bottom-10 left-6 right-6 z-[2001]">
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-full py-5 bg-[#F94D00] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} strokeWidth={3} />}
          Confirmer cet emplacement
        </button>
      </div>
    </motion.div>
  );
};

// --- Main Application ---

// --- APPLICATION PRINCIPALE (COMPOSANT RACINE) ---
const StoreProductCard = ({
  product,
  list,
  updateShoppingList,
  isDark,
  allMerchants,
  setSelectedProduct
}: {
  product: Product;
  list: ShoppingItem[];
  updateShoppingList: (nl: ShoppingItem[]) => void;
  isDark: boolean;
  allMerchants: any[];
  setSelectedProduct: (p: Product) => void;
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const shopItem = list.find(i => i.id.startsWith(`store_${product.id}`));
  const isInList = !!shopItem;
  const isInCart = shopItem?.isInCart;
  const mName = product.merchant_id ? (allMerchants.find(m => m.id === product.merchant_id)?.name || product.brand) : product.brand;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-[32px] overflow-hidden p-3 flex flex-col ${isDark ? 'bg-white/5' : 'bg-white shadow-sm border border-stone-50'}`}
    >
      <div
        onClick={() => setSelectedProduct(product)}
        className={`relative aspect-square rounded-[26px] flex items-center justify-center text-[54px] mb-4 cursor-pointer active:scale-95 transition-all ${isDark ? 'bg-white/5' : 'bg-[#F4F7F5]'}`}
      >
        {isInList && (
          <div className={`absolute top-2 left-2 right-2 py-1.5 rounded-full border flex items-center justify-center gap-1.5 z-10 backdrop-blur-sm ${isInCart ? 'bg-[#38b000]/10 border-[#38b000]/20 text-[#38b000]' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'}`}>
            <Check size={10} strokeWidth={4} />
            <span className="text-[9px] font-black uppercase tracking-wide">
              {isInCart ? 'Au panier' : 'Dans la liste'}
            </span>
          </div>
        )}
        <div className="hover:scale-110 transition-transform duration-500 w-full h-full flex items-center justify-center overflow-hidden rounded-[22px]">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[54px]">{product.emoji || '📦'}</span>
          )}
        </div>
      </div>

      <div className="px-2 pb-1.5">
        <h4
          onClick={() => setSelectedProduct(product)}
          className={`text-[15px] font-black leading-tight truncate ${isDark ? 'text-white' : 'text-stone-800'}`}
        >
          {product.name}
        </h4>
        <p className="text-[11px] font-bold text-stone-400 mt-1 truncate">
          {mName}
        </p>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[13px] font-bold text-stone-400">XOF</span>
            <span className={`text-[17px] font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>{product.price.toLocaleString()}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const newItem = { id: `store_${product.id}_${Date.now()}`, item: product.name, amount: '1', quantity: '1', unit: product.unit, priceXOF: String(product.price), isPurchased: false, recipeName: mName };
              updateShoppingList([...list, newItem]);
              setIsAdded(true);
              setTimeout(() => setIsAdded(false), 2000);
            }}
            className={`w-[42px] h-[42px] rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg ${isAdded ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-[#38b000] shadow-[#38b000]/25'}`}
          >
            {isAdded ? <Check size={20} strokeWidth={3} className="text-white" /> : <Plus size={20} strokeWidth={3} className="text-white" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  // --- ÉTATS (MÉMOIRE) DE L'APPLICATION ---
  const [currentUser, setCurrentUser] = useState<User | null>(dbService.getCurrentUser()); // Utilisateur actuellement connecté
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login'); // Mode choisi : Connexion ou Inscription
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email'); // Méthode d'auth : email ou téléphone
  const [authFormData, setAuthFormData] = useState({ name: '', email: '', password: '', phone: '' }); // Données saisies dans le formulaire
  const [showPassword, setShowPassword] = useState(false); // Masquer/Afficher le mot de passe
  const [isAuthLoading, setIsAuthLoading] = useState(false); // Est-on en train de se connecter ?
  const [authError, setAuthError] = useState<string | null>(null); // Message d'erreur éventuel lors de l'auth
  const [authStep, setAuthStep] = useState<'form' | 'otp'>('form'); // Étape d'authentification (Formulaire ou Code OTP)
  const [sentOtp, setSentOtp] = useState(''); // Code OTP qui a été envoyé par mail (mode email)
  const [otpInput, setOtpInput] = useState(''); // Code OTP saisi par l'utilisateur
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]; // Références pour les cases OTP
  const [phoneCountry, setPhoneCountry] = useState('+229'); // Indicatif pays pour l'inscription

  // --- Adaptive Android System Navigation Bar ---
  // Automatically detects the height of the Android system navigation bar
  // and injects it as a CSS variable using env() with a robust max() fallback.
  useEffect(() => {
    const applyNavInset = () => {
      if (!Capacitor.isNativePlatform()) {
        document.documentElement.style.setProperty('--nav-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
      } else {
        // Force un padding minimum plus discret (24px) pour éviter que la barre de navigation
        // ne soit masquée, mais sans pour autant flotter trop haut sur l'écran.
        document.documentElement.style.setProperty('--nav-inset-bottom', 'max(env(safe-area-inset-bottom, 0px), 24px)');
      }
    };

    applyNavInset();
    window.addEventListener('resize', applyNavInset);
    return () => window.removeEventListener('resize', applyNavInset);
  }, []);

  // --- Request Permissions (Location & Notifications) ---
  const lastPushToken = useRef<string | null>(null);

  useEffect(() => {
    let pushListener: any;
    let errListener: any;
    let receiveListener: any;
    let actionListener: any;

    const initNotifications = async () => {
      // Only run on native platforms (Android/iOS)
      if (!Capacitor.isNativePlatform()) return;

      try {
        // 1. Geolocation
        const geoStatus = await Geolocation.checkPermissions();
        if (geoStatus.location !== 'granted') {
          await Geolocation.requestPermissions();
        }

        // 2. Notifications Permissions
        const pushStatus = await PushNotifications.checkPermissions();
        if (pushStatus.receive !== 'granted') {
          await PushNotifications.requestPermissions();
        }

        // 3. Android Channels (CRITICAL for background notifications on Android 8+)
        if (Capacitor.getPlatform() === 'android') {
          await PushNotifications.createChannel({
            id: 'fcm_default_channel_v2',
            name: 'AfroCuisto Notifications',
            description: 'Canal pour les alertes gourmandes AfroCuisto',
            importance: 5, // High importance (Sound + Banner)
            visibility: 1, // Public
            vibration: true,
          });
        }

        // --- Configure Push Notifications Listeners ---
        // Register with FCM/APNS
        await PushNotifications.register();

        // On successful registration, save token to ref
        pushListener = await PushNotifications.addListener('registration', (token: Token) => {
          console.log('Push token renewal: ' + token.value);
          lastPushToken.current = token.value;

          // If already logged in, sync immediately
          if (currentUser?.id) {
            dbService.saveUserFCMToken(currentUser.id, token.value, Capacitor.getPlatform());
          }
        });

        errListener = await PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Push Registration Error: ' + JSON.stringify(error));
        });

        receiveListener = await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
          console.log('Push received in foreground: ' + JSON.stringify(notification));
          // Foreground notifications show up as a banner via usePushNotifications (Supabase Realtime)
          // but we log here for FCM debugging
        });

        actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
          console.log('Push action tapped: ' + JSON.stringify(notification));
          // Handle navigation if needed
        });

      } catch (err) {
        console.warn("Notifications initialization failed:", err);
      }
    };

    initNotifications();

    // Trigger sync if we already have a token but just logged in
    if (currentUser?.id && lastPushToken.current) {
      dbService.saveUserFCMToken(currentUser.id, lastPushToken.current, Capacitor.getPlatform());
    }

    return () => {
      if (pushListener) pushListener.remove();
      if (errListener) errListener.remove();
      if (receiveListener) receiveListener.remove();
      if (actionListener) actionListener.remove();
    };
  }, [currentUser?.id]);

  useEffect(() => {
    // Initial Auth Check
    const initAuth = async () => {
      if (!dbService.supabase) return;
      const sessionRes = await dbService.supabase.auth.getSession();
      const session = sessionRes?.data?.session;

      const updateUserObject = async (sessionUser: any) => {
        setIsSyncing(true);
        try {
          // Force fetch the freshest user auth data to catch instant bans
          const userRes = await dbService.supabase!.auth.getUser();
          const freshestUser = userRes?.data?.user;
          const targetUser = freshestUser || sessionUser;

          if (targetUser?.user_metadata?.banned) {
            console.warn("User is banned, auto-logging out.");
            await dbService.signOut();
            setCurrentUser(null);
            dbService.setCurrentUser(null);
            setAuthError("Votre compte a été désactivé par un administrateur.");
            return;
          }

          // Fetch remote profile
          const remoteProfile = await dbService.getRemoteUserProfile(targetUser.id);
          const existingLocal = dbService.getUsers().find(u => u.email === sessionUser.email) || null;

          // localStorage dark mode is ALWAYS the source of truth for the current session
          // It is set explicitly every time the user toggles dark mode.
          const localDarkMode = typeof window !== 'undefined'
            ? localStorage.getItem('afrocuisto_dark_mode')
            : null;

          const mergedSettings = {
            darkMode: localDarkMode !== null
              ? localDarkMode === 'true'
              : (existingLocal?.settings?.darkMode ?? remoteProfile?.settings?.darkMode ?? false),
            language: existingLocal?.settings?.language || remoteProfile?.settings?.language || 'fr',
            unitSystem: existingLocal?.settings?.unitSystem || remoteProfile?.settings?.unitSystem || 'metric',
          };

          const userObj: User = {
            id: targetUser.id,
            name: remoteProfile?.name || targetUser.user_metadata?.full_name || existingLocal?.name || targetUser.email?.split('@')[0] || "User",
            email: targetUser.email || sessionUser.email!,
            phone: remoteProfile?.phone || targetUser.phone || sessionUser.phone || existingLocal?.phone || '',
            favorites: remoteProfile?.favorites || existingLocal?.favorites || [],
            shoppingList: remoteProfile?.shoppingList || existingLocal?.shoppingList || [],
            joinedDate: existingLocal?.joinedDate || new Date(targetUser.created_at || Date.now()).toLocaleDateString(),
            settings: mergedSettings,
            avatar: remoteProfile?.avatar || existingLocal?.avatar || currentUser?.avatar
          };

          setCurrentUser(userObj);
          dbService.setCurrentUser(userObj);
          setHasLoadedAtLeastOnce(true);

          // ONLY re-create remote profile if it's missing AND the user is actually logged in
          if (!remoteProfile && targetUser.id) {
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

  // Surveiller le bannissement en temps réel pendant que l'utilisateur navigue (Polling + App Resume)
  useEffect(() => {
    if (!currentUser || !dbService.supabase) return;

    const checkBanStatus = async () => {
      try {
        const { data: { user }, error } = await dbService.supabase!.auth.getUser();
        if (error) return; // Ignore simple network errors here 

        if (user?.user_metadata?.banned) {
          console.warn("L'utilisateur a été banni pendant la session. Éjection en cours...");
          await dbService.signOut();
          setCurrentUser(null);
          dbService.setCurrentUser(null);
          setAuthError("Votre compte a été désactivé par un administrateur. Veuillez contacter le support technique.");
          setAuthMode('login');
        }
      } catch (err) {
        // Silently catch network errors during polling
      }
    };

    // 1. Polling toutes les 30 secondes
    const interval = setInterval(checkBanStatus, 30000);

    // 2. Vérification au retour de l'application au premier plan (Foreground / Visibility)
    let appStateListener: any;

    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) checkBanStatus();
      }).then(listener => { appStateListener = listener; });
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkBanStatus();
    };

    if (!Capacitor.isNativePlatform()) {
      window.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearInterval(interval);
      if (appStateListener) appStateListener.remove();
      if (!Capacitor.isNativePlatform()) {
        window.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [currentUser]);

  // Cloud Sync & Internet Dependency
  const [allRecipes, setAllRecipes] = useState<Recipe[]>(recipes); // Use static data as first fallback
  const [allProducts, setAllProducts] = useState<Product[]>(STORE_PRODUCTS); // Dynamic store products
  const [selectedStoreCategory, setSelectedStoreCategory] = useState('Tout');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [allMerchants, setAllMerchants] = useState<any[]>([]); // Dynamic merchants
  const [isSyncing, setIsSyncing] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  // Theme context for shopping/store
  const shopTheme = {
    primary: '#38b000',
    secondary: '#70e000',
    dark: '#004b23',
    light: '#ccff33',
    accent: '#9ef01a'
  };
  // ── Shopping page tabs & modals ──
  const [storeTab, setStoreTab] = useState<'store' | 'mylist'>('store');
  const [selectedStoreItemIds, setSelectedStoreItemIds] = useState<string[]>([]);
  const [showAddShoppingModal, setShowAddShoppingModal] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [ordersCount, setOrdersCount] = useState(0);

  useEffect(() => {
    if (!currentUser || !dbService.supabase) {
      setOrdersCount(0);
      return;
    }

    const fetchOrdersCount = async () => {
      try {
        const orders = await dbService.getUserOrders(currentUser.id);
        setOrdersCount(orders?.length || 0);
      } catch (err) {
        console.error("Error fetching orders count:", err);
      }
    };

    fetchOrdersCount();

    // Listen for new orders to update count
    const channel = dbService.supabase
      .channel(`orders-count-${currentUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${currentUser.id}`
      }, () => {
        fetchOrdersCount();
      })
      .subscribe();

    return () => {
      dbService.supabase?.removeChannel(channel);
    };
  }, [currentUser]);

  const [bannerIdx, setBannerIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setBannerIdx(i => (i + 1) % SHOPPING_BANNERS.length), 4000);
    return () => clearInterval(timer);
  }, []);
  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
    onConfirm?: () => void;
  }>({ show: false, message: '', type: 'info' });

  // Effet pour gérer l'état de connexion au lancement de l'appli
  useEffect(() => {
    const handleOnline = () => setIsOffline(false); // On est en ligne
    const handleOffline = () => setIsOffline(true); // On a perdu internet

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // On nettoie les écouteurs d'événements si le composant s'arrête
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showAlert = (message: string, type?: 'success' | 'error' | 'info', onConfirm?: () => void) => {
    let finalType = type || 'info';
    if (!type) {
      const lower = message.toLowerCase();
      if (lower.includes('succès') || lower.includes('ajouté') || lower.includes('enregistré') || lower.includes('merci') || lower.includes('bienvenue') || lower.includes('parti')) finalType = 'success';
      else if (lower.includes('erreur') || lower.includes('incorrect') || lower.includes('invalide') || lower.includes('échec') || lower.includes('correspondent pas')) finalType = 'error';
    }
    setAlertConfig({ show: true, message, type: finalType, onConfirm });
  };


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
      if (allRecipes.length === 0) setSyncError(true);
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

  const syncProducts = async () => {
    try {
      const products = await dbService.getRemoteProducts();
      if (products && products.length > 0) setAllProducts(products);
    } catch (err) {
      console.error('Products sync failed:', err);
    }
  };

  const syncMerchants = async () => {
    try {
      const merchants = await dbService.getRemoteMerchants();
      setAllMerchants(merchants || []);
    } catch (err) {
      console.error('Merchants sync failed:', err);
    }
  };

  const refreshHome = async () => {
    if (!navigator.onLine) {
      showAlert(t.offlineMessage || "Vous êtes hors ligne.", 'error');
      return;
    }
    await Promise.all([
      syncRecipes(),
      syncSections(),
      syncProducts(),
      syncMerchants()
    ]);
  };

  useEffect(() => {
    syncRecipes();
    syncSections();
    syncProducts();
    syncMerchants();

    // Configuration des mises à jour en temps réel (Realtime)
    let channel: any;
    let sectionsChannel: any;
    if (dbService.supabase) {
      // Écoute des changements sur la table 'recipes'
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

      // Écoute des changements sur la table 'home_sections'
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

      // Écoute des changements sur la table 'products'
      const productsChannel = dbService.supabase
        .channel('products-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => {
            console.log('Products changed, re-syncing products...');
            syncProducts();
          }
        )
        .subscribe();

      // Écoute des changements sur la table 'merchants'
      const merchantsChannel = dbService.supabase
        .channel('merchants-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'merchants' },
          () => {
            console.log('Merchants changed, re-syncing merchants...');
            syncMerchants();
          }
        )
        .subscribe();
    }

    // Gérer le retour de l'application au premier plan (sur mobile)
    const handleAppStateChange = (state: any) => {
      if (state.isActive) {
        console.log('App resumed, syncing recipes and sections...');
        syncRecipes();
        syncSections();
        syncMerchants();
      }
    };
    const appListener = CapacitorApp.addListener('appStateChange', handleAppStateChange);

    return () => {
      // Nettoyage des abonnements lors de la fermeture
      if (channel) dbService.supabase?.removeChannel(channel);
      if (sectionsChannel) dbService.supabase?.removeChannel(sectionsChannel);
      appListener.then(l => l.remove());
    };
  }, []);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [history, setHistory] = useState<string[]>(['home']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [profileSubView, setProfileSubView] = useState<string | null>(null);
  const [securitySubView, setSecuritySubView] = useState<'main' | 'password' | 'email' | 'validation' | 'phone' | 'phone-validation'>('main');
  const [aiRecommendation, setAiRecommendation] = useState<string>("Chargement de votre suggestion personnalisée...");
  const [kidPageIndex, setKidPageIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);
  const [selectedNotifDetail, setSelectedNotifDetail] = useState<PushNotif | null>(null);
  const { notifications, unreadCount, currentBanner, dismissBanner, markAllRead } = usePushNotifications();

  const [homeCarouselIndex, setHomeCarouselIndex] = useState(0);
  const homeTouchRef = useRef({ startX: 0, startY: 0 });

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

  // Logique de navigation (changer d'onglet)
  const navigateTo = (tab: string) => {
    if (tab === activeTab) return;
    setHistory(prev => [...prev, tab]); // Mémorise l'historique pour le bouton "Retour"
    setActiveTab(tab); // Change l'onglet actif
    setSelectedRecipe(null); // Ferme une éventuelle recette ouverte
    setSelectedProduct(null); // Ferme une éventuelle vue produit
    setProfileSubView(null); // Réinitialise les sous-vues de profil
    setSecuritySubView('main');
    setIsScrolled(false);
    if (mainScrollRef.current) mainScrollRef.current.scrollTo(0, 0); // Remonte en haut de page
  };

  const onMainScroll = (e: React.UIEvent<HTMLElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 50);
    if (e.currentTarget.scrollTop <= 50) setIsSearchExpanded(false);
  };

  // Fonction pour revenir en arrière (Bouton physique Retour sur Android ou bouton virtuel)
  // On utilise un ref pour que le listener Android voie toujours l'état le plus récent
  const goBackRef = useRef<() => void>(() => { });

  const goBack = () => {
    // Top-most overlays (z-index 2000+)
    if (selectedNotifDetail) { setSelectedNotifDetail(null); return; }
    if (isNotifCenterOpen) { setIsNotifCenterOpen(false); return; }
    if (isCartOpen) { setIsCartOpen(false); return; }
    if (isOrdersOpen) { setIsOrdersOpen(false); return; }
    if (showAddShoppingModal) { setShowAddShoppingModal(false); return; }

    // Middle overlays
    if (selectedProduct) { setSelectedProduct(null); return; }
    if (selectedRecipe) { setSelectedRecipe(null); return; }
    if (isSearchExpanded) { setIsSearchExpanded(false); return; }

    // Profile sub-views
    if (profileSubView === 'security' && securitySubView !== 'main') {
      setSecuritySubView('main');
      return;
    }
    if (profileSubView) { setProfileSubView(null); return; }
    // 4. Si des filtres de catégorie / région / recherche sont actifs, on les efface
    if (selectedCategory || selectedRegion || searchQuery) {
      setSelectedCategory(null);
      setSelectedRegion(null);
      setSearchQuery('');
      return;
    }
    // 5. Sur la page de connexion: OTP → formulaire → quitter
    if (!currentUser) {
      if (authStep === 'otp') { setAuthStep('form'); setOtpInput(''); return; }
      if (authMode === 'signup') { setAuthMode('login'); return; }
      CapacitorApp.exitApp();
      return;
    }
    // 6. On recule dans l'historique des onglets
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      setActiveTab(newHistory[newHistory.length - 1]);
      return;
    }
    // 7. On est tout au début — quitter l'application
    CapacitorApp.exitApp();
  };

  // Mettre à jour la ref à chaque rendu pour que le listener ait toujours la version fraîche
  useEffect(() => {
    goBackRef.current = goBack;
  });

  // Enregistrer le listener Android UNE SEULE FOIS (pas de re-souscription à chaque changement d'état)
  useEffect(() => {
    const listener = CapacitorApp.addListener('backButton', () => {
      goBackRef.current();
    });
    return () => { listener.then(l => l.remove()); };
  }, []);

  // Dark mode: read from localStorage if user is not logged in, otherwise from user settings
  const savedDarkMode = typeof window !== 'undefined' ? localStorage.getItem('afrocuisto_dark_mode') === 'true' : false;
  const settings = currentUser?.settings || { darkMode: savedDarkMode, language: 'fr', unitSystem: 'metric' };
  const t = translations[settings.language as LanguageCode] || translations.fr;

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
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

      // Auto-sync settings to the cloud
      try {
        await dbService.syncUserToCloud(updatedUser);
      } catch (err) {
        console.error("Failed to sync settings:", err);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    showAlert(
      "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données (favoris, avis, liste de courses) seront définitivement supprimées.",
      "info",
      async () => {
        setIsAuthLoading(true);
        const success = await dbService.deleteAccount(currentUser.id);
        setIsAuthLoading(false);
        if (success) {
          // IMPORTANT: Clear both local and app state immediately
          dbService.setCurrentUser(null);
          setCurrentUser(null);
          setProfileSubView(null);
          setActiveTab('home');
          setHistory(['home']);
          setAuthMode('login');
          setAuthStep('form');
          setAuthFormData({ name: '', email: '', password: '' });

          // Small delay before alert to ensure UI paints the auth screen
          setTimeout(() => {
            showAlert("Votre compte et vos données ont été supprimés.", "success");
          }, 100);
        } else {
          showAlert("Une erreur est survenue lors de la suppression.", "error");
        }
      }
    );
  };

  // Déconnexion de l'utilisateur
  const handleLogout = async () => {
    // 1. Sauvegarde du mode sombre avant de partir
    const currentDarkMode = isDark;
    localStorage.setItem('afrocuisto_dark_mode', String(currentDarkMode));

    // 2. Déconnexion immédiate de l'UI (Etat local)
    setCurrentUser(null);
    dbService.setCurrentUser(null);

    // 3. Nettoyage des états de navigation pour éviter les flashs
    setSelectedRecipe(null);
    setSelectedProduct(null);
    setProfileSubView(null);
    setActiveTab('home');
    setHistory(['home']);

    // 4. Déconnexion distante (Supabase) sans bloquer l'interface
    dbService.signOut().catch(err => console.error("SignOut error:", err));

    showAlert("Vous êtes maintenant déconnecté", "success");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const identifier = authFormData.email.trim(); // "email" field doubles as phone field
      const password = authFormData.password;

      if (dbService.isPhoneNumber(identifier)) {
        // Phone + password login (no OTP)
        const phone = dbService.formatPhone(identifier);
        await dbService.signInWithPhonePassword(phone, password);
      } else {
        // Email + password login
        try {
          await dbService.signIn(identifier, password);
        } catch (err: any) {
          if (err.message && err.message.includes("Email not confirmed")) {
            console.log("Legacy unconfirmed account detected. Auto-confirming via admin API...");
            const confirmed = await dbService.adminForceConfirmEmail(identifier);
            if (confirmed) {
              // Retry login!
              await dbService.signIn(identifier, password);
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      let msg = err.message || "Identifiants incorrects";
      if (msg.includes("Email not confirmed")) {
        msg = "Veuillez confirmer votre adresse email. Vérifiez vos spams !";
      } else if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
        msg = "Identifiants incorrects. Vérifiez votre email/téléphone et mot de passe.";
      } else if (msg.includes("phone") && msg.includes("not")) {
        msg = "Connexion par téléphone non disponible. Essayez avec votre email.";
      } else if (msg.includes("account_disabled")) {
        msg = "Votre compte a été désactivé par un administrateur. Veuillez contacter le support technique.";
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
      // Email signup: send email OTP (custom flow)
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      setSentOtp(otp);
      setOtpInput('');
      const success = await dbService.sendEmail(authFormData.email.trim(), authFormData.name.trim(), otp);
      if (!success) {
        throw new Error("Impossible d'envoyer le code de vérification. Vérifiez votre adresse email.");
      }
      setAuthStep('otp');
      setTimeout(() => { otpRefs[0]?.current?.focus(); }, 400);
    } catch (err: any) {
      setAuthError(err.message || "Erreur lors de l'envoi du code.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Email OTP verification (custom local check)
    if (otpInput !== sentOtp) {
      setAuthError("Code OTP incorrect. Veuillez vérifier vos emails.");
      return;
    }

    setIsAuthLoading(true);
    setAuthError(null);
    try {
      // 1. Try to sign up
      let data;
      try {
        const fullPhone = authFormData.phone.trim() ? `${phoneCountry}${authFormData.phone.trim()}` : undefined;
        data = await dbService.signUp(authFormData.email.trim(), authFormData.password, authFormData.name.trim(), fullPhone);
      } catch (err: any) {
        // 2. If user already exists (ghost account), we try to log them in directly
        // because they proved ownership via OTP.
        if (err.message?.includes("User already registered") || err.message?.includes("already exists")) {
          console.log("Ghost account detected, attempting recovery login...");
          data = await dbService.signIn(authFormData.email.trim(), authFormData.password);
        } else {
          throw err;
        }
      }

      if (data?.session) {
        // Force profile creation to ensure they exist in user_profiles now
        const userObj: User = {
          id: data.session.user.id,
          name: authFormData.name.trim(),
          email: authFormData.email.trim(),
          phone: authFormData.phone.trim() ? `${phoneCountry}${authFormData.phone.trim()}` : '',
          favorites: [],
          shoppingList: [],
          joinedDate: new Date().toLocaleDateString(),
          settings: { darkMode: isDark, language: 'fr', unitSystem: 'metric' }
        };
        await dbService.syncUserToCloud(userObj);
        setCurrentUser(userObj);
        dbService.setCurrentUser(userObj);

        showAlert("Compte récupéré et activé ! Bienvenue.", "success");
        setAuthStep('form');
        setAuthFormData({ name: '', email: '', password: '', phone: '' });
      } else {
        showAlert("Activation réussie ! Connectez-vous maintenant.", "success");
        setAuthMode('login');
        setAuthStep('form');
        setAuthFormData(prev => ({ ...prev, password: '' }));
      }
    } catch (err: any) {
      setAuthError(err.message || "Erreur lors de l'inscription finale.");
      showAlert("Échec de la création", "error");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      setSentOtp(otp);
      const success = await dbService.sendEmail(authFormData.email.trim(), authFormData.name.trim(), otp);
      if (success) {
        showAlert("Un nouveau code a été envoyé.", "success");
      } else {
        throw new Error("Échec du renvoi.");
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await dbService.signInWithGoogle();
      // The page will redirect to Google — no further action needed here
    } catch (err: any) {
      setAuthError(err.message || "Erreur lors de la connexion avec Google.");
      setIsAuthLoading(false);
    }
  };

  const handleFacebookAuth = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await dbService.signInWithFacebook();
      // The page will redirect to Facebook — no further action needed here
    } catch (err: any) {
      setAuthError(err.message || "Erreur lors de la connexion avec Facebook.");
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
    if (updatedUser) {
      setCurrentUser({ ...updatedUser });
      // Sync to cloud for persistence
      dbService.syncUserToCloud(updatedUser);
    }
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

  // Home hero carousel auto-play
  const heroRecipeCount = Math.min(featuredRecipes.length, 5);
  useEffect(() => {
    if (activeTab !== 'home' || selectedRecipe || heroRecipeCount <= 1) return;
    const timer = setInterval(() => {
      setHomeCarouselIndex(prev => (prev + 1) % heroRecipeCount);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeTab, selectedRecipe, heroRecipeCount]);

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
      if (!currentUser) {
        metaThemeColor.setAttribute('content', isDark ? '#000000' : '#fafaf9');
      } else {
        metaThemeColor.setAttribute('content', isDark ? '#000000' : '#f3f4f6');
      }
    }

    // 3. Update Android status bar via Capacitor StatusBar plugin
    if (Capacitor.isNativePlatform()) {
      const applyStatusBar = async () => {
        try {
          // On active l'overlay pour que le CSS env(safe-area-inset-top) calcule la status bar
          await StatusBar.setOverlaysWebView({ overlay: true });
          if (isDark) {
            await StatusBar.setStyle({ style: Style.Dark });
          } else {
            // Style.Light = icônes sombres pour fond clair
            await StatusBar.setStyle({ style: Style.Light });
          }
        } catch (error) {
          console.error('StatusBar error:', error);
        }
      };
      applyStatusBar();
    }
  }, [isDark, currentUser]);

  const navItems = [
    { id: 'home', iconId: 'home', label: t.home },
    { id: 'search', iconId: 'search', label: t.explorer },
    { id: 'favs', iconId: 'favs', label: t.favorites },
    { id: 'cart', iconId: 'cart', label: t.shoppingList },
    { id: 'profile', iconId: 'profile', label: t.profile },
  ];

  // --- Sub-Renderers (extracted for clarity) ---

  const renderHome = () => {
    const suggestions = featuredRecipes.slice(0, 5);
    const populaires = otherRecipes.slice(0, 10);

    return (
      <PullToRefresh onRefresh={refreshHome} isDark={isDark}>
        <div className="flex-1 flex flex-col pb-44" style={{
          background: isDark ? '#000000ff' : '#f3f4f6',
          minHeight: '100vh',
        }}>
          {/* Top bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 12px)' : '24px',
            position: 'sticky',
            top: 0,
            background: isDark ? '#000000ff' : '#f3f4f6',
            zIndex: 100,
            backdropFilter: 'blur(20px)',
            borderBottom: isDark ? '1px solid #ffffff10' : '1px solid #00000005'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/icon.png" alt="AfroCuisto Logo" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }} />
              <span style={{ fontSize: '22px', fontWeight: 900, color: isDark ? '#ffffff' : '#111827', letterSpacing: '-0.02em' }}>AfroCuisto</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {isOffline && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <WifiOff size={16} style={{ color: '#ef4444' }} />
                </motion.div>
              )}
              {isSyncing && !isOffline && (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                  <Wifi size={14} style={{ color: '#fb5607' }} />
                </motion.div>
              )}
              <button onClick={() => setIsNotifCenterOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, position: 'relative' }}>
                <Bell size={24} style={{ color: isDark ? '#ffffff' : '#111827' }} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, background: '#F94D00', color: '#fff', fontSize: 10, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${isDark ? '#000' : '#f3f4f6'}` }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button onClick={() => setIsSearchExpanded(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                <Search size={24} style={{ color: isDark ? '#ffffff' : '#111827' }} />
              </button>
            </div>
          </div>












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
            } else if (section.type === 'advertising') {
              const productIds = section.config?.merchant_ids || section.merchant_ids || [];
              sectionRecipes = allProducts.filter(p => productIds.includes(p.id));
            } else {
              // Default to manual selection or 'query' (backwards compatibility)
              sectionRecipes = allRecipes.filter(r => section.recipe_ids?.includes(r.id));
            }

            // Apply limit only if explicitly configured — default to 200 to show all selected recipes
            sectionRecipes = sectionRecipes.slice(0, section.config?.limit || 200);

            if (sectionRecipes.length === 0) return null;

            if (section.type === 'dynamic_carousel' || section.type === 'featured' || section.type === 'banner' || section.type === 'advertising') {
              return (
                <FeaturedCarousel
                  key={section.id}
                  section={section}
                  recipes={section.type === 'advertising' ? [] : sectionRecipes}
                  merchants={allMerchants}
                  products={section.type === 'advertising' ? sectionRecipes : allProducts}
                  setSelectedRecipe={setSelectedRecipe}
                  currentUser={currentUser}
                  toggleFavorite={toggleFavorite}
                  isDark={isDark}
                />
              );
            }
            if (section.type === 'horizontal_list_v2') {
              return (
                <section key={section.id} className="mb-2">
                  {/* Section header */}
                  <div className="px-8 flex justify-between items-end mb-1">
                    <div className="flex flex-col">
                      <h2 style={{ paddingTop: '0px' }} className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                      {section.subtitle && <p className="text-[10px] text-stone-400 font-bold tracking-widest mt-1">{section.subtitle}</p>}
                    </div>
                  </div>

                  {/* Horizontal scroll tray v2 — styled like 'Nos suggestions' */}
                  <div style={{ display: 'flex', overflowX: 'auto', gap: '45px', paddingBottom: '30px', paddingRight: '40px', paddingLeft: '32px', paddingTop: '10px' }} className="no-scrollbar">
                    {sectionRecipes.map((recipe) => {
                      const isFav = currentUser?.favorites?.includes(recipe.id) ?? false;
                      return (
                        <motion.div
                          key={recipe.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedRecipe(recipe)}
                          style={{
                            minWidth: '280px', height: '150px',
                            background: isDark ? '#111111' : '#ffffff',
                            borderRadius: '24px',
                            borderWidth: '1px',
                            borderColor: '#ffffff15',
                            padding: '24px 110px 24px 24px',
                            position: 'relative',
                            boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 1)' : '0 12px 30px rgba(0,0,0,0.06)',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#ffffff' : '#111827', margin: '0 0 12px', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{recipe.name}</h3>

                          {/* Pilules d'informations (Région & Temps) */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '5px 12px', borderRadius: '50px',
                                backgroundColor: isDark ? 'rgba(251, 86, 7, 0.15)' : 'rgba(251, 86, 7, 0.08)',
                                color: '#fb5607', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                                border: isDark ? '1px solid rgba(251, 86, 7, 0.3)' : '1px solid rgba(251, 86, 7, 0.2)'
                              }}>
                                {recipe.region || "Chef"}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '5px 12px', borderRadius: '50px',
                                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                color: isDark ? '#e5e7eb' : '#4b5563', fontSize: '11px', fontWeight: 800,
                                border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb'
                              }}>
                                <Clock size={12} strokeWidth={2.5} className="mb-[1px]" />
                                {recipe.prepTime}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                                style={{
                                  width: 28, height: 28, borderRadius: '50%',
                                  background: isFav ? '#ef4444' : (isDark ? '#374151' : '#f3f4f6'),
                                  border: 'none',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', flexShrink: 0
                                }}
                              >
                                <Heart size={14} style={{ color: isFav ? '#fff' : (isDark ? '#9ca3af' : '#6b7280'), fill: isFav ? '#fff' : 'none' }} strokeWidth={isFav ? 0 : 2.5} />
                              </button>
                            </div>
                          </div>

                          {/* Circular overflowing image */}
                          <div style={{
                            position: 'absolute', right: '-35px', top: '50%', transform: 'translateY(-50%)',
                            width: '130px', height: '130px', borderRadius: '50%',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.25)', backgroundColor: '#ddd',
                            overflow: 'hidden', border: isDark ? '6px solid #1f2937' : '6px solid #ffffff'
                          }}>
                            <img src={recipe.image} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <section key={section.id} className="mb-1">
                  {/* Section header */}
                  <div className="px-8 flex justify-between items-end mb-1">
                    <div className="flex flex-col">
                      <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                      {section.subtitle && <p className="text-[10px] text-stone-400 font-bold  tracking-widest mt-1">{section.subtitle}</p>}
                    </div>

                  </div>

                  {/* Horizontal scroll tray — styled like 'Recettes Populaires' */}
                  <div style={{ display: 'flex', overflowX: 'auto', gap: '24px', paddingBottom: '40px', paddingTop: '68px', paddingLeft: '32px', paddingRight: '32px' }} className="no-scrollbar">
                    {sectionRecipes.map((recipe, ridx) => {
                      const isFav = currentUser?.favorites?.includes(recipe.id) ?? false;
                      return (
                        <motion.div
                          key={recipe.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedRecipe(recipe)}
                          style={{
                            minWidth: '170px', width: '170px',
                            background: isDark ? '#111111' : '#ffffff',
                            borderRadius: '28px',
                            borderWidth: '1px',
                            borderColor: '#ffffff15',
                            padding: '85px 20px 20px',
                            position: 'relative',
                            boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.3)' : '0 12px 30px rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            flexShrink: 0,
                            display: 'flex', flexDirection: 'column'
                          }}
                        >
                          {/* Top overflowing circular image */}
                          <div style={{
                            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
                            width: '130px', height: '130px', borderRadius: '50%',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.2)', backgroundColor: '#ddd',
                            overflow: 'hidden', border: isDark ? '6px solid #1f2937' : '6px solid #ffffff'
                          }}>
                            <img src={recipe.image} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>

                          {/* Region / Category Badge */}
                          <div style={{
                            position: 'absolute', top: '56px', left: '50%', transform: 'translateX(-50%)',
                            background: '#fb5607', color: '#fff',
                            padding: '3px 10px', borderRadius: '12px',
                            fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            boxShadow: '0 2px 8px rgba(251,86,7,0.4)',
                            zIndex: 10,
                            whiteSpace: 'nowrap'
                          }}>
                            {recipe.region || recipe.category || 'Mets Local'}
                          </div>

                          <h3 style={{ fontSize: 17, fontWeight: 600, color: isDark ? '#f3f4f6' : '#000000ff', margin: '0 0 10px', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {recipe.name}
                          </h3>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                            <span style={{ fontSize: 13, fontWeight: 900, color: isDark ? '#ffffff' : '#111827' }}>
                              {recipe.prepTime ? `${recipe.prepTime} min` : '30 min'}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                              style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: isFav ? '#ef4444' : (isDark ? '#374151' : '#111827'),
                                border: 'none', color: '#ffffff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', flexShrink: 0
                              }}
                            >
                              <Heart size={18} style={{ color: isFav ? '#fff' : '#fff', fill: isFav ? '#fff' : 'none' }} strokeWidth={isFav ? 0 : 2} />
                            </button>
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
                  <div className="px-8 flex justify-between items-end mb-4">
                    <div className="flex flex-col">
                      <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                      {section.subtitle && <p className="text-[10px] text-stone-400 font-bold tracking-widest mt-1">{section.subtitle}</p>}
                    </div>
                  </div>

                  {/* Zone Grille — alignement avec le header */}
                  <div className="px-8 grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
                                color: isDark ? '#ffffff' : '#1a1a1a',
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
                <div className="px-8 flex justify-between items-end mb-4">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                    {section.subtitle && <p className="text-[10px] text-stone-400 font-bold tracking-widest mt-1">{section.subtitle}</p>}
                  </div>
                </div>
                <div className="px-8 flex flex-col gap-3">
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
                          {/* Rating + region + difficulty */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                            <Star size={11} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{ratingNum}</span>
                            <span style={{ fontSize: '10px', color: '#d1d5db' }}>·</span>
                            <span style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px' }}>
                              {recipe.region || recipe.category || 'Africain'}
                            </span>
                            <span style={{ fontSize: '10px', color: '#d1d5db' }}>·</span>
                            <DifficultyBadge difficulty={recipe.difficulty} t={t} />
                          </div>
                        </div>

                        {/* Right: chevron only */}
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
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
      </PullToRefresh>
    );
  };

  const renderExplorer = () => (
    <div className="flex-1 flex flex-col pb-44">
      {/* Immersive Search Header -> Now using Home page style button */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 12px)' : '24px',
        position: 'sticky',
        top: 0,
        background: isDark ? '#000000ff' : '#f3f4f6',
        zIndex: 50,
        backdropFilter: 'blur(20px)',
        borderBottom: isDark ? '1px solid #ffffff10' : '1px solid #00000005'
      }}>
        <h1 className={`text-2xl font-black shrink-0 ${isDark ? 'text-white' : 'text-stone-900'} tracking-tight`}>
          {selectedCategory || t.explorer}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {isOffline && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-rose-500">
              <WifiOff size={22} />
            </motion.div>
          )}
          {isSyncing && !isOffline && (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
              <Wifi size={14} style={{ color: '#fb5607' }} />
            </motion.div>
          )}
          <button onClick={() => setIsSearchExpanded(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Search size={24} style={{ color: isDark ? '#ffffff' : '#111827' }} />
          </button>
        </div>
      </header>

      {/* Dynamic Content Area */}
      {
        searchQuery || selectedCategory ? (
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
              } else if (section.type === 'advertising') {
                const productIds = section.config?.merchant_ids || section.merchant_ids || [];
                sectionRecipes = allProducts.filter(p => productIds.includes(p.id));
              } else {
                sectionRecipes = allRecipes.filter(r => section.recipe_ids?.includes(r.id));
              }

              // Apply limit only if explicitly configured — default to 200 to show all selected recipes
              sectionRecipes = sectionRecipes.slice(0, section.config?.limit || 200);

              if (sectionRecipes.length === 0) return null;

              if (section.type === 'dynamic_carousel' || section.type === 'advertising' || section.type === 'banner' || section.type === 'featured') {
                return (
                  <FeaturedCarousel
                    key={section.id}
                    section={section}
                    recipes={section.type === 'advertising' ? [] : sectionRecipes}
                    merchants={allMerchants}
                    products={section.type === 'advertising' ? sectionRecipes : allProducts}
                    setSelectedRecipe={setSelectedRecipe}
                    currentUser={currentUser}
                    toggleFavorite={toggleFavorite}
                    isDark={isDark}
                  />
                );
              }
              if (section.type === 'horizontal_list_v2') {
                return (
                  <section key={section.id} className="mb-10">
                    {/* Section header */}
                    <div className="px-8 flex justify-between items-end mb-4">
                      <div className="flex flex-col">
                        <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                        {section.subtitle && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{section.subtitle}</p>}
                      </div>
                    </div>

                    {/* Horizontal scroll tray v2 — styled like 'Nos suggestions' */}
                    <div style={{ display: 'flex', overflowX: 'auto', gap: '45px', paddingBottom: '30px', paddingRight: '40px', paddingLeft: '32px' }} className="no-scrollbar">
                      {sectionRecipes.map((recipe) => (
                        <motion.div
                          key={recipe.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedRecipe(recipe)}
                          style={{
                            minWidth: '280px', height: '150px',
                            background: isDark ? '#1f2937' : '#ffffff',
                            borderRadius: '24px',
                            padding: '24px 110px 24px 24px',
                            position: 'relative',
                            boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.3)' : '0 12px 30px rgba(0,0,0,0.06)',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#ffffff' : '#111827', margin: '0 0 8px', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{recipe.name}</h3>
                          <p style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#9ca3af' : '#4b5563', margin: '0 0 16px' }}>
                            Spécialité <span style={{ fontWeight: 800, color: isDark ? '#e5e7eb' : '#1f2937' }}>{recipe.region || "Chef"}</span>
                          </p>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: 20, fontWeight: 900, color: isDark ? '#ffffff' : '#111827' }}>{recipe.prepTime}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#6b7280' : '#9ca3af', textDecoration: 'line-through' }}>{parseInt(recipe.prepTime) + 15} min</span>
                          </div>

                          {/* Circular overflowing image */}
                          <div style={{
                            position: 'absolute', right: '-35px', top: '50%', transform: 'translateY(-50%)',
                            width: '130px', height: '130px', borderRadius: '50%',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.25)', backgroundColor: '#ddd',
                            overflow: 'hidden', border: isDark ? '6px solid #1f2937' : '6px solid #ffffff'
                          }}>
                            <img src={recipe.image} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                );
              }

              if (section.type === 'horizontal_list') {
                return (
                  <section key={section.id} className="mb-10">
                    <div className="px-8 flex justify-between items-end mb-4">
                      <div className="flex flex-col">
                        <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                        {section.subtitle && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{section.subtitle}</p>}
                      </div>

                    </div>
                    <div className="flex gap-4 overflow-x-auto px-8 no-scrollbar pb-3">
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
                    <div className="px-8 flex justify-between items-end mb-4">
                      <div className="flex flex-col">
                        <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                        {section.subtitle && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{section.subtitle}</p>}
                      </div>
                    </div>
                    <div className="px-8 grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
                                <h3 className="hlist-card-title" style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.25, margin: '0 0 5px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: isDark ? '#ffffff' : '#1a1a1a' }}>{recipe.name}</h3>
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
                  <div className="px-8 flex justify-between items-end mb-4">
                    <div className="flex flex-col">
                      <h2 className="text-xl font-black text-stone-800 tracking-tight">{section.title}</h2>
                      {section.subtitle && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{section.subtitle}</p>}
                    </div>
                  </div>
                  <div className="px-8 flex flex-col gap-3">
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
                            <p className="hlist-card-title" style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 5px', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isDark ? '#ffffff' : '#1a1a1a' }}>
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
          </div >
        )
      }
    </div >
  );

  const renderFavorites = () => {
    const favoriteRecipes = dbService.getFavorites(currentUser!, allRecipes);

    return (
      <div className={`flex-1 flex flex-col pb-44 transition-colors ${isDark ? 'bg-black' : 'bg-[#f3f4f6]'}`}>
        <header
          className="px-6 pb-8 flex items-center justify-between"
          style={{ paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 16px)' : '24px' }}
        >
          <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>{t.favorites}</h1>
          {isOffline && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-rose-500">
              <WifiOff size={20} />
            </motion.div>
          )}
        </header>
        <div className="px-6 space-y-4">
          {favoriteRecipes.length > 0 ? (
            favoriteRecipes.map(recipe => (
              <div key={recipe.id} onClick={() => setSelectedRecipe(recipe)} className={`p-3 rounded-[28px] flex items-center gap-4 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.06)] border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-stone-100/50 shadow-stone-200/30'}`}>
                <img src={recipe.image} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-stone-800'}`}>{recipe.name}</h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className={`text-[10px] font-medium ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{recipe.region}</p>
                    <div className="flex items-center gap-1 text-[10px] text-[#fb5607] font-bold">
                      <Clock size={10} />
                      <span>{recipe.prepTime}</span>
                    </div>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); toggleFavorite(recipe.id); }} className="text-rose-500 p-2 active:scale-90 transition-transform">
                  <Heart size={20} fill="currentColor" />
                </button>
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
    <div className={`flex-1 flex flex-col pb-44 relative ${isDark ? 'bg-black' : 'bg-[#f3f4f6]'}`} style={{ paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 16px)' : '16px' }}>
      <AnimatePresence>
        {profileSubView && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={springTransition} className={`absolute inset-0 z-50 p-6 flex flex-col ${isDark ? 'bg-black' : 'bg-white'}`} style={{ paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 24px)' : '24px' }}>
            <header className="flex items-center justify-between mb-8 shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={() => setProfileSubView(null)} className="p-2 btn-back-circle bg-stone-50 rounded-full"><ChevronLeft size={20} /></button>
                <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>
                  {profileSubView === 'personalInfo' ? t.personalInfo :
                    profileSubView === 'security' ? t.security :
                      profileSubView === 'notifications' ? t.notifications :
                        profileSubView === 'shopping' ? "Ma liste de courses" :
                          profileSubView === 'about' ? t.about :
                            profileSubView === 'contribution' ? t.contribution :
                              t.settings}
                </h2>
              </div>
              {isOffline && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-rose-500 shrink-0">
                  <WifiOff size={20} />
                </motion.div>
              )}
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
                  isSyncing={isSyncing}
                  hasLoadedAtLeastOnce={hasLoadedAtLeastOnce}
                  showAlert={showAlert}
                  handleDeleteAccount={handleDeleteAccount}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className={`flex flex-col items-center py-10 ${isDark ? 'text-white' : ''}`}>
        <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden mb-4 bg-stone-100 flex items-center justify-center">
          <span className="text-3xl font-black text-terracotta tracking-tight">
            {getInitials(currentUser?.name)}
          </span>
        </div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-stone-800'}`}>{currentUser?.name}</h2>
        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-stone-500'}`}>{currentUser?.email}</p>

        {/* Cloud Connection Status + Refresh */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-stone-100 shadow-sm">
            <div className={`w-2 h-2 rounded-full animate-pulse ${dbService.supabase ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
              Cloud Sync: {dbService.supabase ? 'Activé' : 'Désactivé'}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.85, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => window.location.reload()}
            title="Actualiser les recettes"
            className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-sm transition-colors ${isDark ? 'bg-white/8 border-white/10' : 'bg-white border-stone-100'} ${isSyncing ? 'text-[#fb5607]' : (isDark ? 'text-white/40 hover:text-white/70' : 'text-stone-400 hover:text-stone-600')}`}
          >
            <RefreshCw size={14} strokeWidth={2.5} />
          </motion.button>
        </div>
      </header>

      <section className="px-6 space-y-3">
        <button onClick={() => setProfileSubView('personalInfo')} className={`w-full flex items-center justify-between p-5 rounded-[32px] border shadow-sm active:scale-95 transition-all ${isDark ? 'bg-[#111111] border-white/8 hover:bg-[#1a1a1a]' : 'bg-white border-stone-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/8 text-white/60' : 'bg-stone-50 text-stone-600'}`}>
              <UserIcon size={20} />
            </div>
            <span className={`font-black text-sm tracking-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>{t.personalInfo}</span>
          </div>
          <ChevronRight size={18} className={isDark ? 'text-white/25' : 'text-stone-300'} />
        </button>


        <button onClick={() => setProfileSubView('settings')} className={`w-full flex items-center justify-between p-5 rounded-[32px] border shadow-sm active:scale-95 transition-all ${isDark ? 'bg-[#111111] border-white/8 hover:bg-[#1a1a1a]' : 'bg-white border-stone-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/8 text-white/60' : 'bg-stone-50 text-stone-600'}`}>
              <Settings size={20} />
            </div>
            <span className={`font-black text-sm tracking-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>{t.settings}</span>
          </div>
          <ChevronRight size={18} className={isDark ? 'text-white/25' : 'text-stone-300'} />
        </button>

        <button onClick={() => setProfileSubView('contribution')} className={`w-full flex items-center justify-between p-5 rounded-[32px] border shadow-sm active:scale-95 transition-all ${isDark ? 'bg-[#111111] border-white/8 hover:bg-[#1a1a1a]' : 'bg-white border-stone-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/8 text-white/60' : 'bg-stone-50 text-stone-600'}`}>
              <Heart size={20} />
            </div>
            <span className={`font-black text-sm tracking-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>{t.contribution}</span>
          </div>
          <ChevronRight size={18} className={isDark ? 'text-white/25' : 'text-stone-300'} />
        </button>

        <button onClick={() => setProfileSubView('about')} className={`w-full flex items-center justify-between p-5 rounded-[32px] border shadow-sm active:scale-95 transition-all ${isDark ? 'bg-[#111111] border-white/8 hover:bg-[#1a1a1a]' : 'bg-white border-stone-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/8 text-white/60' : 'bg-stone-50 text-stone-600'}`}>
              <Info size={20} />
            </div>
            <span className={`font-black text-sm tracking-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>{t.about}</span>
          </div>
          <ChevronRight size={18} className={isDark ? 'text-white/25' : 'text-stone-300'} />
        </button>

        <a href="https://wa.me/+2290151455072" target="_blank" rel="noopener noreferrer" className={`w-full flex items-center justify-between p-5 rounded-[32px] border shadow-sm active:scale-95 transition-all outline-none ${isDark ? 'bg-[#111111] border-[#25D366]/20 hover:bg-[#1a1a1a]' : 'bg-white border-green-100/50 hover:bg-stone-50'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-[#25D366]/10 text-[#25D366]'}`}>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <span className={`font-black text-sm tracking-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>Contacter le support</span>
          </div>
          <ChevronRight size={18} className={isDark ? 'text-white/25' : 'text-stone-300'} />
        </a>


        <button onClick={handleLogout} className={`w-full flex items-center gap-3 p-4 rounded-3xl font-bold mt-6 ${isDark ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-600'}`}><LogOut size={20} /> {t.logout}</button>
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
      const [isAdded, setIsAdded] = useState(false);
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
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 30 }}
          transition={{ type: 'spring', damping: 26, stiffness: 380, mass: 0.8 }}
          style={{ willChange: 'transform, opacity' }}
          className={`absolute inset-0 z-[700] overflow-hidden w-full flex flex-col origin-bottom shadow-[0_-20px_60px_rgba(0,0,0,0.15)] ${isDark ? 'bg-[#000000]' : 'bg-white'}`}
        >
          <div className="absolute top-0 inset-x-0 z-[710] pointer-events-none p-6 pt-12">
            {/* Old top bar intentionally removed to allow the new layout */}
          </div>

          {/* Sticky floating menu (moved outside scroll view) */}
          <div className="absolute left-6 flex flex-col gap-3 z-[800] items-center p-2.5 rounded-full backdrop-blur-xl border transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.08)]" style={{
            top: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 12px)' : '32px',
            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.65)' : 'rgba(243, 244, 246, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'
          }}>
            <button onClick={goBack} className="w-[42px] h-[42px] bg-white rounded-full flex items-center justify-center text-[#fb5607] shadow-sm transition-transform active:scale-95 pointer-events-auto shrink-0">
              <ChevronLeft size={24} strokeWidth={2.5} className="mr-0.5" />
            </button>

            <button
              onClick={async () => {
                const shareData = {
                  title: `AfroCuisto - ${recipe.name}`,
                  text: `Découvrez la recette de ${recipe.name} sur AfroCuisto !`,
                  url: window.location.origin + `/?recipe=${recipe.id}`
                };
                try {
                  if (navigator.share) {
                    await navigator.share(shareData);
                  } else {
                    await navigator.clipboard.writeText(shareData.text + " " + shareData.url);
                    showAlertProp('Lien copié dans le presse-papiers !');
                  }
                } catch (err) {
                  console.log('Partage annulé ou erreur', err);
                }
              }}
              className="w-[42px] h-[42px] bg-white rounded-full flex items-center justify-center shadow-sm text-[#fb5607] transition-transform active:scale-95 pointer-events-auto shrink-0"
            >
              <Share2 size={18} strokeWidth={2.5} />
            </button>

          </div>

          <div ref={detailScrollRef} className={`flex-1 overflow-y-auto no-scrollbar relative min-h-0 bg-white transition-[padding] duration-300 ${selectedIngs.length > 0 ? 'pb-36' : 'pb-10'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
                style={{ willChange: 'transform, opacity' }}
                className="absolute inset-x-0 top-0"
              >
                <div className="relative h-[48vh] w-full shrink-0 overflow-hidden">
                  <div className="absolute inset-0 w-full h-full z-10 bg-stone-100">
                    <img src={recipe.image} className="w-full h-full object-cover" alt={recipe.name} />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/10 pointer-events-none"></div>
                  </div>

                </div>

                <div className="px-8 py-8 -mt-16 bg-white rounded-t-[40px] relative z-20 min-h-screen shadow-[0_-15px_40px_rgba(0,0,0,0.04)]">
                  <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-8"></div>

                  <h1 className="text-[26px] md:text-[32px] font-bold text-stone-800 leading-tight mb-4 pr-2">{recipe.name}</h1>

                  <p className="text-[14px] text-stone-400 font-medium leading-relaxed mb-8">
                    {recipe.description || 'Cette recette regorge de saveurs authentiques. Elle est rapide à préparer et parfaite pour se régaler simplement !'}
                  </p>

                  <h3 className="text-[17px] font-bold text-stone-400 mb-6">{t.nutrition || 'Nutrition Facts'}</h3>
                  <div className="grid grid-cols-4 gap-3 mb-10">
                    {[
                      { val: fakeCalories, label: 'Calories', sub: 'kcal' },
                      { val: fakeCarbs, label: 'Carbo', sub: 'g' },
                      { val: fakeProtein, label: 'Protein', sub: 'g' },
                      { val: fakeFat, label: 'Fat', sub: 'g' },
                    ].map((n, i) => (
                      <div key={i} className="bg-[#fb5607] rounded-[40px] flex flex-col items-center pt-2.5 pb-6 shadow-md shadow-orange-900/10">
                        <div className="w-[50px] h-[50px] md:w-[60px] md:h-[60px] bg-white rounded-full flex items-center justify-center font-bold text-[15px] md:text-[17px] text-[#fb5607] shadow-sm mb-4">
                          {n.val}
                        </div>
                        <span className="text-[12px] md:text-[13px] font-bold text-white">{n.label}</span>
                        <span className="text-[10px] md:text-[11px] font-bold text-white/80 mt-0.5">{n.sub}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[17px] font-bold text-stone-400 tracking-tight">{t.ingredients || 'Ingredients'}</h3>
                  </div>

                  <div className="space-y-2 mb-8">
                    {recipe.ingredients?.map((ing, i) => {
                      const isSelected = selectedIngs.includes(i);
                      return (
                        <div key={i} onClick={() => {
                          if (isSelected) setSelectedIngs(selectedIngs.filter(idx => idx !== i));
                          else setSelectedIngs([...selectedIngs, i]);
                        }} className="flex items-center gap-5 py-3 border-b border-stone-50 last:border-0 cursor-pointer group">
                          <div className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-xl transition-all duration-300 shadow-sm ${isSelected ? 'bg-[#fb5607] text-white shadow-lg shadow-[#fb5607]/20 scale-105 rotate-3' : 'bg-[#fff8f3] grayscale group-hover:grayscale-0'}`}>
                            {isSelected ? <Check size={20} strokeWidth={3} /> : '🍲'}
                          </div>
                          <div className="flex-1">
                            <p className="text-[15px] font-bold text-stone-800">{ing.item}</p>
                          </div>
                          <span className="text-[13px] font-bold text-stone-400">{ing.amount}</span>
                        </div>
                      )
                    })}
                  </div>


                  <div className="h-px bg-stone-100 my-8" />

                  <h3 className="text-[17px] font-bold text-stone-400 mb-5">{t.preparation || 'Preparation'}</h3>
                  <div className="space-y-4 mb-10">
                    {recipe.steps?.map((step: string, i: number) => {
                      const Comp = PreparationStep as any;
                      return <Comp key={`${recipe.id}-step-${i}`} step={step} index={i} recipeId={recipe.id} />;
                    })}
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
                      loading="lazy"
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

          <AnimatePresence>
            {selectedIngs.length > 0 && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className={`absolute bottom-0 inset-x-0 p-6 pb-10 flex items-center gap-4 z-[850] ${isDark ? 'bg-black/80 backdrop-blur-xl' : 'bg-white/90 backdrop-blur-xl border-t border-stone-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]'}`}
              >
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
                    setIsAdded(true);
                    setTimeout(() => {
                      setIsAdded(false);
                      setSelectedIngs([]);
                    }, 1500);
                  }}
                  disabled={isAdded}
                  className={`w-full h-14 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${isAdded ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-[#fb5607] text-white shadow-[#fb5607]/20 active:scale-95'}`}
                >
                  {isAdded ? (
                    <>
                      <Check size={20} className="text-white" strokeWidth={3} />
                      <span>Ingrédients Ajoutés !</span>
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      <span>Ajouter à ma liste ({selectedIngs.length})</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    };
  }
  const RecipeDetail = RecipeDetailRef.current!;

  // Store ProductDetail in a ref so its identity is stable
  const ProductDetailRef = useRef<React.FC<any>>(null);
  if (!ProductDetailRef.current) {
    ProductDetailRef.current = ({
      product,
      goBack,
      isDark,
      updateShoppingList,
      showAlert: showAlertProp,
      allMerchants,
      currentUser
    }: {
      product: Product;
      goBack: () => void;
      isDark: boolean;
      updateShoppingList: (nl: any[]) => void;
      showAlert: (msg: string, type?: any) => void;
      allMerchants: any[];
      currentUser: User | null;
    }) => {
      const [qty, setQty] = useState(1);
      const merchantName = product.merchant_id
        ? (allMerchants.find((m: any) => m.id === product.merchant_id)?.name || product.brand)
        : product.brand;
      const [isAdded, setIsAdded] = useState(false);

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 30 }}
          transition={{ type: 'spring', damping: 26, stiffness: 380, mass: 0.8 }}
          className={`absolute inset-0 z-[700] overflow-hidden w-full flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.15)] ${isDark ? 'bg-[#000000]' : 'bg-[#F9F9F9]'}`}
        >
          {/* Floating Back Button - Style matched with RecipeDetail */}
          <div className="absolute left-6 flex flex-col gap-3 z-[800] items-center p-2.5 rounded-full backdrop-blur-xl border transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.08)]" style={{
            top: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 12px)' : '32px',
            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.65)' : 'rgba(243, 244, 246, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'
          }}>
            <button
              onClick={goBack}
              className="w-[42px] h-[42px] bg-white rounded-full flex items-center justify-center text-[#38b000] shadow-sm transition-transform active:scale-95"
            >
              <ChevronLeft size={24} strokeWidth={2.5} className="mr-0.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
            {/* Header Image */}
            <div className="relative h-[48vh] w-full shrink-0 overflow-hidden bg-stone-100">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[120px] bg-stone-50">
                  {product.emoji || '📦'}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10 pointer-events-none" />
            </div>

            {/* Overlapping Content Area */}
            <div className={`px-8 pt-8 pb-12 -mt-16 rounded-t-[40px] relative z-20 shadow-[0_-15px_40px_rgba(0,0,0,0.04)] ${isDark ? 'bg-black' : 'bg-white'}`}>
              <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-8" />

              <div className="flex items-center justify-between gap-4">
                <h1 className={`text-[28px] font-black leading-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  {product.name}
                </h1>
                {currentUser?.shoppingList.some(i => i.id.startsWith(`store_${product.id}`)) && (
                  <span className="shrink-0 px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black rounded-full border border-orange-500/20 uppercase">
                    Dans la liste
                  </span>
                )}
              </div>
              <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                {merchantName}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-1.5 mt-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={s <= (product.rating || 4) ? 'fill-[#70e000] text-[#70e000]' : 'text-stone-200'}
                    />
                  ))}
                </div>
                <span className={`text-[11px] font-bold ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                  ({product.reviews_count || 12} reviews)
                </span>
              </div>

              {/* Controls & Price */}
              <div className="flex items-center justify-between mt-8">
                <div className={`flex items-center gap-6 p-2 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-stone-200 shadow-sm'}`}>
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xl active:scale-90 transition-all ${isDark ? 'text-white' : 'text-stone-800'}`}
                  >
                    -
                  </button>
                  <span className={`text-base font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xl active:scale-90 transition-all ${isDark ? 'text-white' : 'text-stone-800'}`}
                  >
                    +
                  </button>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className={`text-[26px] font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    {(product.price * qty).toLocaleString()}
                  </span>
                  <span className={`text-xs font-bold ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                    XOF
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mt-10">
                <h3 className={`text-base font-black mb-3 ${isDark ? 'text-white' : 'text-stone-800'}`}>
                  Description
                </h3>
                <p className={`text-[13px] leading-relaxed font-medium ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                  {product.description || "Un produit de qualité supérieure sélectionné avec soin par nos partenaires pour garantir fraîcheur et saveur authentique à chaque bouchée."}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className={`absolute bottom-0 inset-x-0 p-6 pb-10 flex items-center gap-4 z-50 ${isDark ? 'bg-[#000000]/80 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl border-t border-stone-100'}`}>
            <button
              onClick={() => {
                const newItem = {
                  id: `store_${product.id}_${Date.now()}`,
                  item: product.name,
                  amount: String(qty),
                  quantity: String(qty),
                  unit: product.unit,
                  priceXOF: String(product.price * qty),
                  isPurchased: false,
                  recipeName: merchantName
                };
                updateShoppingList([...(currentUser?.shoppingList || []), newItem]);
                setIsAdded(true);
                setTimeout(() => {
                  setIsAdded(false);
                  goBack();
                }, 1200);
              }}
              disabled={isAdded}
              className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all ${isAdded ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-[#38b000] shadow-[#38b000]/20'} shadow-lg`}
            >
              {isAdded ? (
                <>
                  <Check size={20} className="text-white" />
                  <span className="text-white font-black text-sm uppercase tracking-widest">Produit Ajouté !</span>
                </>
              ) : (
                <>
                  <Plus size={20} className="text-white" />
                  <span className="text-white font-black text-sm uppercase tracking-widest">Ma liste de course</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      );
    };
  }
  const ProductDetail = ProductDetailRef.current!;

  // --- Cart Overlay Logic ---
  const CartOverlayRef = useRef<React.FC<any>>(null);
  if (!CartOverlayRef.current) {
    CartOverlayRef.current = ({
      isDark,
      goBack,
      currentUser,
      updateShoppingList,
      showAlert,
      allProducts,
      allMerchants
    }: {
      isDark: boolean;
      goBack: () => void;
      currentUser: User | null;
      updateShoppingList: (nl: any[]) => void;
      showAlert: (msg: string, type?: any) => void;
      allProducts: Product[];
      allMerchants: any[];
    }) => {
      const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
      const [paymentMethod, setPaymentMethod] = useState<'cod' | 'momo' | 'card'>('momo');
      const [deliveryMode, setDeliveryMode] = useState<'auto' | 'manual'>('manual');
      const [locationText, setLocationText] = useState(currentUser?.address || 'Cotonou, Bénin');
      const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
      const [isLocating, setIsLocating] = useState(false);
      const [showMapPicker, setShowMapPicker] = useState(false);

      const handleAutoLocation = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              setCoords({ lat: latitude, lng: longitude });
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const data = await response.json();
              setLocationText(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
              setDeliveryMode('auto');
              showAlert("Position détectée !", "success");
            } catch (error) {
              showAlert("Impossible de récupérer l'adresse.", "error");
            } finally {
              setIsLocating(false);
            }
          }, (error) => {
            setIsLocating(false);
            showAlert("Accès à la position refusé.", "error");
          });
        } else {
          setIsLocating(false);
          showAlert("Géolocalisation non supportée.", "error");
        }
      };

      const cartItems = (currentUser?.shoppingList || []).filter(i => i.id.startsWith('store_') && i.isInCart);
      const subtotal = cartItems.reduce((acc, i) => acc + (parseFloat(i.priceXOF || '0') * (parseInt(i.quantity || '1'))), 0);
      const total = subtotal;

      const updateQty = (id: string, delta: number) => {
        const newList = (currentUser?.shoppingList || []).map(i => {
          if (i.id === id) {
            const currentQ = parseInt(i.quantity || '1');
            const newQ = Math.max(1, currentQ + delta);
            return { ...i, quantity: String(newQ) };
          }
          return i;
        });
        updateShoppingList(newList);
      };

      const handlePlaceOrder = async () => {
        try {
          const totalAmount = Math.round(total);
          console.log("Tentative de commande...", { totalAmount, paymentMethod, currentUser });

          if (totalAmount <= 0) {
            alert("Erreur: Le montant doit être supérieur à 0.");
            return;
          }

          // --- LOGIQUE CASH ON DELIVERY (COD) ---
          if (paymentMethod === 'cod') {
            setStep('success');
            if (currentUser) {
              await dbService.createOrder({
                user_id: currentUser.id,
                customer_name: currentUser.name,
                customer_email: currentUser.email,
                customer_phone: currentUser.phone || '',
                customer_address: locationText,
                items: cartItems,
                total_amount: totalAmount,
                status: 'pending',
                status_color: '#fb5607',
                payment_status: 'unpaid',
                payment_method: 'cod',
                delivery_coords: coords
              });

              const newList = (currentUser?.shoppingList || []).map(i => {
                if (i.id.startsWith('store_') && i.isInCart) {
                  return { ...i, isPurchased: true, isInCart: false };
                }
                return i;
              });
              updateShoppingList(newList);

              setTimeout(() => {
                goBack();
                showAlert("Commande enregistrée (Cash à la livraison) !", "success");
              }, 2000);
            }
            return;
          }

          // --- LOGIQUE FEDAPAY ---
          if (typeof (window as any).FedaPay === 'undefined') {
            alert("Erreur: Le script FedaPay n'est pas chargé. Veuillez vérifier votre connexion.");
            return;
          }

          const fp = (window as any).FedaPay;

          const config = {
            public_key: 'pk_sandbox_bNP8mCo0fgEzfNu6XILHxi-T',
            transaction: {
              amount: totalAmount,
              description: `Commande AfroCuisto - ${cartItems.length} articles`
            },
            currency: {
              iso: 'XOF'
            },
            customer: {
              email: currentUser?.email || 'client@afrocuisto.com',
              lastname: currentUser?.name || 'Client',
              firstname: 'AfroCuisto',
              phone_number: {
                number: currentUser?.phone || '',
                country: 'BJ'
              }
            },
            onComplete: async (resp: any) => {
              console.log("FedaPay onComplete:", resp);
              const status = resp.reason?.status || resp.status;
              if (status === 'approved' || status === 'captured' || resp.transaction) {
                setStep('success');

                // Enregistrer en DB via Supabase
                if (currentUser) {
                  await dbService.createOrder({
                    user_id: currentUser.id,
                    customer_name: currentUser.name,
                    customer_email: currentUser.email,
                    customer_phone: currentUser.phone || '',
                    customer_address: locationText,
                    items: cartItems,
                    total_amount: totalAmount,
                    status: 'pending',
                    payment_status: 'paid',
                    payment_method: paymentMethod,
                    delivery_coords: coords
                  });
                }

                const newList = (currentUser?.shoppingList || []).map(i => {
                  if (i.id.startsWith('store_') && i.isInCart) {
                    return { ...i, isPurchased: true, isInCart: false };
                  }
                  return i;
                });
                updateShoppingList(newList);

                setTimeout(() => {
                  goBack();
                  showAlert("Paiement réussi !", "success");
                }, 2000);
              }
            }
          };

          try {
            let checkoutInstance: any = null;
            if (fp.Checkout && typeof fp.Checkout.init === 'function') {
              checkoutInstance = fp.Checkout.init(config);
            } else if (typeof fp.init === 'function') {
              checkoutInstance = fp.init(config);
            }

            if (checkoutInstance && typeof checkoutInstance.open === 'function') {
              checkoutInstance.open();
            } else if (fp.Checkout && typeof fp.Checkout.open === 'function') {
              fp.Checkout.open();
            } else if (typeof fp.open === 'function') {
              fp.open();
            } else {
              throw new Error("Aucune méthode d'ouverture (open) trouvée dans le SDK FedaPay.");
            }
          } catch (e: any) {
            console.error("FedaPay Launch Error:", e);
            alert("Erreur d'ouverture FedaPay : " + e.message);
          }
        } catch (error: any) {
          alert("Erreur lors du lancement de la commande : " + error.message);
          console.error("Order Error:", error);
        }
      };

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 40 }}
          transition={{ type: 'spring', damping: 28, stiffness: 400, mass: 0.9 }}
          className={`absolute inset-0 z-[850] overflow-hidden w-full flex flex-col ${isDark ? 'bg-[#000000]' : 'bg-[#FFFFFF]'}`}
        >
          {/* Header Custom design */}
          <div className="px-6 pb-6 flex items-center justify-between" style={{ paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 24px)' : '48px' }}>
            <button onClick={goBack} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${isDark ? 'bg-white/5 text-white' : 'text-stone-800'}`}>
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <h2 className={`text-[20px] font-black ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>
              {step === 'cart' ? 'Mon Panier' : step === 'checkout' ? 'Paiement' : 'Terminé'}
            </h2>
            <div className="w-10" />
          </div>

          {step === 'success' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-8 shadow-xl">
                <Check size={48} strokeWidth={4} />
              </motion.div>
              <h3 className={`text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-stone-900'}`}>Génial !</h3>
              <p className="text-stone-400 font-medium">Votre commande est enregistrée.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-6">
                {cartItems.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-stone-50 flex items-center justify-center text-stone-200 mb-4">
                      <ShoppingBag size={32} />
                    </div>
                    <p className="text-stone-400 font-bold">Votre panier est vide</p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100/50">
                    {cartItems.map(item => {
                      const pID = item.id.split('_')[1];
                      const product = allProducts.find(p => p.id === pID);

                      return (
                        <div key={item.id} className="py-6 flex items-center gap-5">
                          <div className={`w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/5' : 'bg-[#F4F7F5]'}`}>
                            {product?.image_url ? (
                              <img src={product.image_url} alt={item.item} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-4xl">{product?.emoji || '📦'}</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-[16px] font-black truncate ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>{item.item}</h4>
                              <button
                                onClick={() => {
                                  const newList = (currentUser?.shoppingList || []).map(i =>
                                    i.id === item.id ? { ...i, isInCart: false } : i
                                  );
                                  updateShoppingList(newList);
                                }}
                                className="text-stone-300 hover:text-rose-500 transition-colors"
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                            <p className="text-[12px] font-bold text-[#8FAABB] mb-4">
                              {item.recipeName || 'Produit Store'}
                            </p>

                            <div className="flex items-center justify-between">
                              <span className={`text-[15px] font-black ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>
                                {parseFloat(item.priceXOF || '0').toLocaleString()} XOF
                              </span>

                              <div className={`flex items-center gap-4 px-2 py-1.5 rounded-full ${isDark ? 'bg-white/5' : 'bg-white border border-stone-100'}`}>
                                <button
                                  onClick={() => updateQty(item.id, -1)}
                                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${isDark ? 'bg-white/10 text-white' : 'bg-white border border-stone-100 text-stone-800 shadow-sm'}`}
                                >
                                  <Minus size={14} strokeWidth={3} />
                                </button>
                                <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQty(item.id, 1)}
                                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${isDark ? 'bg-white/10 text-white' : 'bg-[#D1EEDD] text-[#2D6A4F] shadow-sm'}`}
                                >
                                  <Plus size={14} strokeWidth={3} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {cartItems.length > 0 && (
                  <>
                    <div className="py-6 border-t border-stone-100/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-[12px] font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                          <MapPin size={14} className="text-[#F94D00]" /> Adresse de livraison
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAutoLocation}
                            className={`p-2 rounded-xl transition-all ${deliveryMode === 'auto' ? 'bg-[#F94D00] text-white' : (isDark ? 'bg-white/5 text-stone-400' : 'bg-stone-100 text-stone-500')}`}
                          >
                            {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                          </button>
                          <button
                            onClick={() => setDeliveryMode('manual')}
                            className={`p-2 rounded-xl transition-all ${deliveryMode === 'manual' ? 'bg-[#F94D00] text-white' : (isDark ? 'bg-white/5 text-stone-400' : 'bg-stone-100 text-stone-500')}`}
                          >
                            <Edit3 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className={`p-4 rounded-2xl border-2 transition-all ${isDark ? 'bg-white/5 border-white/5' : 'bg-stone-50 border-stone-100'}`}>
                        {deliveryMode === 'manual' ? (
                          <textarea
                            value={locationText}
                            onChange={(e) => setLocationText(e.target.value)}
                            placeholder="Entrez votre adresse ici..."
                            className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold resize-none h-16 text-stone-600 no-scrollbar"
                          />
                        ) : (
                          <div className="flex items-center gap-3 py-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                              <Check size={16} />
                            </div>
                            <span className="text-sm font-bold text-stone-500 line-clamp-2">{locationText}</span>
                          </div>
                        )}
                      </div>

                      {(coords || locationText) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-4 w-full h-44 rounded-3xl overflow-hidden border-2 border-stone-100/50 shadow-inner group relative"
                        >
                          <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            marginHeight={0}
                            marginWidth={0}
                            src={`https://maps.google.com/maps?q=${coords ? `${coords.lat},${coords.lng}` : encodeURIComponent(locationText)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                            className="transition-opacity duration-700 opacity-90 group-hover:opacity-100 pointer-events-none"
                          ></iframe>

                          {/* Overlay transparent pour bloquer la redirection Maps par défaut */}
                          <div
                            className="absolute inset-0 z-10 cursor-pointer bg-transparent"
                            onClick={() => setShowMapPicker(true)}
                          />

                          {/* Bouton d'agrandissement */}
                          <button
                            onClick={() => setShowMapPicker(true)}
                            className="absolute top-3 right-3 z-20 w-10 h-10 rounded-xl bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-[#F94D00] active:scale-90 transition-all border border-stone-100"
                          >
                            <Maximize2 size={20} />
                          </button>

                          <div className="absolute inset-0 pointer-events-none border-[6px] border-white/10 rounded-3xl" />
                        </motion.div>
                      )}
                    </div>

                    <div className="pt-2 pb-6 border-t border-dashed border-stone-200">
                      <h3 className={`text-[12px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                        <Wallet size={14} className="text-[#38b000]" /> Moyen de paiement
                      </h3>
                      <div className="flex flex-col gap-3">
                        <div
                          onClick={() => setPaymentMethod('momo')}
                          className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${paymentMethod === 'momo' ? 'border-[#38b000] bg-[#38b000]/5 shadow-sm' : (isDark ? 'border-white/5 bg-white/2' : 'border-stone-100 bg-stone-50/50')}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
                              <span className="text-[10px] font-black text-white">MoMo</span>
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[13px] font-black ${isDark ? 'text-white' : 'text-stone-800'}`}>Mobile Money</span>
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">MTN, Moov, Celtiis</span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'momo' ? 'bg-[#38b000] border-[#38b000]' : 'border-stone-200'}`}>
                            {paymentMethod === 'momo' && <Check size={10} className="text-white" strokeWidth={4} />}
                          </div>
                        </div>

                        <div
                          onClick={() => setPaymentMethod('card')}
                          className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${paymentMethod === 'card' ? 'border-[#38b000] bg-[#38b000]/5 shadow-sm' : (isDark ? 'border-white/5 bg-white/2' : 'border-stone-100 bg-stone-50/50')}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 text-white">
                              <CreditCard size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[13px] font-black ${isDark ? 'text-white' : 'text-stone-800'}`}>Carte Bancaire</span>
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">Visa, Mastercard</span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'bg-[#38b000] border-[#38b000]' : 'border-stone-200'}`}>
                            {paymentMethod === 'card' && <Check size={10} className="text-white" strokeWidth={4} />}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Paiement sécurisé par FedaPay</span>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-dashed border-stone-200 pb-12">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[14px] font-bold text-[#8FAABB]">Sous-total</span>
                        <span className={`text-[14px] font-bold ${isDark ? 'text-white/60' : 'text-stone-500'}`}>{subtotal.toLocaleString()} XOF</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[18px] font-black ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>Total</span>
                        <span className={`text-[18px] font-black ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>{total.toLocaleString()} XOF</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className={`p-6 pb-10 ${isDark ? 'bg-black' : 'bg-white shadow-[0_-20px_40px_rgba(0,0,0,0.02)]'}`}>
                  <button
                    onClick={handlePlaceOrder}
                    className="w-full h-16 bg-[#006837] text-white rounded-[50px] font-black text-sm uppercase tracking-[0.1em] shadow-xl shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    Valider la commande
                  </button>
                </div>
              )}
            </div>
          )}

          <AnimatePresence>
            {showMapPicker && (
              <MapPickerModal
                isOpen={showMapPicker}
                onClose={() => setShowMapPicker(false)}
                initialCoords={coords}
                isDark={isDark}
                onSelect={(nc: any, nt: string) => {
                  setCoords(nc);
                  setLocationText(nt);
                  setDeliveryMode('auto');
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      );
    };
  }
  const CartOverlay = CartOverlayRef.current!;


  // --- Shopping List Logic ---


  const renderShoppingList = () => {
    const list = currentUser?.shoppingList || [];
    const purchased = list.filter(i => i.isPurchased);
    const toBuy = list.filter(i => !i.isPurchased);
    const toBuyRecipe = toBuy.filter(i => !i.id.startsWith('store_'));
    const toBuyStore = toBuy.filter(i => i.id.startsWith('store_') && !i.isInCart);

    // Integrated Ads from CMS
    const shoppingAds = dynamicSections.filter((s: any) => s.type === 'advertising' && s.config?.page === 'shopping');

    const activeBanners = shoppingAds.length > 0
      ? shoppingAds.flatMap((s: any) => {
        const merchantIds = s.merchant_ids || s.config?.merchant_ids || [];
        if (merchantIds.length === 0) {
          return [{
            id: s.id,
            title: s.title,
            sub: s.subtitle,
            image_url: s.config?.image_url || '/logo_admin.png',
            bg: s.config?.background || 'linear-gradient(135deg, #fb5607 0%, #ff006e 100%)',
            tag: s.config?.tag || 'PROMO',
            isDynamic: true,
            section: s,
            buttonText: 'Boutique'
          }];
        }
        return merchantIds.map((pid: string) => {
          const slideConfig = s.config?.slides?.[pid] || {};
          const product = allProducts.find(p => p.id === pid);
          return {
            id: `${s.id}-${pid}`,
            title: slideConfig.title || s.title || product?.name || 'Offre Spéciale',
            sub: slideConfig.subtitle || s.subtitle || product?.category || 'Découvrez nos produits',
            image_url: product?.image_url || '/logo_admin.png',
            bg: slideConfig.background || s.config?.background || 'linear-gradient(135deg, #fb5607 0%, #ff006e 100%)',
            tag: slideConfig.tag || s.config?.tag || 'OFFRE',
            buttonText: slideConfig.button_text || 'Acheter',
            isDynamic: true,
            section: s,
            product: product
          };
        });
      })
      : SHOPPING_BANNERS;

    const banner = activeBanners[bannerIdx % activeBanners.length];

    const totalXOF = list.reduce((acc, i) => acc + (parseFloat(i.priceXOF ?? '0') || 0), 0);

    const filteredProducts = allProducts.filter(p => {
      const matchCat = selectedStoreCategory === 'Tout' || p.category === selectedStoreCategory;
      const matchSearch = !productSearchQuery || normalizeString(p.name).includes(normalizeString(productSearchQuery)) || normalizeString(p.brand || '').includes(normalizeString(productSearchQuery));
      return matchCat && matchSearch;
    });

    return (
      <div className={`flex-1 flex flex-col pb-44 ${isDark ? 'bg-[#000000]' : 'bg-[#f3f4f6]'}`} style={{ paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 8px)' : '8px' }}>

        {/* ── Promo Banner ── */}
        <div className="mx-4 mt-4 mb-2 rounded-[24px] overflow-hidden relative" style={{ background: banner.bg, minHeight: 150 }}>
          <div className="p-7 flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-[18px] bg-white text-3xl flex-shrink-0 backdrop-blur-sm overflow-hidden border-2 border-white/20">
              {banner.image_url ? (
                <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-stone-300">📦</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{banner.tag}</span>
              <p className="text-[16px] font-black text-white leading-tight">{banner.title}</p>
              <p className="text-[11px] font-semibold text-white/75 mt-0.5 truncate">{banner.sub}</p>
            </div>
            <button className="flex-shrink-0 bg-white/20 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full transition-all active:scale-95">
              {banner.buttonText || 'Boutique'}
            </button>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -right-2 bottom-0 w-14 h-14 rounded-full bg-white/05 pointer-events-none" />
          {/* Dots indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {activeBanners.map((_, i) => (
              <div key={i} className={`rounded-full transition-all ${i === (bannerIdx % activeBanners.length) ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
            ))}
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div className={`mx-4 mt-3 mb-0 flex gap-1 p-1 rounded-[40px] ${isDark ? 'bg-white/5' : 'bg-white/80'} backdrop-blur-sm`}>
          {[
            { key: 'store', label: 'Boutiques', count: null },
            { key: 'mylist', label: 'Liste de Course', count: list.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStoreTab(tab.key as any)}
              className={`flex-1 py-2.5 rounded-[40px] text-[12px] font-black transition-all flex items-center justify-center gap-1.5 ${storeTab === tab.key
                ? 'bg-[#38b000] text-white shadow-sm shadow-[#38b000]/30'
                : isDark ? 'text-white/50' : 'text-stone-500'
                }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${storeTab === tab.key ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ════════════ MA LISTE ════════════ */}
          {storeTab === 'mylist' && (
            <motion.div key="mylist" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.22 }}
              className="flex-1"
            >
              {/* Sub-header */}
              <div className="px-8 pt-7 pb-5 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-black text-stone-400 tracking-widest">{list.length} {t.ingredients}</p>
                  {totalXOF > 0 && <p className="text-[13px] font-black text-[#38b000]">≈ {totalXOF.toLocaleString()} XOF</p>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsOrdersOpen(true)}
                    className={`relative flex items-center justify-center w-[42px] h-[42px] rounded-full transition-all active:scale-95 shadow-md shadow-[#38b000]/10 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-stone-200 text-[#38b000]'}`}
                    title="Mes Commandes"
                  >
                    <ClipboardList size={20} />
                    {ordersCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white pointer-events-none">
                        {ordersCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className={`relative flex items-center justify-center w-[42px] h-[42px] rounded-full transition-all active:scale-95 shadow-md shadow-[#38b000]/10 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-stone-200 text-[#38b000]'}`}
                  >
                    <ShoppingBag size={20} />
                    {list.filter(i => i.isInCart).length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#38b000] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white pointer-events-none">
                        {list.filter(i => i.isInCart).length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowAddShoppingModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#38b000]/10 text-[#38b000] rounded-full active:scale-90 transition-all shadow-md shadow-[#111111]/10 border-[#38b000]/10 border-1"
                  >
                    <Plus size={16} strokeWidth={3} />
                    <span className="text-[11px] font-black uppercase tracking-wider">Créer</span>
                  </button>
                  {isOffline && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-rose-500">
                      <WifiOff size={20} />
                    </motion.div>

                  )}
                </div>
              </div>

              <div className="px-4 pb-4 space-y-8">
                {list.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-10">
                    <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center text-stone-300 mb-6 border-4 shadow-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-stone-100 border-white'}`}>
                      <ShoppingBag size={32} />
                    </div>
                    <h3 className={`text-lg font-black mb-2 ${isDark ? 'text-white' : 'text-stone-800'}`}>{t.noShoppingItems}</h3>
                    <p className="text-sm font-medium text-stone-400 leading-relaxed mb-8">{t.noShoppingItemsDesc}</p>
                    <button onClick={() => navigateTo('home')}
                      className="bg-[#38b000] text-white px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-[#38b000]/25 active:scale-95 transition-all"
                    >
                      {t.discover}
                    </button>
                  </div>
                ) : (
                  <>
                    {toBuyRecipe.length > 0 && (
                      <div className="space-y-3 pl-2 pr-2">
                        <h3 className="text-[10px] font-black uppercase text-[#38b000] tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38b000]" /> {t.toBuy}
                        </h3>
                        <div className="space-y-3">
                          {toBuyRecipe.map(item => (
                            <ShoppingItemRow
                              key={item.id}
                              item={item}
                              list={list}
                              updateShoppingList={updateShoppingList}
                              UNITS={SHOPPING_UNITS}
                              isDark={isDark}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {toBuyStore.length > 0 && (
                      <div className="space-y-3 pl-2 pr-2">
                        <h3 className="text-[10px] font-black uppercase text-[#38b000] tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38b000]" /> Articles du Store
                        </h3>
                        <div className="space-y-3">
                          {toBuyStore.map(item => (
                            <ShoppingItemRow
                              key={item.id}
                              item={item}
                              list={list}
                              updateShoppingList={updateShoppingList}
                              UNITS={SHOPPING_UNITS}
                              isSelected={selectedStoreItemIds.includes(item.id)}
                              onToggleSelection={(id) => {
                                setSelectedStoreItemIds(prev =>
                                  prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                                );
                              }}
                              isDark={isDark}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {purchased.filter(i => !i.id.startsWith('store_')).length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase text-[#38b000] tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38b000]" /> {t.purchased}
                        </h3>
                        <div className="space-y-3">
                          {purchased.filter(i => !i.id.startsWith('store_')).map(item => (
                            <ShoppingItemRow
                              key={item.id}
                              item={item}
                              dimmed
                              list={list}
                              updateShoppingList={updateShoppingList}
                              UNITS={SHOPPING_UNITS}
                              isDark={isDark}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add to Cart Floating Dock for Store Items */}
                    <AnimatePresence>
                      {selectedStoreItemIds.length > 0 && (
                        <motion.div
                          initial={{ y: 100, opacity: 0, scale: 0.9 }}
                          animate={{ y: 0, opacity: 1, scale: 1 }}
                          exit={{ y: 100, opacity: 0, scale: 0.9 }}
                          className="fixed bottom-[116px] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[400px] z-[600]"
                        >
                          <div className={`p-2.5 rounded-[30px] border flex items-center justify-between shadow-2xl ${isDark ? 'bg-black/80 border-white/10' : 'bg-white/90 border-stone-100'
                            } backdrop-blur-xl`}>
                            <div className="flex items-center gap-3.5 pl-3">
                              <div className="w-12 h-12 rounded-[20px] bg-[#38b000]/10 flex items-center justify-center text-[#38b000] relative">
                                <ShoppingBag size={22} />
                                <span className="absolute -top-1 -right-1 bg-[#38b000] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">
                                  {selectedStoreItemIds.length}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <p className={`text-[13px] font-black leading-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>Articles sélectionnés</p>
                                <p className="text-[10px] font-bold text-stone-400 tracking-wide uppercase">Prêt pour le panier</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const newList = list.map(i =>
                                  selectedStoreItemIds.includes(i.id) ? { ...i, isInCart: true } : i
                                );
                                updateShoppingList(newList);
                                setSelectedStoreItemIds([]);
                              }}
                              className="bg-[#38b000] text-white h-12 px-7 rounded-[20px] font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#38b000]/30 active:scale-95 transition-all flex items-center justify-center"
                            >
                              Confirmer
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button
                      onClick={() => { if (window.confirm(t.clearList + "?")) { updateShoppingList([]); } }}
                      className="w-full py-4 rounded-full border-2 border-stone-100 text-stone-400 font-black text-[10px] uppercase tracking-widest hover:bg-stone-50 hover:text-stone-600 transition-all active:scale-95 mt-4"
                    >
                      {t.clearList}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ════════════ STORE ════════════ */}
          {storeTab === 'store' && (
            <motion.div key="store" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}
              className="flex-1 pb-4"
            >
              {/* Search Bar */}
              <div className="px-5 pt-6 pb-4">
                <div className={`flex items-center gap-3 px-5 h-14 rounded-[50px] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-stone-100 shadow-sm'}`}>
                  <Search size={22} className="text-stone-300" />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="Rechercher des produits"
                    className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium placeholder:text-stone-300"
                  />
                  <button className="text-stone-400">
                  </button>
                </div>
              </div>

              {/* Enhanced Category Filter */}
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-6 px-5">
                {STORE_CATEGORIES.map(cat => {
                  const icons: Record<string, string> = {
                    'Tout': '🛍️',
                    'Épices': '🌶️',
                    'Boissons': '🥤',
                    'Huiles': '🫙',
                    'Féculents': '🌾',
                    'Légumes': '🥦',
                    'Viandes': '🥩',
                    'Poissons': '🐟'
                  };
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedStoreCategory(cat)}
                      className={`flex items-center gap-2.5 px-5 py-3 rounded-full whitespace-nowrap transition-all active:scale-95 ${selectedStoreCategory === cat
                        ? 'bg-[#38b000] text-white shadow-lg shadow-[#38b000]/20'
                        : isDark ? 'bg-white/5 text-white/60 border border-white/10' : 'bg-white text-stone-500 border border-stone-100 shadow-sm'
                        }`}
                    >
                      <span className="text-[18px]">{icons[cat] || '📦'}</span>
                      <span className="text-[14px] font-black">{cat}</span>
                    </button>
                  );
                })}
              </div>

              {/* Product Grid */}
              <div className="px-5 grid grid-cols-2 gap-4">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <StoreProductCard
                      key={product.id}
                      product={product}
                      list={list}
                      updateShoppingList={updateShoppingList}
                      isDark={isDark}
                      allMerchants={allMerchants}
                      setSelectedProduct={setSelectedProduct}
                    />
                  ))
                ) : (
                  <div className="col-span-2 py-20 text-center">
                    <div className={`w-20 h-20 mx-auto rounded-[32px] flex items-center justify-center mb-6 ${isDark ? 'bg-white/5' : 'bg-stone-50'}`}>
                      <ShoppingBag size={32} className="text-stone-300" />
                    </div>
                    <h3 className={`text-lg font-black mb-2 ${isDark ? 'text-white' : 'text-stone-800'}`}>Aucun produit</h3>
                    <p className="text-stone-400 text-sm font-medium px-12 leading-relaxed">
                      Nous n'avons trouvé aucun article correspondant à "{productSearchQuery}" dans cette catégorie.
                    </p>
                  </div>
                )}
              </div>

              {/* CTA more partners */}
              <div className="px-5 mt-8 mb-4">
                <div className={`p-6 rounded-[32px] text-center border-2 border-dashed ${isDark ? 'border-white/10' : 'border-stone-100'}`}>
                  <p className="text-[12px] font-black text-stone-300 uppercase tracking-widest">Plus de partenaires africains bientôt 🚀</p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        <ShoppingAddModal
          isOpen={showAddShoppingModal}
          onClose={() => setShowAddShoppingModal(false)}
          onAdd={(newItem: any) => updateShoppingList([...list, newItem])}
          isDark={isDark}
          t={t}
        />
      </div >
    );
  };




  const handleOtpDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digits = otpInput.split('');
    // Fill array to length 4
    while (digits.length < 4) digits.push('');
    digits[index] = value.slice(-1);
    const newOtp = digits.join('');
    setOtpInput(newOtp);
    setAuthError(null);
    if (value && index < 3) {
      otpRefs[index + 1]?.current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      otpRefs[index - 1]?.current?.focus();
    }
  };


  // ─── AUTH SCREEN ─────────────────────────────────────────────────────────
  const renderAuth = () => {

    // ── Social OAuth button ─────────────────────────────────────────────────
    const OAuthBtn = ({
      onClick, label, icon, color
    }: { onClick: () => void; label: string; icon: React.ReactNode; color?: string }) => (
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        disabled={isAuthLoading}
        aria-label={label}
        className={`flex-1 flex items-center justify-center gap-2.5 rounded-[14px] py-3.5 border font-bold text-[13px] transition-all disabled:opacity-60 ${isDark
          ? 'bg-white/5 border-white/10 hover:bg-white/9 text-white'
          : 'bg-white border-stone-200 hover:border-stone-300 shadow-sm text-stone-800'}`}
      >
        {icon}
        <span>{label}</span>
      </motion.button>
    );

    // ── Method mini-tab (Email | Téléphone) ──────────────────────────────────
    const MethodTab = ({ method, label }: { method: 'email' | 'phone'; label: string }) => (
      <button
        type="button"
        onClick={() => { setAuthMethod(method); setAuthError(null); setOtpInput(''); setAuthStep('form'); }}
        className={`flex-1 py-2 text-[12px] font-bold z-10 relative transition-colors rounded-[10px] ${authMethod === method
          ? (isDark ? 'text-white' : 'text-stone-900')
          : (isDark ? 'text-white/35' : 'text-stone-400')}`}
      >
        {label}
      </button>
    );

    return (
      <div className={`flex-1 flex flex-col min-h-screen relative overflow-hidden ${isDark ? 'bg-[#000000]' : 'bg-white'}`} style={{ isolation: 'isolate' }}>


        {/* ── Decorative circles ── repositionnés pour ne pas déborder dans la status bar */}
        <div className="absolute top-0 right-0 pointer-events-none select-none" style={{ width: 220, height: 220, overflow: 'hidden' }}>
          <div className="absolute rounded-full" style={{
            width: 220, height: 220, top: 10, right: -60,
            background: 'rgba(251,86,7,0.08)',
          }} />
          <div className="absolute rounded-full" style={{
            width: 110, height: 110, top: 20, right: -20,
            background: 'linear-gradient(135deg,#fb5607 0%,#e04e00 100%)',
            boxShadow: '0 8px 32px rgba(251,86,7,0.35)',
          }} />
        </div>
        <div className="absolute bottom-16 left-0 pointer-events-none select-none" style={{ width: 80, height: 80, overflow: 'hidden' }}>
          <div className="absolute rounded-full" style={{
            width: 80, height: 80, bottom: 0, left: -30, opacity: 0.7,
            background: 'linear-gradient(135deg,#fb5607 0%,#e04e00 100%)',
          }} />
        </div>

        {/* ── Scrollable content ── */}
        <div
          className="flex-1 flex flex-col overflow-y-auto no-scrollbar px-7 pb-10 w-full max-w-md mx-auto relative z-10"
          style={{ paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 32px)' : '56px' }}
        >

          {/* ── Brand / OTP header ── */}
          <AnimatePresence mode="wait">
            {authStep === 'form' ? (
              <motion.div key="brand" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.32 }} className="mb-6">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
                  className={`w-14 h-14 rounded-[16px] flex items-center justify-center mb-4 ${isDark ? 'bg-[#fb5607]/20 border border-[#fb5607]/30' : 'bg-[#fb5607]/10 border border-[#fb5607]/20'}`}>
                  <img src="/images/chef_icon_v2.png" className="w-9 h-9 object-contain" alt="AfroCuisto" />
                </motion.div>
                <h1 className={`text-[26px] font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  {authMode === 'login' ? 'Se connecter' : 'Créer un compte'}
                </h1>
                <p className={`text-[12.5px] font-medium mt-1.5 leading-snug ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                  {authMode === 'login'
                    ? 'Heureux de vous revoir, vous avez été manqué !'
                    : 'Renseignez vos informations pour rejoindre la communauté.'}
                </p>
              </motion.div>
            ) : (
              <motion.div key="otp-header" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.32 }} className="mb-6">
                <button
                  onClick={() => { setAuthStep('form'); setAuthError(null); setOtpInput(''); }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-5 border transition-colors ${isDark
                    ? 'bg-white/8 border-white/10 text-white/60 hover:bg-white/14'
                    : 'bg-stone-100 border-stone-200/60 text-stone-500 hover:bg-stone-200'}`}
                >
                  <ChevronLeft size={18} />
                </button>
                <h1 className={`text-[26px] font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  Vérifier le code
                </h1>
                <p className={`text-[12.5px] font-medium mt-1.5 leading-snug ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                  Entrez le code envoyé à <span className="text-[#fb5607] font-bold">{authFormData.email}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Main tab: Connexion / Inscription ── */}
          <AnimatePresence mode="wait">
            {authStep === 'form' && (
              <motion.div key="mode-tabs" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <div className={`p-1 rounded-[18px] flex mb-5 relative border ${isDark ? 'bg-white/5 border-white/8' : 'bg-stone-100 border-stone-200/50'}`}>
                  <motion.div
                    className={`absolute inset-1 rounded-[13px] z-0 ${isDark ? 'bg-white/12 border border-white/12' : 'bg-white border border-stone-100 shadow-sm'}`}
                    style={{ width: 'calc(50% - 4px)', left: authMode === 'login' ? 4 : 'auto', right: authMode === 'signup' ? 4 : 'auto' }}
                    layoutId="auth-main-tab"
                    transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                  />
                  {(['login', 'signup'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setAuthMode(mode); setAuthError(null); setOtpInput(''); }}
                      className={`flex-1 py-3 text-[13px] font-bold z-10 relative transition-colors rounded-[13px] ${authMode === mode
                        ? (isDark ? 'text-white' : 'text-stone-900')
                        : (isDark ? 'text-white/35' : 'text-stone-400')}`}
                    >
                      {mode === 'login' ? 'Connexion' : 'Inscription'}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── FORM AREA ── */}
          <AnimatePresence mode="wait">

            {/* ─── LOGIN FORM ─── */}
            {authMode === 'login' && authStep === 'form' && (
              <motion.div key="login-form" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
                <form onSubmit={handleLogin} className="space-y-4">

                  {/* Single identifier field: email OR phone */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                      Email ou téléphone
                    </label>
                    <div className="relative group">
                      <Mail size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#fb5607] ${isDark ? 'text-white/25' : 'text-stone-400'}`} />
                      <input
                        id="login-identifier"
                        type="text"
                        inputMode="email"
                        placeholder="Email ou Téléphone"
                        required
                        autoComplete="username"
                        value={authFormData.email}
                        onChange={e => { setAuthFormData({ ...authFormData, email: e.target.value }); setAuthError(null); }}
                        className={`w-full rounded-[14px] border py-3.5 pl-10 pr-4 text-[14px] font-semibold focus:outline-none transition-all ${isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#fb5607]/50 focus:bg-white/8'
                          : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-[#fb5607]/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(251,86,7,0.08)]'}`}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Mot de passe</label>
                    <div className="relative group">
                      <Lock size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#fb5607] ${isDark ? 'text-white/25' : 'text-stone-400'}`} />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        required
                        minLength={6}
                        autoComplete="current-password"
                        value={authFormData.password}
                        onChange={e => { setAuthFormData({ ...authFormData, password: e.target.value }); setAuthError(null); }}
                        className={`w-full rounded-[14px] border py-3.5 pl-10 pr-12 text-[14px] font-semibold focus:outline-none transition-all ${isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#fb5607]/50 focus:bg-white/8'
                          : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-[#fb5607]/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(251,86,7,0.08)]'}`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isDark ? 'text-white/25 hover:text-[#fb5607]' : 'text-stone-400 hover:text-[#fb5607]'}`}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <div className="flex justify-end mt-1.5">
                      <button type="button" className={`text-[11.5px] font-bold transition-colors ${isDark ? 'text-white/30 hover:text-[#fb5607]' : 'text-stone-400 hover:text-[#fb5607]'}`}>
                        Mot de passe oublié ?
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {authError && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className={`overflow-hidden rounded-[12px] border flex items-start gap-2.5 p-3 ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
                        <AlertCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                        <p className="text-[12px] font-semibold text-rose-600 leading-snug">{authError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CTA */}
                  <motion.button type="submit" disabled={isAuthLoading} whileTap={{ scale: 0.97 }}
                    className="w-full bg-[#fb5607] text-white py-4 rounded-[16px] font-black text-[14px] flex justify-center items-center gap-2 transition-all mt-1"
                    style={{ boxShadow: '0 10px 28px rgba(251,86,7,0.28)' }}>
                    {isAuthLoading
                      ? <><Loader size={18} className="animate-spin" /><span>Connexion…</span></>
                      : <span>Se connecter</span>}
                  </motion.button>

                  {/* Social divider */}
                  <div className="flex items-center gap-3 my-1">
                    <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : '#e7e5e4' }} />
                    <span className={`text-[11px] font-bold ${isDark ? 'text-white/25' : 'text-stone-400'}`}>Ou continuer avec</span>
                    <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : '#e7e5e4' }} />
                  </div>

                  {/* Google + Facebook */}
                  <div className="flex gap-3">
                    <OAuthBtn onClick={handleGoogleAuth} label="Google" icon={
                      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    } />
                    <OAuthBtn onClick={handleFacebookAuth} label="Facebook" icon={
                      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    } />
                  </div>

                  <p className={`text-center text-[12.5px] font-medium pt-1 ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
                    Pas encore de compte ?{' '}
                    <button type="button" onClick={() => { setAuthMode('signup'); setAuthError(null); }} className="text-[#fb5607] font-bold">S'inscrire</button>
                  </p>
                </form>
              </motion.div>
            )}

            {/* ─── SIGNUP FORM ─── */}
            {authMode === 'signup' && authStep === 'form' && (
              <motion.div key="signup-form" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
                <form onSubmit={handleSignup} className="space-y-4">

                  {/* Name (always) */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Nom complet</label>
                    <div className="relative group">
                      <UserIcon size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#fb5607] ${isDark ? 'text-white/25' : 'text-stone-400'}`} />
                      <input id="signup-name" type="text" placeholder="Jean Dupont" required minLength={2} autoComplete="name"
                        value={authFormData.name} onChange={e => { setAuthFormData({ ...authFormData, name: e.target.value }); setAuthError(null); }}
                        className={`w-full rounded-[14px] border py-3.5 pl-10 pr-4 text-[14px] font-semibold focus:outline-none transition-all ${isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#fb5607]/50 focus:bg-white/8'
                          : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-[#fb5607]/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(251,86,7,0.08)]'}`} />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Email</label>
                    <div className="relative group">
                      <Mail size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#fb5607] ${isDark ? 'text-white/25' : 'text-stone-400'}`} />
                      <input id="signup-email" type="email" placeholder="exemple@email.com" required autoComplete="email"
                        value={authFormData.email} onChange={e => { setAuthFormData({ ...authFormData, email: e.target.value }); setAuthError(null); }}
                        className={`w-full rounded-[14px] border py-3.5 pl-10 pr-4 text-[14px] font-semibold focus:outline-none transition-all ${isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#fb5607]/50 focus:bg-white/8'
                          : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-[#fb5607]/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(251,86,7,0.08)]'}`} />
                    </div>
                  </div>

                  {/* Phone (Optional, with country selector) */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Numéro de téléphone (optionnel)</label>
                    <div className="flex gap-2 relative group">
                      <div className="relative w-[110px] shrink-0">
                        <select
                          value={phoneCountry}
                          onChange={e => setPhoneCountry(e.target.value)}
                          className={`w-full appearance-none rounded-[14px] border py-3.5 pl-4 pr-8 text-[14px] font-semibold focus:outline-none transition-all ${isDark
                            ? 'bg-white/5 border-white/10 text-white focus:border-[#fb5607]/50'
                            : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-[#fb5607]/50 focus:shadow-[0_0_0_3px_rgba(251,86,7,0.08)]'}`}
                        >
                          <option value="+229">🇧🇯 +229</option>
                          <option value="+225">🇨🇮 +225</option>
                          <option value="+221">🇸🇳 +221</option>
                          <option value="+228">🇹🇬 +228</option>
                          <option value="+237">🇨🇲 +237</option>
                          <option value="+241">🇬🇦 +241</option>
                          <option value="+243">🇨🇩 +243</option>
                          <option value="+33">🇫🇷 +33</option>
                        </select>
                        <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-white/40' : 'text-stone-400'}`} />
                      </div>
                      <div className="relative flex-1">
                        <Phone size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#fb5607] ${isDark ? 'text-white/25' : 'text-stone-400'}`} />
                        <input id="signup-phone" type="tel" placeholder="01 23 45 67" autoComplete="tel-national"
                          value={authFormData.phone} onChange={e => { setAuthFormData({ ...authFormData, phone: e.target.value }); setAuthError(null); }}
                          className={`w-full rounded-[14px] border py-3.5 pl-10 pr-4 text-[14px] font-semibold focus:outline-none transition-all ${isDark
                            ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#fb5607]/50 focus:bg-white/8'
                            : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-[#fb5607]/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(251,86,7,0.08)]'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Mot de passe</label>
                    <div className="relative group">
                      <Lock size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#fb5607] ${isDark ? 'text-white/25' : 'text-stone-400'}`} />
                      <input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" required minLength={6} autoComplete="new-password"
                        value={authFormData.password} onChange={e => { setAuthFormData({ ...authFormData, password: e.target.value }); setAuthError(null); }}
                        className={`w-full rounded-[14px] border py-3.5 pl-10 pr-12 text-[14px] font-semibold focus:outline-none transition-all ${isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#fb5607]/50 focus:bg-white/8'
                          : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-[#fb5607]/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(251,86,7,0.08)]'}`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isDark ? 'text-white/25 hover:text-[#fb5607]' : 'text-stone-400 hover:text-[#fb5607]'}`}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {authError && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className={`overflow-hidden rounded-[12px] border flex items-start gap-2.5 p-3 ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
                        <AlertCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                        <p className="text-[12px] font-semibold text-rose-600 leading-snug">{authError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CTA */}
                  <motion.button type="submit" disabled={isAuthLoading} whileTap={{ scale: 0.97 }}
                    className="w-full bg-[#fb5607] text-white py-4 rounded-[16px] font-black text-[14px] flex justify-center items-center gap-2 transition-all mt-1"
                    style={{ boxShadow: '0 10px 28px rgba(251,86,7,0.28)' }}>
                    {isAuthLoading
                      ? <><Loader size={18} className="animate-spin" /><span>Envoi en cours…</span></>
                      : <span>S'inscrire</span>}
                  </motion.button>

                  {/* Social divider */}
                  <div className="flex items-center gap-3 my-1">
                    <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : '#e7e5e4' }} />
                    <span className={`text-[11px] font-bold ${isDark ? 'text-white/25' : 'text-stone-400'}`}>Ou s'inscrire avec</span>
                    <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : '#e7e5e4' }} />
                  </div>

                  {/* Google + Facebook */}
                  <div className="flex gap-3">
                    <OAuthBtn onClick={handleGoogleAuth} label="Google" icon={
                      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    } />
                    <OAuthBtn onClick={handleFacebookAuth} label="Facebook" icon={
                      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    } />
                  </div>

                  <p className={`text-center text-[12.5px] font-medium pt-1 ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
                    Déjà un compte ?{' '}
                    <button type="button" onClick={() => { setAuthMode('login'); setAuthError(null); }} className="text-[#fb5607] font-bold">Se connecter</button>
                  </p>
                </form>
              </motion.div>
            )}

            {/* ─── OTP STEP ─── */}
            {authStep === 'otp' && (
              <motion.div key="otp-step" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 28 }} transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
                <form onSubmit={handleVerifyOtp}>
                  {/* 4 OTP boxes */}
                  <div className="flex gap-3 justify-center mb-6">
                    {[0, 1, 2, 3].map(i => (
                      <input
                        key={i} ref={otpRefs[i]} type="text" inputMode="numeric" maxLength={1}
                        value={otpInput[i] || ''}
                        onChange={e => handleOtpDigitChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        onFocus={e => e.target.select()}
                        className={`w-[62px] h-[70px] text-center text-[28px] font-black rounded-[16px] border-2 focus:outline-none transition-all ${otpInput[i]
                          ? (isDark ? 'border-[#fb5607]/70 bg-[#fb5607]/15 text-white' : 'border-[#fb5607] bg-[#fb5607]/8 text-stone-900')
                          : (isDark ? 'border-white/12 bg-white/5 text-white focus:border-[#fb5607]/50' : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-[#fb5607]/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(251,86,7,0.10)]')}`}
                        style={otpInput[i] && !isDark ? { boxShadow: '0 0 0 3px rgba(251,86,7,0.10)' } : {}}
                      />
                    ))}
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {authError && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className={`overflow-hidden rounded-[12px] border flex items-start gap-2.5 p-3 mb-4 ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
                        <AlertCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                        <p className="text-[12px] font-semibold text-rose-600 leading-snug">{authError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Resend */}
                  <p className={`text-center text-[12.5px] font-medium mb-5 ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
                    Vous n'avez pas reçu le code ?{' '}
                    <button type="button" onClick={handleResendOtp} disabled={isAuthLoading} className="text-[#fb5607] font-bold hover:underline disabled:opacity-50">
                      Renvoyer
                    </button>
                  </p>

                  {/* Confirm */}
                  <motion.button type="submit" disabled={isAuthLoading || otpInput.length < 4} whileTap={{ scale: 0.97 }}
                    className={`w-full py-4 rounded-[16px] font-black text-[14px] flex justify-center items-center gap-2 transition-all ${otpInput.length === 4 && !isAuthLoading
                      ? 'bg-[#fb5607] text-white' : (isDark ? 'bg-white/8 text-white/25' : 'bg-stone-100 text-stone-300')}`}
                    style={otpInput.length === 4 && !isAuthLoading ? { boxShadow: '0 10px 28px rgba(251,86,7,0.30)' } : {}}>
                    {isAuthLoading
                      ? <><Loader size={18} className="animate-spin" /><span>Vérification…</span></>
                      : <><CheckCircle2 size={18} /><span>Vérifier le code</span></>}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Footer ── */}
          {authStep === 'form' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                {['🇧🇯', '🇨🇮', '🇬🇭', '🇸🇳', '🇨🇲', '🇲🇱'].map((flag, i) => (
                  <span key={i} className="text-base">{flag}</span>
                ))}
              </div>
              <p className={`text-[10.5px] font-medium ${isDark ? 'text-white/18' : 'text-stone-400'}`}>
                Rejoignez la communauté AfroCuisto 🍴
              </p>
            </motion.div>
          )}
        </div>
      </div>
    );
  };



  // --- Return JSX ---

  if (!currentUser) return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`h-screen max-w-md mx-auto relative overflow-hidden flex flex-col shadow-2xl transition-colors duration-300 ${isDark ? 'dark bg-[#000000]' : 'bg-white'}`}
    >
      {renderAuth()}
      <ModernAlertComponent
        show={alertConfig.show}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig({ ...alertConfig, show: false })}
      />
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`h-screen max-w-md mx-auto shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-300 ${isDark ? 'dark bg-[#000000]' : 'bg-[#f3f4f6]'}`}
    >
      <main onScroll={onMainScroll} ref={mainScrollRef as any} className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={springTransition} className="h-full">{renderHome()}</motion.div>}
          {activeTab === 'search' && <motion.div key="search" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={springTransition} className="h-full">{renderExplorer()}</motion.div>}
          {activeTab === 'favs' && <motion.div key="favs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={springTransition} className="h-full">{renderFavorites()}</motion.div>}
          {activeTab === 'cart' && <motion.div key="cart" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={springTransition} className="h-full">{renderShoppingList()}</motion.div>}
          {activeTab === 'profile' && <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={springTransition} className="h-full">{renderProfile()}</motion.div>}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {isSearchExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-[600] flex flex-col ${isDark ? '' : 'search-overlay-light'}`}
            style={{ background: isDark ? '#000000' : 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)' }}
          >
            {/* Search Header */}
            <div className="px-5 pb-4 pt-20 flex items-center gap-3">
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
                  className={`w-full rounded-full py-3.5 pl-11 pr-5 focus:outline-none font-medium text-[15px] transition-all ${isDark ? 'bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:border-[#fb5607]/60 focus:bg-white/15' : 'bg-stone-50 border border-stone-200/40 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#fb5607]/10'}`}
                />
              </motion.div>
            </div>

            {/* Results area */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-20">
              {searchQuery.length > 0 ? (
                <div className="space-y-2.5 mt-2">
                  <p className={`text-[10px] font-black tracking-[0.2em] mb-4 ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
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
                        style={isDark ? { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' } : {}}
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
                          className={`px-4 py-2 category-button active:scale-95 transition-all ${isDark ? 'border-white/10 text-white/70' : 'border-stone-200 text-stone-600'}`}
                          style={{ background: isDark ? 'rgba(251, 86, 7, 0.07)' : 'rgba(251, 86, 7, 0.15)', borderRadius: '20px' }}
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
        {selectedProduct && (
          <ProductDetail
            key="product-detail"
            product={selectedProduct}
            goBack={goBack}
            isDark={isDark}
            updateShoppingList={updateShoppingList}
            showAlert={showAlert}
            allMerchants={allMerchants}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!selectedRecipe && !profileSubView && !selectedProduct && (
          <motion.nav
            initial={{ y: 100, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', damping: 24, stiffness: 360, mass: 0.85 }}
            className="absolute left-4 right-4 z-[800] nav-bottom-adaptive"
          >

            {/* Main pill */}
            <div
              className="relative flex items-center justify-between px-2 rounded-[40px] overflow-hidden"
              style={{
                height: 76,
                background: 'linear-gradient(160deg, #ff6120 0%, #F94D00 55%, #d93d00 100%)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)',
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
                const isActive = activeTab === item.id;
                return (
                  <React.Fragment key={item.id}>
                    <NavButton
                      iconId={item.iconId}
                      isActive={isActive}
                      onClick={() => navigateTo(item.id)}
                      isDark={isDark}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      <ModernAlertComponent
        show={alertConfig.show}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig(prev => ({ ...prev, show: false }))}
      />

      {/* Notifications Push */}
      <PushNotifBanner notif={currentBanner} onDismiss={dismissBanner} onViewMore={notif => setSelectedNotifDetail(notif)} isDark={isDark} />

      <AnimatePresence>
        {isNotifCenterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsNotifCenterOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          >
            <div onClick={e => e.stopPropagation()}>
              <NotifCenter notifications={notifications} onMarkAllRead={markAllRead} onClose={() => setIsNotifCenterOpen(false)} onViewMore={notif => setSelectedNotifDetail(notif)} isDark={isDark} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <CartOverlay
            key="cart-overlay"
            isDark={isDark}
            goBack={goBack}
            currentUser={currentUser}
            updateShoppingList={updateShoppingList}
            showAlert={showAlert}
            allProducts={allProducts}
            allMerchants={allMerchants}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedNotifDetail && (
          <NotifDetail notif={selectedNotifDetail} onClose={() => setSelectedNotifDetail(null)} isDark={isDark} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOrdersOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-[2000] flex flex-col ${isDark ? 'bg-[#000000]' : 'bg-[#f3f4f6]'}`}
          >
            <div className={`p-6 pb-2 pt-12 flex items-center justify-between shrink-0 ${isDark ? 'bg-[#000000]' : 'bg-[#f3f4f6]'}`}>
              <div className="flex items-center gap-4">
                <button onClick={goBack} className={`p-2 rounded-full transition-all active:scale-95 border ${isDark ? 'bg-white/10 text-white border-white/10' : 'bg-white text-stone-800 border-stone-200'}`}>
                  <ChevronLeft size={20} />
                </button>
                <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  Mes Commandes
                </h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full mx-auto px-6 pb-20 pt-4">
              <OrdersHistoryView currentUser={currentUser} t={t} isDark={isDark} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}