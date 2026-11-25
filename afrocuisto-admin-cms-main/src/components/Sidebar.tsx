import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, BookText, LayoutGrid, MessageSquare, Users,
    Sparkles, Bell, ChevronLeft, ChevronRight, LogOut, Share2,
    Bug, Smartphone, UserCheck, Settings
} from './SolarIcons';
import logoAdmin from '../assets/logo_admin.png';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (val: boolean) => void;
    isMobileOpen?: boolean;
    onLogout: () => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, onLogout }: SidebarProps) {
    return (
        <aside
            className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
            style={{ position: 'relative' }}
        >
            <button
                className="sidebar-toggle"
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    position: 'absolute',
                    right: '-13px',
                    top: '26px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 30,
                    boxShadow: 'var(--shadow-sm)',
                    color: 'var(--text-main)'
                }}
                title={isCollapsed ? 'Agrandir le menu' : 'Réduire le menu'}
                aria-label={isCollapsed ? 'Agrandir le menu' : 'Réduire le menu'}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className="sidebar-header">
                <img
                    src={logoAdmin}
                    alt="AfroCuisto"
                    style={{
                        width: '36px',
                        height: '36px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        flexShrink: 0,
                    }}
                />
                {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                            <span style={{ color: 'var(--text-main)' }}>Afro</span>
                            <span style={{ color: 'var(--primary)' }}>Cuisto</span>
                        </div>
                        <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            marginTop: '2px',
                        }}>
                            Studio CMS
                        </span>
                    </div>
                )}
            </div>

            <nav className="sidebar-nav">
                <span className="nav-label">Général</span>

                <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={18} />
                    <span>Tableau de bord</span>
                </NavLink>

                <span className="nav-label">Contenu App</span>

                <NavLink to="/recipes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <BookText size={18} />
                    <span>Recettes</span>
                </NavLink>

                <NavLink to="/sections" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <LayoutGrid size={18} />
                    <span>Sections d’accueil</span>
                </NavLink>

                <NavLink to="/contributions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Sparkles size={18} />
                    <span>Suggestions plats</span>
                </NavLink>

                <span className="nav-label">Communauté & Support</span>

                <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Users size={18} />
                    <span>Utilisateurs</span>
                </NavLink>

                <NavLink to="/community" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Share2 size={18} />
                    <span>Communauté</span>
                </NavLink>

                <NavLink to="/feedback" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <MessageSquare size={18} />
                    <span>Avis & Notes</span>
                </NavLink>

                <NavLink to="/bugs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Bug size={18} />
                    <span>Rapports de Bugs</span>
                </NavLink>

                <NavLink to="/beta-testers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <UserCheck size={18} />
                    <span>Waitlist Bêta</span>
                </NavLink>

                <span className="nav-label">Déploiement</span>

                <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Bell size={18} />
                    <span>Notifications App</span>
                </NavLink>

                <NavLink to="/releases" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Smartphone size={18} />
                    <span>Mises à jour OTA</span>
                </NavLink>

                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Settings size={18} />
                    <span>Paramètres IA</span>
                </NavLink>
            </nav>

            <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
                <button
                    onClick={onLogout}
                    className="nav-item"
                    style={{
                        width: '100%',
                        color: 'var(--danger)',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                    }}
                    title="Déconnexion"
                >
                    <LogOut size={18} />
                    {!isCollapsed && <span>Déconnexion</span>}
                </button>
            </div>
        </aside>
    );
}
