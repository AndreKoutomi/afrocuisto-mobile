import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { RecipesList } from './pages/RecipesList';
import { RecipeForm } from './pages/RecipeForm';
import { SectionsManager } from './pages/SectionsManager';
import { SectionForm } from './pages/SectionForm';
import { Feedback } from './pages/Feedback';

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    if (location.pathname === '/sections') return 'Gestion des Sections';
    if (location.pathname === '/sections/create') return 'Nouvelle Section';
    if (location.pathname === '/sections/edit/') return 'Modifier la Section';
    if (location.pathname === '/feedback') return 'Retours Clients';
    if (location.pathname === '/dashboard') return 'Tableau de bord';
    return 'Bienvenue sur AfriHub';
  };

  const getBreadcrumb = () => {
    if (location.pathname.startsWith('/sections')) return 'Pages / Sections';
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
      <Sidebar />
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
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#4318FF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
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
          <Route path="/feedback" element={<Feedback />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
