import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Menu, X, Loader2, Search, Sun, Moon } from './components/SolarIcons';
import { Dashboard } from './pages/Dashboard';
import { RecipesList } from './pages/RecipesList';
import { RecipeForm } from './pages/RecipeForm';
import { SectionsManager } from './pages/SectionsManager';
import { SectionForm } from './pages/SectionForm';
import { Feedback } from './pages/Feedback';
import { Contributions } from './pages/Contributions';
import { UsersPage } from './pages/Users';
import { BetaTesters } from './pages/BetaTesters';
import { Notifications } from './pages/Notifications';
import { Releases } from './pages/Releases';
import { SettingsPage } from './pages/Settings';
import { Community } from './pages/Community';
import { Bugs } from './pages/Bugs';
import { Login } from './pages/Login';
import { BoutiqueAdmin } from './pages/BoutiqueAdmin';
import { supabase } from './lib/supabase';

interface AppLayoutProps {
  children: React.ReactNode;
  session: any;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

function AppLayout({ children, session, onLogout, theme, onToggleTheme }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem('afrocuisto_sidebar_collapsed') === 'true'
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const getPageTitle = () => {
    if (location.pathname === '/sections') return 'Sections d’accueil';
    if (location.pathname === '/sections/create') return 'Nouvelle Section';
    if (location.pathname.startsWith('/sections/edit')) return 'Modifier la Section';
    if (location.pathname === '/feedback') return 'Avis & Notes';
    if (location.pathname === '/bugs') return 'Rapports de Bugs';
    if (location.pathname === '/contributions') return 'Suggestions de plats';
    if (location.pathname === '/dashboard') return 'Tableau de bord';
    if (location.pathname === '/recipes') return 'Catalogue Recettes';
    if (location.pathname.startsWith('/boutique/products')) return 'Produits boutique';
    if (location.pathname.startsWith('/boutique/orders')) return 'Commandes boutique';
    if (location.pathname.startsWith('/boutique/delivery')) return 'Gestion des livraisons';
    if (location.pathname.startsWith('/recipes/create')) return 'Nouvelle Recette';
    if (location.pathname.startsWith('/recipes/edit')) return 'Modifier la Recette';
    if (location.pathname === '/users') return 'Utilisateurs';
    if (location.pathname === '/beta-testers') return 'Waitlist Bêta';
    if (location.pathname === '/notifications') return 'Notifications App';
    if (location.pathname === '/releases') return 'Mises à jour OTA';
    if (location.pathname === '/settings') return 'Paramètres IA';
    if (location.pathname === '/community') return 'Communauté';
    return 'AfroCuisto Studio';
  };

  const getBreadcrumb = () => {
    if (location.pathname.startsWith('/recipes')) return 'Contenu / Recettes';
    if (location.pathname.startsWith('/boutique')) return 'Boutique / Opérations';
    if (location.pathname.startsWith('/sections')) return 'Contenu / Sections';
    if (location.pathname.startsWith('/contributions')) return 'Contenu / Suggestions';
    if (location.pathname.startsWith('/users')) return 'Communauté / Utilisateurs';
    if (location.pathname.startsWith('/beta-testers')) return 'Communauté / Waitlist';
    if (location.pathname.startsWith('/community')) return 'Communauté / Flux';
    if (location.pathname.startsWith('/feedback')) return 'Support / Avis';
    if (location.pathname.startsWith('/bugs')) return 'Support / Bugs';
    if (location.pathname.startsWith('/notifications')) return 'Déploiement / Notifications';
    if (location.pathname.startsWith('/releases')) return 'Déploiement / OTA';
    if (location.pathname.startsWith('/settings')) return 'Configuration / Gemini IA';
    return 'Studio / Vue d’ensemble';
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = e.currentTarget.value.trim();
      if (value) {
        navigate(`/recipes?q=${encodeURIComponent(value)}`);
      }
    }
  };

  const userInitial = session?.user?.email?.charAt(0).toUpperCase() || 'A';

  return (
    <div className="app-container">
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsCollapsed={(val: boolean) => {
          setIsSidebarCollapsed(val);
          localStorage.setItem('afrocuisto_sidebar_collapsed', String(val));
        }}
        onLogout={onLogout}
      />

      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                display: 'none',
                padding: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text-main)'
              }}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <p className="page-subtitle">{getBreadcrumb()}</p>
              <h1 className="page-title">{getPageTitle()}</h1>
            </div>
          </div>

          <div className="topbar-card">
            <div
              className="topbar-search"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: '7px 14px',
                borderRadius: '12px',
              }}
            >
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Rechercher une recette..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '180px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  boxShadow: 'none',
                }}
                onKeyDown={handleSearch}
              />
            </div>

            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label="Basculer le thème"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 10px 4px 4px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '9px',
                  background: 'var(--primary-gradient)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                }}
              >
                {userInitial}
              </div>
              <div className="topbar-search" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>Admin</span>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {session?.user?.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('afrocuisto_cms_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('afrocuisto_cms_theme', theme);
  }, [theme]);

  useEffect(() => {
    const authorizedEmails = ['andre.koutomi98@gmail.com', 'deodadefassinou@gmail.com'];

    const checkSession = async (currentSession: any) => {
      if (currentSession?.user?.email && !authorizedEmails.includes(currentSession.user.email)) {
        await supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(currentSession);
      }
      setLoadingAuth(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loadingAuth) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <Loader2 className="spinning" size={40} color="#fb5607" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route
          path="/*"
          element={
            <AppLayout
              session={session}
              onLogout={handleLogout}
              theme={theme}
              onToggleTheme={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/recipes" element={<RecipesList />} />
                <Route path="/recipes/create" element={<RecipeForm />} />
                <Route path="/recipes/edit/:id" element={<RecipeForm />} />
                <Route path="/boutique" element={<Navigate to="/boutique/products" replace />} />
                <Route path="/boutique/products" element={<BoutiqueAdmin key="products" section="products" />} />
                <Route path="/boutique/orders" element={<BoutiqueAdmin key="orders" section="orders" />} />
                <Route path="/boutique/delivery" element={<BoutiqueAdmin key="delivery" section="delivery" />} />
                <Route path="/sections" element={<SectionsManager />} />
                <Route path="/sections/create" element={<SectionForm />} />
                <Route path="/sections/edit/:id" element={<SectionForm />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/beta-testers" element={<BetaTesters />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/contributions" element={<Contributions />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/releases" element={<Releases />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/community" element={<Community />} />
                <Route path="/bugs" element={<Bugs />} />
              </Routes>
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
