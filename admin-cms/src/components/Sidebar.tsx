/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Le menu de navigation latéral de l'espace d'administration pour passer d'une rubrique à l'autre (Recettes, Utilisateurs, Paramètres...).
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookText, LayoutGrid, MessageSquare, Users, Sparkles, CreditCard, Bell, ChevronLeft, ChevronRight, Store, ShoppingBag, ShoppingBasket, LogOut, Share2 } from 'lucide-react';
import logoAdmin from '../assets/logo_admin.png';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (val: boolean) => void;
    isMobileOpen?: boolean;
    onLogout: () => void;
}

// Composant Sidebar (La barre latérale gauche)
export function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, onLogout }: SidebarProps) {
    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`} style={{ position: 'relative' }}>
            {/* Bouton pour réduire/agrandir la barre */}
            <button
                className="sidebar-toggle"
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    position: 'absolute',
                    right: '-12px',
                    top: '40px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 100,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    color: 'var(--text-main)'
                }}
                title={isCollapsed ? "Agrandir" : "Réduire"}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Haut de la barre latérale : Logo et Nom de l'app */}
            <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={logoAdmin} alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '8px' }} />
                {!isCollapsed && (
                    <>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                            <span style={{ color: 'var(--text-main)' }}>Afro</span><span style={{ color: 'var(--primary)' }}>Cuisto</span>
                        </div>
                    </>
                )}
            </div>

            {/* Une ligne de séparation élégante */}
            <div style={{ height: 1, backgroundColor: 'var(--border)', margin: '0 2rem 1rem 2rem' }}></div>

            {/* Navigation : la liste des liens vers les différentes pages */}
            <nav className="sidebar-nav">
                <span className="nav-label">Général</span>

                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
                    <span>Tableau de bord</span>
                </NavLink>

                <span className="nav-label">Contenu</span>

                <NavLink
                    to="/recipes"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <BookText size={20} style={{ marginRight: '8px' }} />
                    <span>Recettes</span>
                </NavLink>

                <NavLink
                    to="/sections"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <LayoutGrid size={20} style={{ marginRight: '8px' }} />
                    <span>Sections</span>
                </NavLink>

                <NavLink
                    to="/contributions"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Sparkles size={20} style={{ marginRight: '8px' }} />
                    <span>Contributions</span>
                </NavLink>

                <span className="nav-label">Utilisateurs & Social</span>

                <NavLink
                    to="/beta-testers"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Sparkles size={20} style={{ marginRight: '8px' }} color="#fb5607" />
                    <span>Beta Testers</span>
                </NavLink>

                <NavLink
                    to="/users"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Users size={20} style={{ marginRight: '8px' }} />
                    <span>Utilisateurs</span>
                </NavLink>

                <NavLink
                    to="/community"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Share2 size={20} style={{ marginRight: '8px' }} />
                    <span>Communauté</span>
                </NavLink>

                <NavLink
                    to="/feedback"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <MessageSquare size={20} style={{ marginRight: '8px' }} />
                    <span>Retours Clients</span>
                </NavLink>

                <span className="nav-label">Boutique & Ventes</span>

                <NavLink
                    to="/merchants"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Store size={20} style={{ marginRight: '8px' }} />
                    <span>Marchands</span>
                </NavLink>

                <NavLink
                    to="/orders"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <ShoppingBasket size={20} style={{ marginRight: '8px' }} />
                    <span>Commandes</span>
                </NavLink>

                <NavLink
                    to="/products"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <ShoppingBag size={20} style={{ marginRight: '8px' }} />
                    <span>Produits Store</span>
                </NavLink>

                <NavLink
                    to="/transactions"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <CreditCard size={20} style={{ marginRight: '8px' }} />
                    <span>Transactions</span>
                </NavLink>

                <span className="nav-label">Communication</span>

                <NavLink
                    to="/notifications"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Bell size={20} style={{ marginRight: '8px' }} />
                    <span>Notifications Push</span>
                </NavLink>

                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                    <button
                        onClick={onLogout}
                        className="nav-item"
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            color: 'var(--danger)',
                            transition: 'all 0.2s',
                            borderRadius: '12px',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fff5f5';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <LogOut size={20} style={{ marginRight: '8px' }} />
                        {!isCollapsed && <span>Déconnexion</span>}
                    </button>
                </div>
            </nav>

        </aside> // Fin du composant Sidebar
    );
}
