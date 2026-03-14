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
import { LayoutDashboard, BookText, LayoutGrid, MessageSquare, Users, Heart, CreditCard, Bell, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (val: boolean) => void;
}

// Composant Sidebar (La barre latérale gauche)
export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{ position: 'relative' }}>
            {/* Bouton pour réduire/agrandir la barre */}
            <button
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
                <img src="/images/chef_icon_v2.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                {!isCollapsed && (
                    <>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                            <span style={{ color: 'var(--text-main)' }}>Afro</span><span style={{ color: 'var(--primary)' }}>Cuisto</span>
                        </div>
                        <span className="badge badge-primary text-xs ml-2" style={{ marginLeft: 'auto' }}>PRO</span>
                    </>
                )}
            </div>

            {/* Une ligne de séparation élégante */}
            <div style={{ height: 1, backgroundColor: 'var(--border)', margin: '0 2rem 1rem 2rem' }}></div>

            {/* Navigation : la liste des liens vers les différentes pages */}
            <nav className="sidebar-nav">
                {/* Lien vers le Tableau de bord */}
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
                    <span>Tableau de bord</span>
                </NavLink>

                {/* Lien vers la liste des Recettes */}
                <NavLink
                    to="/recipes"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <BookText size={20} style={{ marginRight: '8px' }} />
                    <span>Recettes</span>
                </NavLink>

                {/* Lien vers la gestion des Sections (rubriques de l'accueil) */}
                <NavLink
                    to="/sections"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <LayoutGrid size={20} style={{ marginRight: '8px' }} />
                    <span>Sections</span>
                </NavLink>

                {/* Lien vers la liste des Utilisateurs */}
                <NavLink
                    to="/users"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Users size={20} style={{ marginRight: '8px' }} />
                    <span>Utilisateurs</span>
                </NavLink>

                {/* Lien vers les Transactions financières */}
                <NavLink
                    to="/transactions"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <CreditCard size={20} style={{ marginRight: '8px' }} />
                    <span>Transactions</span>
                </NavLink>

                {/* Lien vers les Retours clients (avis) */}
                <NavLink
                    to="/feedback"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <MessageSquare size={20} style={{ marginRight: '8px' }} />
                    <span>Retour client</span>
                </NavLink>

                {/* Lien vers les Contributions (suggestions de plats par les gens) */}
                <NavLink
                    to="/contributions"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Heart size={20} style={{ marginRight: '8px' }} />
                    <span>Contributions Utilisateur</span>
                    <span className="badge badge-primary text-[10px] ml-auto">NEW</span>
                </NavLink>

                {/* Lien vers les Notifications Push */}
                <NavLink
                    to="/notifications"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Bell size={20} style={{ marginRight: '8px' }} />
                    <span>Notifications</span>
                    <span className="badge badge-primary text-[10px] ml-auto">NEW</span>
                </NavLink>

            </nav>

        </aside> // Fin du composant Sidebar
    );
}
