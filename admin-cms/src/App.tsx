/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Point d'entrée de l'interface d'administration. Il vérifie si l'administrateur est connecté. Si oui, il affiche le tableau de bord, sinon il le renvoie sur la page de connexion.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Menu, X, Loader2 } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { RecipesList } from './pages/RecipesList';
import { RecipeForm } from './pages/RecipeForm';
import { SectionsManager } from './pages/SectionsManager';
import { SectionForm } from './pages/SectionForm';
import { Feedback } from './pages/Feedback';
import { Contributions } from './pages/Contributions';
import { UsersPage } from './pages/Users';
import { Transactions } from './pages/Transactions';
import { Notifications } from './pages/Notifications';
import { Merchants } from './pages/Merchants';
import { Products } from './pages/Products';
import { Orders } from './pages/Orders';
import { Login } from './pages/Login';
import { supabase } from './lib/supabase';

function AppLayout({ children, session, onLogout }: { children: React.ReactNode, session: any, onLogout: () => void }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('afrocuisto_sidebar_collapsed') === 'true');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Fermer le menu mobile lors d'un changement de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const getPageTitle = () => {
    if (location.pathname === '/sections') return 'Gestion des Sections';
    if (location.pathname === '/sections/create') return 'Nouvelle Section';
    if (location.pathname === '/sections/edit/') return 'Modifier la Section';
    if (location.pathname === '/feedback') return 'Retours Clients';
    if (location.pathname === '/contributions') return 'Contributions Utilisateur';
    if (location.pathname === '/dashboard') return 'Tableau de bord';
    if (location.pathname === '/recipes') return 'Gestion des Recettes';
    if (location.pathname.startsWith('/recipes/create')) return 'Nouvelle Recette';
    if (location.pathname.startsWith('/recipes/edit')) return 'Modifier la Recette';
    if (location.pathname === '/users') return 'Utilisateurs App (Clients)';
    if (location.pathname === '/transactions') return 'Transactions';
    if (location.pathname === '/notifications') return 'Notifications Push';
    if (location.pathname === '/merchants') return 'Partenaires Marchands';
    if (location.pathname === '/products') return 'Gestion des Produits Store';
    if (location.pathname === '/orders') return 'Gestion des Commandes';
    return 'Bienvenue sur AfroCuisto';
  };

  const getBreadcrumb = () => {
    if (location.pathname.startsWith('/recipes')) return 'Pages / Recettes';
    if (location.pathname.startsWith('/sections')) return 'Pages / Sections';
    if (location.pathname.startsWith('/users')) return 'Pages / Clients App';
    if (location.pathname.startsWith('/transactions')) return 'Pages / Transactions';
    if (location.pathname.startsWith('/contributions')) return 'Pages / Contributions';
    if (location.pathname.startsWith('/notifications')) return 'Pages / Notifications';
    if (location.pathname.startsWith('/merchants')) return 'Pages / Marchands';
    if (location.pathname.startsWith('/products')) return 'Pages / Produits';
    if (location.pathname.startsWith('/orders')) return 'Pages / Commandes';
    return 'Pages / Tableau de bord';
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const target = e.currentTarget;
      if (target.value.trim()) {
        navigate(`/recipes?q=${encodeURIComponent(target.value)}`);
      }
    }
  };

  const userInitial = session?.user?.email?.charAt(0).toUpperCase() || 'A';

  return (
    <div className="app-container">
      {/* Overlay pour mobile */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Bouton Menu Mobile */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                display: 'none',
                padding: '8px',
                background: 'var(--surface)',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--text-main)'
              }}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <p className="page-subtitle">{getBreadcrumb()}</p>
              <h1 className="page-title">{getPageTitle()}</h1>
            </div>
          </div>
          <div className="topbar-card">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full" style={{ backgroundColor: '#F4F7FE', padding: '10px 20px', borderRadius: '30px' }}>
              <input
                type="text"
                placeholder="Recherche globale..."
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '200px', fontSize: '14px', color: 'var(--text-main)' }}
                onKeyDown={handleSearch}
              />
            </div>
            <div className="avatar flex items-center gap-3">
              <div className="flex flex-col items-end mr-1">
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>Admin</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{session?.user?.email}</span>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {userInitial}
              </div>
            </div>
          </div>
        </header>
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

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

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkSession(session);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F7FE' }}>
        <Loader2 className="animate-spin" size={48} color="#fb5607" />
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
            <AppLayout session={session} onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/recipes" element={<RecipesList />} />
                <Route path="/recipes/create" element={<RecipeForm />} />
                <Route path="/recipes/edit/:id" element={<RecipeForm />} />
                <Route path="/sections" element={<SectionsManager />} />
                <Route path="/sections/create" element={<SectionForm />} />
                <Route path="/sections/edit/:id" element={<SectionForm />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/contributions" element={<Contributions />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/merchants" element={<Merchants />} />
                <Route path="/products" element={<Products />} />
                <Route path="/orders" element={<Orders />} />
              </Routes>
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
