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

import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
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

function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('afrocuisto_sidebar_collapsed') === 'true');
  const location = useLocation();
  const navigate = useNavigate();

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
    if (location.pathname === '/users') return 'Utilisateurs';
    if (location.pathname === '/transactions') return 'Transactions';
    if (location.pathname === '/notifications') return 'Notifications Push';
    return 'Bienvenue sur AfroCuisto';
  };

  const getBreadcrumb = () => {
    if (location.pathname.startsWith('/recipes')) return 'Pages / Recettes';
    if (location.pathname.startsWith('/sections')) return 'Pages / Sections';
    if (location.pathname.startsWith('/users')) return 'Pages / Utilisateurs';
    if (location.pathname.startsWith('/transactions')) return 'Pages / Transactions';
    if (location.pathname.startsWith('/contributions')) return 'Pages / Contributions';
    if (location.pathname.startsWith('/notifications')) return 'Pages / Notifications';
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

  return (
    <div className="app-container">
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={(val: boolean) => {
        setIsSidebarCollapsed(val);
        localStorage.setItem('afrocuisto_sidebar_collapsed', String(val));
      }} />
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="page-subtitle">{getBreadcrumb()}</p>
            <h1 className="page-title">{getPageTitle()}</h1>
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
            <button className="avatar flex items-center gap-3" onClick={() => alert('Profil Administrateur bientôt disponible')}>
              <span className="badge badge-primary" style={{ cursor: 'pointer' }}>Super Admin</span>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                A
              </div>
            </button>
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
  return (
    <Router>
      <AppLayout>
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
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
