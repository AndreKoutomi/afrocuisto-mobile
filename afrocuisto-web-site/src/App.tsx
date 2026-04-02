/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import {
  Menu, X, Clock, Users, ChefHat, ArrowRight, Play,
  Instagram, Facebook, Twitter, BookOpen, ShoppingBasket,
  Download, Globe, Sparkles, Smartphone, WifiOff,
  ShieldCheck, Zap, CheckCircle2, Star, ChevronDown, Mail,
  FileText, Cookie, ShieldAlert, Heart
} from "lucide-react";
import React, { useRef, useState, useEffect } from "react";

/* ─────────────────── DATA ─────────────────── */

const STATS = [
  { value: "200+", label: "Recettes Béninoises" },
  { value: "2k+", label: "Chefs & Passionnés" },
  { value: "4", label: "Régions Couvertes" },
  { value: "100%", label: "Authenticité" },
];

const FEATURES = [
  {
    id: "recipes",
    badge: "Découverte",
    title: "Recettes Interactives",
    subtitle: "Explorez l'Héritage Béninois",
    description:
      "Plongez dans des centaines de recettes authentiques classées par région, difficulté et temps. Suivez chaque étape guidée et cochez votre progression en temps réel.",
    perks: ["Étapes guidées avec minuteries", "Classement par région"],
    icon: <ChefHat size={28} />,
    color: "from-orange-500 to-red-500",
    image: "/assets/recipes-mockup.png",
  },
  {
    id: "community",
    badge: "Communauté",
    title: "Partagez vos Plats",
    subtitle: "Une Communauté de Chefs",
    description:
      "Rejoignez des milliers de passionnés. Partagez vos propres variantes de recettes, échangez des astuces et participez à la préservation de notre art culinaire.",
    perks: ["Partage de photos de plats", "Commentaires et astuces"],
    icon: <Users size={28} />,
    color: "from-violet-500 to-indigo-500",
    image: "/assets/community-mockup.png",
  },
  {
    id: "market",
    badge: "Pratique",
    title: "Liste de Marché",
    subtitle: "Budget Maîtrisé en XOF",
    description:
      "Estimez le coût total de vos ingrédients avant même de quitter la maison. Gérez votre budget, partagez votre liste et ne ratez plus jamais un ingrédient.",
    perks: ["Estimation des prix en XOF", "Partage de liste en un tap"],
    icon: <ShoppingBasket size={28} />,
    color: "from-emerald-500 to-teal-500",
    image: "/assets/market-mockup.png",
  },
];

const REVIEWS = [
  { name: "Faridath A.", city: "Cotonou", stars: 5, text: "Enfin une app qui comprend vraiment la cuisine béninoise. L'Akpan n'a plus aucun secret pour moi !" },
  { name: "Kévin M.", city: "Paris", stars: 5, text: "Je cuisinais les plats de ma mère de mémoire. AfroCuisto m'a rendu mes racines numériquement." },
  { name: "Rosine D.", city: "Porto-Novo", stars: 5, text: "Le mode hors-ligne est un must. Je l'utilise directement au marché de Dantokpa sans problème." },
];

const FAQS = [
  {
    q: "L'application est-elle gratuite ?",
    a: "Oui, la version de base est 100% gratuite avec des centaines de recettes et l'accès communautaire. Une version Premium avec des fonctionnalités exclusives sera bientôt disponible.",
  },
  {
    q: "Faut-il une connexion internet ?",
    a: "Non. Vos recettes favorites et votre liste de marché sont accessibles hors-ligne. Parfait pour utiliser l'app directement au marché ou dans une cuisine sans wifi.",
  },
  {
    q: "Sur quels appareils l'app est-elle disponible ?",
    a: "AfroCuisto sera disponible sur iOS (App Store) et Android (Google Play). Elle a été conçue avec Capacitor pour une expérience native optimale.",
  },
  {
    q: "Quand sera-t-elle disponible au téléchargement ?",
    a: "Un accès Beta fermé est prévu prochainement. Inscrivez-vous sur la liste d'attente pour faire partie des premiers testeurs et influencer le développement.",
  },
];

/* ─────────────────── PHONE MOCKUP ─────────────────── */
const Pixel9Mockup = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, rotateY: -15, rotateX: 5 }}
    whileInView={{ opacity: 1, scale: 1, rotateY: 0, rotateX: 0 }}
    viewport={{ once: true }}
    transition={{
      type: "spring",
      stiffness: 80,
      damping: 15,
      mass: 1.2,
      delay: 0.1
    }}
    whileHover={{
      scale: 1.02,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    }}
    className="relative inline-block select-none"
    style={{ filter: "drop-shadow(0 60px 80px rgba(255,72,0,0.25))" }}
  >
    <motion.img
      animate={{
        y: [0, -12, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      src="/assets/app-mockup-full.png"
      alt="AfroCuisto App"
      style={{ width: 320, display: "block" }}
    />
  </motion.div>
);

/* ─────────────────── FAQ ITEM ─────────────────── */
type FAQItemProps = { q: string; a: string; index: number };
const FAQItem = ({ q, a, index }: FAQItemProps) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="border border-stone-200 rounded-2xl overflow-hidden bg-white hover:border-[#FF4800]/30 transition-colors"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left gap-4"
      >
        <span className="text-lg font-bold text-[#1a1a1a] leading-snug">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }} className="shrink-0 w-8 h-8 rounded-full bg-[#FF4800]/10 flex items-center justify-center">
          <ChevronDown size={16} className="text-[#FF4800]" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-[#1a1a1a]/60 font-medium leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─────────────────── MAIN APP ─────────────────── */
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const legalContent: Record<string, { title: string; subtitle: string; content: React.ReactNode; icon: any }> = {
    Confidentialité: {
      title: "Confidentialité",
      subtitle: "Protection de vos données culinaires",
      icon: <ShieldCheck className="text-[#FF4800]" />,
      content: (
        <div className="space-y-6 text-[#1a1a1a]/70">
          <p>Chez <strong>AfroCuisto</strong>, nous considérons que votre héritage culinaire et vos habitudes de cuisine sont précieux. Votre vie privée est au cœur de notre développement.</p>
          <section className="space-y-3">
            <h4 className="text-[#1a1a1a] font-black text-sm uppercase">Données Collectées</h4>
            <p className="text-sm">Nous collectons uniquement votre adresse email pour la liste d'attente et, plus tard, vos préférences alimentaires (régions préférées, allergies) pour personnaliser votre expérience.</p>
          </section>
          <section className="space-y-3">
            <h4 className="text-[#1a1a1a] font-black text-sm uppercase">Utilisation et Partage</h4>
            <p className="text-sm">Vos données ne sont jamais vendues. Elles servent à synchroniser votre liste de marché en temps réel et à vous proposer des recettes adaptées aux produits disponibles dans votre région.</p>
          </section>
          <section className="space-y-3">
            <h4 className="text-[#1a1a1a] font-black text-sm uppercase">Vos Droits</h4>
            <p className="text-sm">Vous disposez d'un droit total d'accès, de modification et de suppression de vos données directement depuis les réglages de l'application.</p>
          </section>
        </div>
      ),
    },
    Conditions: {
      title: "Conditions",
      subtitle: "Règles d'utilisation de l'app",
      icon: <FileText className="text-[#FF4800]" />,
      content: (
        <div className="space-y-6 text-[#1a1a1a]/70">
          <p>L'utilisation d'AfroCuisto implique l'acceptation de nos principes de partage et de respect de l'art culinaire.</p>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF4800] mt-2 shrink-0" />
              <p className="text-sm"><strong>Usage Personnel :</strong> L'application est destinée à un usage privé pour sublimer vos repas quotidiens.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF4800] mt-2 shrink-0" />
              <p className="text-sm"><strong>Contenu :</strong> Les recettes sont le fruit d'un travail de recherche patrimoniale. Toute reproduction commerciale est interdite sans accord.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF4800] mt-2 shrink-0" />
              <p className="text-sm"><strong>Bêta :</strong> En tant que testeur, vous comprenez que certaines fonctionnalités peuvent évoluer rapidement.</p>
            </li>
          </ul>
        </div>
      ),
    },
    Cookies: {
      title: "Cookies",
      subtitle: "Améliorer votre navigation",
      icon: <Cookie className="text-[#FF4800]" />,
      content: (
        <div className="space-y-6 text-[#1a1a1a]/70">
          <p>Nous utilisons des traceurs légers pour rendre votre expérience plus fluide.</p>
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <h4 className="font-bold text-[#1a1a1a] mb-1">Session & Préférences</h4>
            <p className="text-xs">Mémorise votre progression dans une recette (étape 4 sur 10) pour que vous puissiez reprendre là où vous vous êtes arrêté.</p>
          </div>
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <h4 className="font-bold text-[#1a1a1a] mb-1">Performance</h4>
            <p className="text-xs">Nous aide à identifier si une page charge lentement au marché de Dantokpa afin d'optimiser le mode hors-ligne.</p>
          </div>
        </div>
      ),
    },
    Contact: {
      title: "Contact",
      subtitle: "Parlons cuisine ensemble",
      icon: <Mail className="text-[#FF4800]" />,
      content: (
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-[#1a1a1a]/70 text-center">Une suggestion de recette ou un bug à signaler ? Notre équipe est disponible pour vous.</p>
            <div className="grid grid-cols-1 gap-3">
              <a href="mailto:contact@afrocuisto.app" className="flex items-center gap-4 p-5 bg-white border border-stone-200 rounded-3xl hover:border-[#FF4800] hover:shadow-xl transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-[#FF4800]/10 flex items-center justify-center text-[#FF4800] group-hover:bg-[#FF4800] group-hover:text-white transition-colors">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]/40">Email</p>
                  <p className="font-black text-[#1a1a1a]">hello@afrocuisto.app</p>
                </div>
              </a>
              <div className="flex items-center gap-4 p-5 bg-white border border-stone-200 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-[#1a1a1a]/40">
                  <Globe size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]/40">Localisation</p>
                  <p className="font-black text-[#1a1a1a]">Cotonou & Paris</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            {[
              { Icon: Instagram, href: "https://www.instagram.com/afrocuisto229/" },
              { Icon: Facebook, href: "https://www.facebook.com/profile.php?id=61576480304371" },
              { Icon: Twitter, href: "#" }
            ].map((social, i) => (
              <a
                key={i}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center text-[#1a1a1a]/40 hover:text-[#FF4800] transition-all"
              >
                <social.Icon size={20} />
              </a>
            ))}
          </div>
        </div>
      ),
    },
  };

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  const navBg = useTransform(scrollYProgress, [0, 0.04], ["rgba(253,252,249,0)", "rgba(253,252,249,0.97)"]);
  const heroY = useTransform(heroProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);

  const handleWaitlist = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const navLinks = [
    { href: "#features", label: "Fonctionnalités" },
    { href: "#app", label: "L'Application" },
    { href: "#faq", label: "FAQ" },
    { href: "#waitlist", label: "Accès Bêta", highlight: true },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FDFCF9] text-[#1a1a1a] overflow-x-hidden selection:bg-[#FF4800]/20 font-['Montserrat']">

      {/* ── MODALS ── */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl shadow-black/20 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-8 pb-4 flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-3xl bg-[#FF4800]/10 flex items-center justify-center">
                    {legalContent[activeModal]?.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1a1a1a] leading-none mb-1">{legalContent[activeModal]?.title}</h3>
                    <p className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]/30">{legalContent[activeModal]?.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-[#FF4800] hover:text-white transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 pt-4 max-h-[60vh] overflow-y-auto custom-scrollbar leading-relaxed">
                {legalContent[activeModal]?.content}
              </div>

              {/* Footer */}
              <div className="p-8 pt-0">
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-4 bg-[#1a1a1a] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#FF4800] transition-colors shadow-lg shadow-black/10"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NAV ── */}
      <motion.header
        style={{ backgroundColor: navBg }}
        className="fixed top-0 inset-x-0 z-[100] backdrop-blur-xl border-b border-black/5"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-[#FF4800]/30 group-hover:scale-110 transition-transform overflow-hidden bg-[#FF4800]">
              <img src="/assets/logo.png" alt="AfroCuisto" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-black tracking-tight text-[#1a1a1a]">AfroCuisto</span>
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((l) =>
              l.highlight ? (
                <a key={l.href} href={l.href} className="px-5 py-2.5 bg-[#FF4800] text-white rounded-full text-sm font-black uppercase tracking-wide hover:bg-[#FF6A00] transition-colors shadow-lg shadow-[#FF4800]/30">
                  {l.label}
                </a>
              ) : (
                <a key={l.href} href={l.href} className="text-sm font-bold text-[#1a1a1a]/50 hover:text-[#FF4800] transition-colors uppercase tracking-wide">
                  {l.label}
                </a>
              )
            )}
          </nav>

          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden w-10 h-10 rounded-full bg-black/8 flex items-center justify-center">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-black/5 bg-white overflow-hidden"
            >
              <div className="px-6 py-6 flex flex-col gap-4">
                {navLinks.map((l) => (
                  <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className={`text-lg font-bold ${l.highlight ? "text-[#FF4800]" : "text-[#1a1a1a]/70"}`}>
                    {l.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[#FDFCF9]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,72,0,0.08),transparent_60%)]" />
          <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-[#FDFCF9] to-transparent" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.3) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-28 pb-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">

            {/* Left */}
            <div className="space-y-10">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF4800]/15 border border-[#FF4800]/30 rounded-full text-[#FF4800] text-xs font-black uppercase tracking-widest mb-8">
                  <Sparkles size={12} /> Bêta Test Bientôt Disponible
                </div>
                <h1 className="text-[clamp(3rem,8vw,6.5rem)] font-black leading-[0.88] tracking-tighter text-[#1a1a1a]">
                  La Cuisine<br />
                  <span className="relative inline-block">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4800] via-[#FF7900] to-[#FFB600]">Béninoise</span>
                  </span>
                  <br />
                  <span className="text-[#1a1a1a]/20">Réinventée.</span>
                </h1>
              </motion.div>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="text-xl md:text-2xl text-[#1a1a1a]/60 font-medium leading-relaxed max-w-xl">
                Recettes guidées, liste de marché intelligente et communauté passionnée — tout ce dont vous avez besoin pour sublimer votre cuisine africaine.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }} className="flex flex-wrap gap-4">
                <a href="#waitlist" className="flex items-center gap-3 px-8 py-4 bg-[#FF4800] hover:bg-[#FF6A00] text-white rounded-2xl font-black text-sm uppercase tracking-wide transition-all hover:scale-105 shadow-2xl shadow-[#FF4800]/30">
                  <Download size={18} /> Rejoindre la Waitlist
                </a>
                <a href="#features" className="flex items-center gap-3 px-8 py-4 bg-[#1a1a1a]/8 hover:bg-[#1a1a1a]/12 text-[#1a1a1a] rounded-2xl font-black text-sm uppercase tracking-wide transition-all border border-[#1a1a1a]/10">
                  Découvrir <ArrowRight size={16} />
                </a>
              </motion.div>

              {/* Stats */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="pt-4 grid grid-cols-4 gap-4 border-t border-[#1a1a1a]/10">
                {STATS.map((s) => (
                  <div key={s.label} className="space-y-1">
                    <p className="text-2xl md:text-3xl font-black text-[#FF4800]">{s.value}</p>
                    <p className="text-[10px] font-bold text-[#1a1a1a]/40 uppercase leading-tight">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — Phone mockup */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex justify-center lg:justify-end"
            >
              {/* Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#FF4800]/20 rounded-full blur-[100px]" />

              <div className="relative">

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-6 -left-4 lg:-left-12 bg-white text-[#1a1a1a] px-5 py-2.5 rounded-2xl font-black text-xs shadow-2xl -rotate-3 z-20 flex items-center gap-2"
                >
                  <span className="text-lg">🏆</span> +200 Recettes
                </motion.div>

                <Pixel9Mockup />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#1a1a1a]/30">
          <span className="text-xs font-bold uppercase tracking-widest">Défiler</span>
          <ChevronDown size={16} />
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-32 md:py-40 px-6 md:px-10">
        <div className="max-w-7xl mx-auto space-y-40">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-black uppercase tracking-widest text-[#FF4800]">
              Fonctionnalités
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              Tout ce dont vous avez besoin.
            </motion.h2>
          </div>

          {FEATURES.map((f, i) => (
            <div id={f.id} key={f.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-last" : ""}`}>
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full text-white text-xs font-black uppercase bg-gradient-to-r ${f.color}`}>
                  {f.icon} {f.badge}
                </div>
                <div className="space-y-4">
                  <h3 className="text-5xl md:text-6xl font-black tracking-tighter leading-none text-[#1a1a1a]">{f.title}</h3>
                  <p className="text-xl text-[#1a1a1a]/40 font-bold">{f.subtitle}</p>
                </div>
                <p className="text-xl text-[#1a1a1a]/60 font-medium leading-relaxed">{f.description}</p>
                <ul className="space-y-3">
                  {f.perks.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-sm font-bold text-[#1a1a1a]/70">
                      <CheckCircle2 size={18} className="text-[#FF4800] shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40, rotateY: i % 2 === 0 ? 10 : -10 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  type: "spring",
                  stiffness: 50,
                  damping: 12,
                  mass: 1,
                  delay: 0.2
                }}
                className="relative flex justify-center items-center perspective-1000"
              >
                {/* Subtle Glow */}
                <div className={`absolute w-72 h-72 bg-gradient-to-br ${f.color} opacity-20 blur-[100px] rounded-full`} />

                <motion.div
                  whileHover={{
                    scale: 1.03,
                    y: -10
                  }}
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
                    scale: { type: "spring", stiffness: 300, damping: 20 }
                  }}
                  className="relative z-10"
                >
                  <motion.img
                    src={f.image}
                    alt={f.title}
                    className="max-h-[600px] w-auto rounded-[30px] drop-shadow-[0_40px_60px_rgba(0,0,0,0.12)] transition-shadow duration-500"
                  />
                </motion.div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* ── OFFLINE SECTION ── */}
      <section id="app" className="py-32 md:py-40 px-6 md:px-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF4800]/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-12 text-center"
            >
              <div className="space-y-6">
                <p className="text-xs font-black uppercase tracking-widest text-[#FF4800]">Conçue pour la réalité</p>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-[#1a1a1a]">
                  Mobile & <span className="text-[#1a1a1a]/20 italic">Offline.</span>
                </h2>
                <p className="text-xl text-[#1a1a1a]/60 font-medium leading-relaxed max-w-2xl mx-auto">
                  Que vous soyez dans une cuisine enfumée de Cotonou ou au marché de Dantokpa sans signal, AfroCuisto reste toujours à vos côtés.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { icon: <WifiOff size={22} className="text-[#FF4800]" />, title: "Mode Hors-Ligne", desc: "Plats & listes sans internet." },
                  { icon: <Smartphone size={22} className="text-[#FF4800]" />, title: "Natif Mobile", desc: "Usage à une main." },
                  { icon: <ShieldCheck size={22} className="text-[#FF4800]" />, title: "Sécurisé", desc: "Données protégées." },
                  { icon: <Zap size={22} className="text-[#FF4800]" />, title: "Ultra Rapide", desc: "Instantané." },
                ].map((item) => (
                  <div key={item.title} className="p-6 rounded-2xl bg-white border border-stone-200 hover:border-[#FF4800]/30 hover:shadow-md transition-all space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FF4800]/10 flex items-center justify-center mx-auto">{item.icon}</div>
                    <h4 className="font-black text-sm uppercase text-[#1a1a1a]">{item.title}</h4>
                    <p className="text-[#1a1a1a]/50 text-xs font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="py-24 px-6 md:px-10 bg-stone-50 border-y border-stone-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF4800]">Avis Beta</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#1a1a1a]">Ce que disent nos testeurs.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[32px] bg-white border border-stone-200 hover:border-[#FF4800]/30 hover:shadow-lg transition-all space-y-5"
              >
                <div className="flex gap-1">
                  {Array.from({ length: r.stars }).map((_, j) => (
                    <Star key={j} size={14} fill="#FF4800" className="text-[#FF4800]" />
                  ))}
                </div>
                <p className="text-[#1a1a1a]/70 font-medium leading-relaxed italic">"{r.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                  <div className="w-8 h-8 rounded-full bg-[#FF4800]/10 flex items-center justify-center text-sm font-black text-[#FF4800]">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#1a1a1a]">{r.name}</p>
                    <p className="text-xs text-[#1a1a1a]/40 font-medium">{r.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-32 md:py-40 px-6 md:px-10">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF4800]">Questions Fréquentes</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Tout ce qu'il faut savoir.</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── WAITLIST ── */}
      <section id="waitlist" className="py-32 md:py-40 px-6 md:px-10 relative overflow-hidden bg-[#FF4800]">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-white/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/20 rounded-full text-white text-xs font-black uppercase tracking-widest">
              <Mail size={12} /> Accès Bêta Exclusif
            </div>
            <h2 className="text-[clamp(3rem,9vw,7rem)] font-black tracking-[-0.04em] leading-[0.9] uppercase text-white">
              Rejoignez le <br />
              mouvement.
            </h2>
            <p className="text-xl md:text-2xl text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
              Soyez parmi les premiers à taster AfroCuisto. Entrez votre email pour un accès prioritaire au lancement Beta.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            {!submitted ? (
              <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto p-2 bg-black/10 border border-white/20 rounded-[24px] backdrop-blur-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  className="flex-1 px-6 py-4 rounded-[18px] bg-white text-[#1a1a1a] placeholder:text-black/30 font-medium text-base focus:outline-none focus:ring-4 focus:ring-white/50 transition-all"
                />
                <button type="submit" className="px-8 py-4 bg-[#1a1a1a] hover:bg-black active:scale-95 text-white rounded-[18px] font-black text-sm uppercase tracking-wide transition-all whitespace-nowrap shadow-xl flex items-center justify-center gap-2">
                  M'inscrire <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-3 px-10 py-5 bg-white/20 border border-white/40 rounded-2xl text-white font-black text-lg">
                <CheckCircle2 size={24} /> Vous êtes sur la liste ! 🎉
              </motion.div>
            )}
            <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-5">Pas de spam. Jamais. Promis.</p>
          </motion.div>

          {/* Download links */}
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <button className="flex items-center justify-center gap-3 px-8 py-4 border border-white/30 rounded-2xl hover:bg-white/10 transition-colors font-bold text-white/80 hover:text-white">
              <Download size={18} /> App Store <span className="text-xs opacity-50">Bientôt</span>
            </button>
            <button className="flex items-center justify-center gap-3 px-8 py-4 border border-white/30 rounded-2xl hover:bg-white/10 transition-colors font-bold text-white/80 hover:text-white">
              <Play size={18} fill="currentColor" /> Google Play <span className="text-xs opacity-50">Bientôt</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-stone-200 bg-white py-16 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-[#FF4800]">
                  <img src="/assets/logo.png" alt="AfroCuisto" className="w-full h-full object-cover" />
                </div>
                <span className="text-2xl font-black text-[#1a1a1a]">AfroCuisto</span>
              </div>
              <p className="text-[#1a1a1a]/40 font-medium max-w-sm leading-relaxed">
                Développé avec passion pour préserver et célébrer l'héritage culinaire de l'Afrique de l'Ouest. 🌍
              </p>
              <div className="flex gap-4">
                {[
                  { Icon: Instagram, href: "https://www.instagram.com/afrocuisto229/" },
                  { Icon: Facebook, href: "https://www.facebook.com/profile.php?id=61576480304371" },
                  { Icon: Twitter, href: "#" }
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-[#1a1a1a]/40 hover:text-[#FF4800] hover:border-[#FF4800]/30 transition-all"
                  >
                    <social.Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 md:col-start-7 space-y-6">
              <h5 className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]/40">L'Application</h5>
              <ul className="space-y-4 text-sm font-bold text-[#1a1a1a]/50">
                {[
                  { label: "Recettes", id: "recipes" },
                  { label: "Communauté", id: "community" },
                  { label: "Liste Marché", id: "market" },
                  { label: "Héritage", id: "features" },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="hover:text-[#FF4800] cursor-pointer transition-colors"
                    onClick={() => {
                      const section = document.getElementById(item.id);
                      if (section) section.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2 space-y-6">
              <h5 className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]/40">Légal</h5>
              <ul className="space-y-4 text-sm font-bold text-[#1a1a1a]/50">
                {["Confidentialité", "Conditions", "Cookies", "Contact"].map((item) => (
                  <li
                    key={item}
                    className="hover:text-[#FF4800] cursor-pointer transition-colors"
                    onClick={() => setActiveModal(item)}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-[#1a1a1a]/20 uppercase tracking-widest">
            <p>© 2026 AfroCuisto. Tous droits réservés.</p>
            <div className="flex gap-8">
              <span>Cotonou, Bénin</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
