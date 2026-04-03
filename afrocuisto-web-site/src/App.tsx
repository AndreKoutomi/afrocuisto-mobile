import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import {
  Menu, X, Clock, Users, ChefHat, ArrowRight, Play,
  Instagram, Facebook, BookOpen, ShoppingBasket,
  Download, Globe, Sparkles, Smartphone, WifiOff,
  ShieldCheck, Zap, CheckCircle2, Star, ChevronDown, ChevronUp, Mail,
  FileText, Cookie, ShieldAlert, Heart, Languages
} from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import emailjs from 'emailjs-com';
import { supabase } from './lib/supabase';

/* ─────────────────── TRANSLATIONS ─────────────────── */

type Language = "FR" | "EN" | "ES";

const TRANSLATIONS = {
  FR: {
    nav: { features: "Fonctionnalités", app: "L'Application", faq: "FAQ", beta: "Accès Bêta" },
    hero: {
      badge: "Bêta Test Bientôt Disponible",
      title: "La Cuisine",
      titleSpan: "Béninoise",
      titleSuffix: "Réinventée.",
      desc: "Recettes guidées, liste de marché intelligente et communauté passionnée — tout ce dont vous avez besoin pour sublimer votre cuisine africaine.",
      waitlist: "Rejoindre la Liste d'attente",
      discover: "Découvrir",
      scroll: "Défiler",
      stats: ["Recettes Béninoises", "Régions Couvertes", "Authenticité"]
    },
    features: {
      badge: "Fonctionnalités",
      title: "Tout ce dont vous avez besoin.",
      items: [
        {
          badge: "Découverte",
          title: "Recettes Interactives",
          subtitle: "Explorez l'Héritage Béninois",
          description: "Plongez dans des centaines de recettes authentiques classées par région, difficulté et temps. Suivez chaque étape guidée et cochez votre progression en temps réel.",
          perks: ["Étapes guidées avec minuteries", "Classement par région"]
        },
        {
          badge: "Communauté",
          title: "Partagez vos Plats",
          subtitle: "Une Communauté de Chefs",
          description: "Rejoignez des milliers de passionnés. Partagez vos propres variantes de recettes, échangez des astuces et participez à la préservation de notre art culinaire.",
          perks: ["Partage de photos de plats", "Commentaires et astuces"]
        },
        {
          badge: "Pratique",
          title: "Liste de Marché",
          subtitle: "Budget Maîtrisé en XOF",
          description: "Estimez le coût total de vos ingrédients avant même de quitter la maison. Gérez votre budget, partagez votre liste et ne ratez plus jamais un ingrédient.",
          perks: ["Estimation des prix en XOF", "Partage de liste en un tap"]
        }
      ]
    },
    offline: {
      badge: "Conçue pour la réalité",
      title: "Mobile & ",
      italic: "Offline.",
      desc: "Que vous soyez dans une cuisine enfumée de Cotonou ou au marché de Dantokpa sans signal, AfroCuisto reste toujours à vos côtés.",
      cards: [
        { title: "Mode Hors-Ligne", desc: "Plats & listes sans internet." },
        { title: "Natif Mobile", desc: "Usage à une main." },
        { title: "Sécurisé", desc: "Données protégées." },
        { title: "Ultra Rapide", desc: "Instantané." }
      ]
    },
    reviews: {
      badge: "Avis Beta",
      title: "Ce que disent nos testeurs."
    },
    faq: {
      badge: "Questions Fréquentes",
      title: "Tout ce qu'il faut savoir.",
      items: [
        { q: "L'application est-elle gratuite ?", a: "Oui, la version de base est 100% gratuite avec des centaines de recettes et l'accès communautaire." },
        { q: "Faut-il une connexion internet ?", a: "Non. Vos recettes favorites et votre liste de marché sont accessibles hors-ligne." },
        { q: "Sur quels appareils l'app est-elle disponible ?", a: "AfroCuisto sera disponible sur Android (Google Play) et bientôt sur IOS (Apple Store)." },
        { q: "Quand sera-t-elle disponible ?", a: "Un accès Beta fermé est prévu prochainement. Inscrivez-vous sur la liste d'attente." }
      ]
    },
    waitlist: {
      badge: "Accès Bêta Exclusif",
      title: "Rejoignez le ",
      titleBr: "mouvement.",
      desc: "Soyez parmi les premiers à taster AfroCuisto. Entrez votre email pour un accès prioritaire au lancement Beta.",
      placeholder: "votre@email.com",
      submit: "M'inscrire",
      success: "Vous êtes sur la liste ! 🎉",
      noSpam: "Pas de spam. Jamais. Promis.",
      soon: "Bientôt"
    },
    footer: {
      desc: "Développé avec passion pour préserver et célébrer l'héritage culinaire de l'Afrique de l'Ouest. 🌍",
      app: "L'Application",
      legal: "Légal",
      rights: "© 2026 AfroCuisto. Tous droits réservés."
    }
  },
  EN: {
    nav: { features: "Features", app: "The App", faq: "FAQ", beta: "Beta Access" },
    hero: {
      badge: "Beta Test Coming Soon",
      title: "Beninese",
      titleSpan: "Cuisine",
      titleSuffix: "Reinvented.",
      desc: "Guided recipes, smart market lists, and a passionate community — everything you need to elevate your African cooking.",
      waitlist: "Join the Waitlist",
      discover: "Discover",
      scroll: "Scroll",
      stats: ["Beninese Recipes", "Regions Covered", "Authenticity"]
    },
    features: {
      badge: "Features",
      title: "Everything you need.",
      items: [
        {
          badge: "Discovery",
          title: "Interactive Recipes",
          subtitle: "Explore Beninese Heritage",
          description: "Dive into hundreds of authentic recipes sorted by region, difficulty, and time. Follow each guided step and track your progress in real-time.",
          perks: ["Guided steps with timers", "Sort by region"]
        },
        {
          badge: "Community",
          title: "Share your Dishes",
          subtitle: "A Community of Chefs",
          description: "Join thousands of enthusiasts. Share your own recipe variants, exchange tips, and participate in preserving our culinary art.",
          perks: ["Share dish photos", "Comments and tips"]
        },
        {
          badge: "Practical",
          title: "Market List",
          subtitle: "Budget Managed in XOF",
          description: "Estimate the total cost of your ingredients before even leaving home. Manage your budget, share your list, and never miss an ingredient again.",
          perks: ["Price estimation in XOF", "One-tap list sharing"]
        }
      ]
    },
    offline: {
      badge: "Built for reality",
      title: "Mobile & ",
      italic: "Offline.",
      desc: "Whether you're in a smokey kitchen in Cotonou or at Dantokpa market without signal, AfroCuisto is always by your side.",
      cards: [
        { title: "Offline Mode", desc: "Dishes & lists without internet." },
        { title: "Mobile Native", desc: "One-handed usage." },
        { title: "Secure", desc: "Protected data." },
        { title: "Ultra Fast", desc: "Instantaneous." }
      ]
    },
    reviews: {
      badge: "Beta Reviews",
      title: "What our testers say."
    },
    faq: {
      badge: "Frequently Asked Questions",
      title: "Everything you need to know.",
      items: [
        { q: "Is the app free?", a: "Yes, the basic version is 100% free with hundreds of recipes and community access." },
        { q: "Do I need internet?", a: "No. Your favorite recipes and market list are accessible offline." },
        { q: "Which devices are supported?", a: "AfroCuisto will be available on iOS (App Store) and Android (Google Play)." },
        { q: "When will it be available?", a: "A closed Beta access is coming soon. Subscribe to the waitlist to be first." }
      ]
    },
    waitlist: {
      badge: "Exclusive Beta Access",
      title: "Join the ",
      titleBr: "movement.",
      desc: "Be among the first to taste AfroCuisto. Enter your email for priority access to the Beta launch.",
      placeholder: "your@email.com",
      submit: "Subscribe",
      success: "You're on the list! 🎉",
      noSpam: "No spam. Ever. Promise.",
      soon: "Soon"
    },
    footer: {
      desc: "Developed with passion to preserve and celebrate the culinary heritage of West Africa. 🌍",
      app: "The Application",
      legal: "Legal",
      rights: "© 2026 AfroCuisto. All rights reserved."
    }
  },
  ES: {
    nav: { features: "Funcionalidades", app: "La Aplicación", faq: "FAQ", beta: "Acceso Beta" },
    hero: {
      badge: "Prueba Beta Próximamente",
      title: "La Cocina",
      titleSpan: "Beninesa",
      titleSuffix: "Reinventada.",
      desc: "Recetas guiadas, listas de mercado inteligentes y una comunidad apasionada: todo lo que necesitas para sublimar tu cocina africana.",
      waitlist: "Unirse a la lista",
      discover: "Descubrir",
      scroll: "Desplazar",
      stats: ["Recetas Beninesas", "Regiones Cubiertas", "Autenticidad"]
    },
    features: {
      badge: "Funcionalidades",
      title: "Todo lo que necesitas.",
      items: [
        {
          badge: "Descubrimiento",
          title: "Recetas Interactivas",
          subtitle: "Explora el Patrimonio Beninés",
          description: "Sumérgete en cientos de recetas auténticas clasificadas por región, dificultad y tiempo. Sigue cada paso guiado y marca tu progreso en tiempo real.",
          perks: ["Pasos guiados con temporizadores", "Clasificación por región"]
        },
        {
          badge: "Comunidad",
          title: "Comparte tus Platos",
          subtitle: "Una Comunidad de Chefs",
          description: "Únete a miles de apasionados. Comparte tus propias variantes de recetas, intercambia consejos y participa en la preservación de nuestro arte culinario.",
          perks: ["Compartir fotos de platos", "Comentarios y consejos"]
        },
        {
          badge: "Práctico",
          title: "Lista de Mercado",
          subtitle: "Presupuesto en XOF",
          description: "Estima el costo total de vos ingredientes antes de salir de casa. Gestiona tu presupuesto, comparte tu lista y no pierdas nunca un ingrediente.",
          perks: ["Estimación de precios en XOF", "Compartir lista con un toque"]
        }
      ]
    },
    offline: {
      badge: "Diseñado para la realidad",
      title: "Móvil & ",
      italic: "Offline.",
      desc: "Ya sea que estés en una cocina en Cotonú o en el mercado de Dantokpa sin señal, AfroCuisto siempre está a tu lado.",
      cards: [
        { title: "Modo Offline", desc: "Platos y listas sin internet." },
        { title: "Nativo Móvil", desc: "Uso con una mano." },
        { title: "Seguro", desc: "Datos protegidos." },
        { title: "Ultra Rápido", desc: "Instantáneo." }
      ]
    },
    reviews: {
      badge: "Opiniones Beta",
      title: "Lo que dicen nuestros probadores."
    },
    faq: {
      badge: "Preguntas Frecuentes",
      title: "Todo lo que necesitas saber.",
      items: [
        { q: "¿La aplicación es gratuita?", a: "Sí, la versión básica es 100% gratuita con cientos de recetas y acceso comunitario." },
        { q: "¿Necesito internet?", a: "No. Tus recetas favoritas y tu lista de compra están disponibles offline." },
        { q: "¿En qué dispositivos está disponible?", a: "AfroCuisto estará disponible en iOS (App Store) y Android (Google Play)." },
        { q: "¿Cuándo estará disponible?", a: "Próximamente habrá un acceso Beta cerrado. Inscríbete en la lista de espera." }
      ]
    },
    waitlist: {
      badge: "Acceso Beta Exclusivo",
      title: "Únete al ",
      titleBr: "movimiento.",
      desc: "Sé de los primeros en probar AfroCuisto. Introduce tu email para acceso prioritario al lanzamiento Beta.",
      placeholder: "tu@email.com",
      submit: "Inscribirse",
      success: "¡Estás en la lista! 🎉",
      noSpam: "Sin spam. Nunca. Prometido.",
      soon: "Pronto"
    },
    footer: {
      desc: "Desarrollado con pasión para preservar y celebrar el patrimonio culinario de África Occidental. 🌍",
      app: "La Aplicación",
      legal: "Legal",
      rights: "© 2026 AfroCuisto. Todos los derechos reservados."
    }
  }
};

/* ─────────────────── DATA ─────────────────── */

const STATS = [
  { value: "200+", label: "Recettes Béninoises" },
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
    style={{
      willChange: "transform, opacity",
      filter: "drop-shadow(0 30px 40px rgba(255,72,0,0.15))"
    }}
  >
    <motion.img
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      src="/assets/app-mockup-full.png"
      alt="AfroCuisto App"
      className="block w-[320px] h-auto pointer-events-none mix-blend-multiply"
      style={{ willChange: "transform" }}
    />
  </motion.div>
);

/* ─────────────────── FAQ ITEM ─────────────────── */
type FAQItemProps = { q: string; a: string; index: number; key?: any };
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
  const [lang, setLang] = useState<Language>("FR");
  const t = TRANSLATIONS[lang];

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("#");
  const heroRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // ScrollSpy Logic
  useEffect(() => {
    const sections = ["#", "#features", "#app", "#faq", "#waitlist"];
    const observerOptions = { root: null, rootMargin: "-40% 0px -40% 0px", threshold: 0 };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection("#" + entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      if (id === "#") return;
      const el = document.getElementById(id.replace("#", ""));
      if (el) observer.observe(el);
    });

    // Special case for Hero (top)
    const handleScroll = () => {
      if (window.scrollY < 100) setActiveSection("#");
      setShowTopButton(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const legalContent: Record<string, { title: string; subtitle: string; content: React.ReactNode; icon: any }> = {
    Confidentialité: {
      title: lang === "EN" ? "Privacy" : lang === "ES" ? "Privacidad" : "Confidentialité",
      subtitle: lang === "EN" ? "Protecting your culinary data" : lang === "ES" ? "Protección de sus datos" : "Protection de vos données culinaires",
      icon: <ShieldCheck className="text-[#FF4800]" />,
      content: (
        <div className="space-y-6 text-[#1a1a1a]/70">
          <p>{lang === "EN" ? "At AfroCuisto, we consider your culinary heritage and cooking habits precious. Your privacy is at the heart of our development." : lang === "ES" ? "En AfroCuisto, consideramos que su patrimonio culinario y sus hábitos son preciosos. Su privacidad es fundamental." : "Chez AfroCuisto, nous considérons que votre héritage culinaire et vos habitudes de cuisine sont précieux. Votre vie privée est au cœur de notre développement."}</p>
        </div>
      ),
    },
    Conditions: {
      title: lang === "EN" ? "Terms" : lang === "ES" ? "Condiciones" : "Conditions",
      subtitle: lang === "EN" ? "Rules for using the app" : lang === "ES" ? "Reglas de uso" : "Règles d'utilisation de l'app",
      icon: <FileText className="text-[#FF4800]" />,
      content: (
        <div className="space-y-6 text-[#1a1a1a]/70">
          <p>{lang === "EN" ? "Using AfroCuisto implies acceptance of our principles of sharing and respect for culinary art." : lang === "ES" ? "El uso de AfroCuisto implica la aceptación de nuestros principios de intercambio y respeto culinario." : "L'utilisation d'AfroCuisto implique l'acceptation de nos principes de partage et de respect de l'art culinaire."}</p>
        </div>
      ),
    },
    Contact: {
      title: "Contact",
      subtitle: lang === "EN" ? "Let's talk cooking together" : lang === "ES" ? "Hablemos de cocina" : "Parlons cuisine ensemble",
      icon: <Mail className="text-[#FF4800]" />,
      content: (
        <div className="space-y-4">
          <p className="text-[#1a1a1a]/70 text-center">{lang === "EN" ? "A recipe suggestion or a bug to report? Our team is available for you." : lang === "ES" ? "¿Una sugerencia de receta o un error? Nuestro equipo está disponible." : "Une suggestion de recette ou un bug à signaler ? Notre équipe est disponible pour vous."}</p>
        </div>
      ),
    },
  };

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  const navBg = useTransform(scrollYProgress, [0, 0.04], ["rgba(253,252,249,0)", "rgba(253,252,249,0.97)"]);
  const heroY = useTransform(heroProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleWaitlist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // ─────────────────────────────────────────────────────────────────────────
    // 📝 INSTRUCTIONS EMAILJS (DEUX TEMPLATES NÉCESSAIRES)
    // ─────────────────────────────────────────────────────────────────────────
    const SERVICE_ID = 'service_oi4g3g9'; // Votre Service ID actuel
    const TEMPLATE_ID = 'template_ax92ky9'; // Template pour l'Utilisateur
    const PUBLIC_KEY = '5bxF5hiV8eLRjESo4'; // Votre Public Key ici
    // ─────────────────────────────────────────────────────────────────────────

    try {
      // 3. Sauvegarde dans Supabase (pour affichage dans l'Admin)
      try {
        await supabase.from('waitlist').insert([{ email, lang }]);
      } catch (dbErr) {
        console.warn('DB Insert failed, but email will still be sent:', dbErr);
      }

      // Envoi de l'email de Bienvenue pour l'Utilisateur
      const result = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          user_email: email, // L'email de la personne qui s'inscrit
          language: lang,
          date: new Date().toLocaleDateString()
        },
        PUBLIC_KEY
      );

      if (result.status === 200) {
        setSubmitted(true);
      } else {
        throw new Error("Échec de l'envoi.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'inscription. Vérifiez votre configuration EmailJS.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const navLinks = [
    { href: "#features", label: "Fonctionnalités" },
    { href: "#app", label: "L'Application" },
    { href: "#faq", label: "FAQ" },
    { href: "#waitlist", label: "Accès Bêta", highlight: true },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FDFCF9] text-[#1a1a1a] overflow-x-hidden selection:bg-[#FF4800]/20">

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
                  {t.nav.beta}
                </a>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setActiveSection(l.href)}
                  className={`text-sm font-bold transition-colors uppercase tracking-wide ${activeSection === l.href ? "text-[#FF4800]" : "text-[#1a1a1a]/50 hover:text-[#FF4800]"}`}
                >
                  {l.href === "#features" ? t.nav.features : l.href === "#app" ? t.nav.app : t.nav.faq}
                </a>
              )
            )}

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full border border-black/5">
              {(["FR", "EN", "ES"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${lang === l ? "bg-white text-[#FF4800] shadow-sm" : "text-[#1a1a1a]/40 hover:text-[#1a1a1a]"}`}
                >
                  {l}
                </button>
              ))}
            </div>
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
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(false);
                      const targetId = l.href.replace("#", "");
                      const element = document.getElementById(targetId);
                      if (element) {
                        setTimeout(() => {
                          element.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }
                    }}
                    className={`text-xl font-black uppercase tracking-tight ${activeSection === l.href ? "text-[#FF4800]" : "text-[#1a1a1a]/70"}`}
                  >
                    {l.href === "#features" ? t.nav.features : l.href === "#app" ? t.nav.app : l.href === "#faq" ? t.nav.faq : t.nav.beta}
                  </a>
                ))}

                {/* Mobile Language Selector */}
                <div className="pt-6 mt-6 border-t border-black/5 flex items-center gap-4">
                  <p className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]/30">Language</p>
                  <div className="flex items-center gap-2">
                    {(["FR", "EN", "ES"] as Language[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => {
                          setLang(l);
                          setMenuOpen(false);
                        }}
                        className={`w-10 h-10 rounded-xl font-black text-xs transition-all border ${lang === l ? "bg-[#FF4800] border-[#FF4800] text-white shadow-lg shadow-[#FF4800]/20" : "bg-white border-stone-200 text-[#1a1a1a]/40 hover:border-[#FF4800]/30"}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
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

        <motion.div style={{ y: heroY, opacity: heroOpacity, willChange: "transform, opacity" }} className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-28 pb-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">

            {/* Left */}
            <div className="space-y-10">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF4800]/15 border border-[#FF4800]/30 rounded-full text-[#FF4800] text-xs font-black uppercase tracking-widest mb-8">
                  <Sparkles size={12} /> {t.hero.badge}
                </div>
                <h1 className="text-[clamp(3rem,8vw,6.5rem)] font-display font-black leading-[0.88] tracking-tight text-[#1a1a1a]">
                  {t.hero.title}<br />
                  <span className="relative inline-block">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4800] via-[#FF7900] to-[#FFB600]">{t.hero.titleSpan}</span>
                  </span>
                  <br />
                  <span className="text-[#1a1a1a]/20">{t.hero.titleSuffix}</span>
                </h1>
              </motion.div>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="text-xl md:text-2xl text-[#1a1a1a]/60 font-medium leading-relaxed max-w-xl">
                {t.hero.desc}
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }} className="flex flex-wrap gap-4">
                <a href="#waitlist" className="flex items-center gap-3 px-8 py-4 bg-[#FF4800] hover:bg-[#FF6A00] text-white rounded-2xl font-black text-sm uppercase tracking-wide transition-all hover:scale-105 shadow-2xl shadow-[#FF4800]/30">
                  <Download size={18} /> {t.hero.waitlist}
                </a>
                <a href="#features" className="flex items-center gap-3 px-8 py-4 bg-[#1a1a1a]/8 hover:bg-[#1a1a1a]/12 text-[#1a1a1a] rounded-2xl font-black text-sm uppercase tracking-wide transition-all border border-[#1a1a1a]/10">
                  {t.hero.discover} <ArrowRight size={16} />
                </a>
              </motion.div>

              {/* Stats */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="pt-4 grid grid-cols-4 gap-4 border-t border-[#1a1a1a]/10">
                {STATS.map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-2xl md:text-3xl font-black text-[#FF4800]">{s.value}</p>
                    <p className="text-[10px] font-bold text-[#1a1a1a]/40 uppercase leading-tight">{t.hero.stats[idx]}</p>
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
              <div className="relative">
                {/* Glow Optimized */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[radial-gradient(circle,rgba(255,72,0,0.2)_0%,transparent_70%)] pointer-events-none" />

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-6 -left-4 lg:-left-12 bg-white text-[#1a1a1a] px-5 py-2.5 rounded-2xl font-black text-xs shadow-2xl -rotate-3 z-20 flex items-center gap-2"
                  style={{ willChange: "transform" }}
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
              {t.features.badge}
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-5xl md:text-7xl font-display font-black tracking-tight leading-none">
              {t.features.title}
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
                  {f.icon} {t.features.items[i].badge}
                </div>
                <div className="space-y-4">
                  <h3 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-none text-[#1a1a1a]">{t.features.items[i].title}</h3>
                  <p className="text-xl text-[#1a1a1a]/40 font-bold">{t.features.items[i].subtitle}</p>
                </div>
                <p className="text-xl text-[#1a1a1a]/60 font-medium leading-relaxed">{t.features.items[i].description}</p>
                <ul className="space-y-3">
                  {t.features.items[i].perks.map((p) => (
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
                <div className="relative z-10">
                  {/* Subtle Glow Optimized */}
                  <div className={`absolute -inset-10 bg-[radial-gradient(circle,rgba(0,0,0,0.1)_0%,transparent_70%)] opacity-20 pointer-events-none`} />

                  <motion.img
                    src={f.image}
                    alt={f.title}
                    whileHover={{ scale: 1.02 }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
                      scale: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                    className="max-h-[600px] w-auto rounded-[40px] mix-blend-multiply pointer-events-none select-none"
                    style={{
                      willChange: "transform",
                      filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.12))"
                    }}
                  />
                </div>
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
                <p className="text-xs font-black uppercase tracking-widest text-[#FF4800]">{t.offline.badge}</p>
                <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-[#1a1a1a]">
                  {t.offline.title}<span className="text-[#1a1a1a]/20 italic">{t.offline.italic}</span>
                </h2>
                <p className="text-xl text-[#1a1a1a]/60 font-medium leading-relaxed max-w-2xl mx-auto">
                  {t.offline.desc}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {t.offline.cards.map((item, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-white border border-stone-200 hover:border-[#FF4800]/30 hover:shadow-md transition-all space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FF4800]/10 flex items-center justify-center mx-auto">
                      {idx === 0 ? <WifiOff size={22} className="text-[#FF4800]" /> : idx === 1 ? <Smartphone size={22} className="text-[#FF4800]" /> : idx === 2 ? <ShieldCheck size={22} className="text-[#FF4800]" /> : <Zap size={22} className="text-[#FF4800]" />}
                    </div>
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
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#1a1a1a]">Ce que disent nos testeurs.</h2>
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
            <p className="text-xs font-black uppercase tracking-widest text-[#FF4800]">{t.faq.badge}</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">{t.faq.title}</h2>
          </div>
          <div className="space-y-3">
            {t.faq.items.map((faq, i) => (
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
              <Mail size={12} /> {t.waitlist.badge}
            </div>
            <h2 className="text-[clamp(3rem,9vw,7rem)] font-black tracking-[-0.04em] leading-[0.9] uppercase text-white">
              {t.waitlist.title} <br />
              {t.waitlist.titleBr}
            </h2>
            <p className="text-xl md:text-2xl text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
              {t.waitlist.desc}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            {!submitted ? (
              <div className="max-w-xl mx-auto space-y-4">
                {errorMsg && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-100 text-xs font-black uppercase tracking-widest text-center">
                    <ShieldAlert size={14} className="inline mr-2" /> {errorMsg}
                  </motion.div>
                )}
                <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 p-2 bg-black/10 border border-white/20 rounded-[24px] backdrop-blur-sm">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    placeholder={t.waitlist.placeholder}
                    className="flex-1 px-6 py-4 rounded-[18px] bg-white text-[#1a1a1a] placeholder:text-black/30 font-medium text-base focus:outline-none focus:ring-4 focus:ring-white/50 transition-all disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-4 bg-[#1a1a1a] hover:bg-black active:scale-95 text-white rounded-[18px] font-black text-sm uppercase tracking-wide transition-all whitespace-nowrap shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
                  >
                    {loading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <Zap size={16} />
                      </motion.div>
                    ) : (
                      <>
                        {t.waitlist.submit} <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-3 px-10 py-5 bg-white/20 border border-white/40 rounded-2xl text-white font-black text-lg">
                <CheckCircle2 size={24} /> {t.waitlist.success}
              </motion.div>
            )}
            <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-5">{t.waitlist.noSpam}</p>
          </motion.div>

          {/* Download links */}
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <button className="flex items-center justify-center gap-3 px-8 py-4 border border-white/30 rounded-2xl hover:bg-white/10 transition-colors font-bold text-white/80 hover:text-white">
              <Download size={18} /> App Store <span className="text-xs opacity-50">{t.waitlist.soon}</span>
            </button>
            <button className="flex items-center justify-center gap-3 px-8 py-4 border border-white/30 rounded-2xl hover:bg-white/10 transition-colors font-bold text-white/80 hover:text-white">
              <Play size={18} fill="currentColor" /> Google Play <span className="text-xs opacity-50">{t.waitlist.soon}</span>
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
                  { Icon: Facebook, href: "https://www.facebook.com/profile.php?id=61576480304371" }
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
              <h5 className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]/40">{t.footer.app}</h5>
              <ul className="space-y-4 text-sm font-bold text-[#1a1a1a]/50">
                {[
                  { label: lang === "EN" ? "Recipes" : lang === "ES" ? "Recetas" : "Recettes", id: "recipes" },
                  { label: lang === "EN" ? "Community" : lang === "ES" ? "Comunidad" : "Communauté", id: "community" },
                  { label: lang === "EN" ? "Market List" : lang === "ES" ? "Lista de Mercado" : "Liste Marché", id: "market" },
                  { label: lang === "EN" ? "Heritage" : lang === "ES" ? "Patrimonio" : "Héritage", id: "features" },
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
              <h5 className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]/40">{t.footer.legal}</h5>
              <ul className="space-y-4 text-sm font-bold text-[#1a1a1a]/50">
                {[(lang === "EN" ? "Privacy" : lang === "ES" ? "Privacidad" : "Confidentialité"), (lang === "EN" ? "Terms" : lang === "ES" ? "Condiciones" : "Conditions"), "Cookies", "Contact"].map((item) => (
                  <li
                    key={item}
                    className="hover:text-[#FF4800] cursor-pointer transition-colors"
                    onClick={() => {
                      const originalKey = item === "Privacy" || item === "Privacidad" ? "Confidentialité" : item === "Terms" || item === "Condiciones" ? "Conditions" : item;
                      setActiveModal(originalKey);
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-[#1a1a1a]/20 uppercase tracking-widest">
            <p>{t.footer.rights}</p>
            <div className="flex gap-8">
              <span>Cotonou, Bénin</span>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showTopButton && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-[150] w-14 h-14 bg-[#FF4800] text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-[#FF4800]/40 hover:bg-[#FF6A00] transition-colors"
          >
            <ChevronUp size={28} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
