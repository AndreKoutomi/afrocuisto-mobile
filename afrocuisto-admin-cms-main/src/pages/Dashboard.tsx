import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseAdmin } from '../lib/supabase';
import {
    BookText, Users, Sparkles, PlusCircle, Edit, MessageSquare,
    History, LayoutGrid, Bug, Smartphone, Bell, ArrowUpRight
} from '../components/SolarIcons';

interface DashboardStats {
    recipes: number;
    sections: number;
    users: number;
    contributions: number;
    openBugs: number;
    releases: number;
}

export function Dashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        recipes: 0,
        sections: 0,
        users: 0,
        contributions: 0,
        openBugs: 0,
        releases: 0,
    });
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [
                    recipesRes,
                    sectionsRes,
                    usersRes,
                    suggestionsRes,
                    bugsRes,
                    releasesRes,
                    latestRecipesRes,
                    latestSuggestionsRes,
                ] = await Promise.all([
                    supabaseAdmin.from('recipes').select('*', { count: 'exact', head: true }),
                    supabaseAdmin.from('home_sections').select('*', { count: 'exact', head: true }).eq('is_active', true),
                    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
                    supabaseAdmin.from('dish_suggestions').select('*', { count: 'exact', head: true }),
                    supabaseAdmin.from('bug_reports').select('*', { count: 'exact', head: true }).in('status', ['Nouveau', 'En cours', 'open', 'in_progress']),
                    supabaseAdmin.from('app_releases').select('*', { count: 'exact', head: true }),
                    supabaseAdmin.from('recipes').select('id, name, created_at, updated_at').order('updated_at', { ascending: false }).limit(5),
                    supabaseAdmin.from('dish_suggestions').select('id, dish_name, created_at').order('created_at', { ascending: false }).limit(5),
                ]);

                setStats({
                    recipes: recipesRes.count || 0,
                    sections: sectionsRes.count || 0,
                    users: usersRes.count || 0,
                    contributions: suggestionsRes.count || 0,
                    openBugs: bugsRes.count || 0,
                    releases: releasesRes.count || 0,
                });

                const recipeActivities = (latestRecipesRes.data || []).map(r => {
                    const isNew = Math.abs(new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) < 2000;
                    return {
                        id: r.id,
                        type: isNew ? 'recipe_new' : 'recipe_update',
                        title: r.name,
                        date: r.updated_at,
                        icon: isNew ? <PlusCircle size={16} /> : <Edit size={16} />,
                        color: isNew ? '#10b981' : '#3b82f6',
                        bg: isNew ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                        desc: isNew ? 'Nouvelle recette ajoutée' : 'Recette mise à jour',
                    };
                });

                const suggestionActivities = (latestSuggestionsRes.data || []).map(s => ({
                    id: s.id,
                    type: 'suggestion',
                    title: s.dish_name,
                    date: s.created_at,
                    icon: <MessageSquare size={16} />,
                    color: '#fb5607',
                    bg: 'rgba(251, 86, 7, 0.12)',
                    desc: 'Nouvelle suggestion reçue',
                }));

                const allActivities = [...recipeActivities, ...suggestionActivities]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 8);

                setActivities(allActivities);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const kpis = [
        { label: 'Recettes publiées', value: stats.recipes, icon: BookText, color: '#fb5607', bg: 'rgba(251, 86, 7, 0.12)', to: '/recipes' },
        { label: 'Sections actives', value: stats.sections, icon: LayoutGrid, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)', to: '/sections' },
        { label: 'Utilisateurs inscrits', value: stats.users, icon: Users, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', to: '/users' },
        { label: 'Suggestions de plats', value: stats.contributions, icon: Sparkles, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', to: '/contributions' },
        { label: 'Bugs ouverts', value: stats.openBugs, icon: Bug, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', to: '/bugs' },
        { label: 'Releases OTA', value: stats.releases, icon: Smartphone, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', to: '/releases' },
    ];

    const quickActions = [
        { label: 'Nouvelle Recette', desc: 'Ajouter un plat au catalogue', to: '/recipes/create', icon: BookText },
        { label: 'Nouvelle Section', desc: 'Organiser l’écran d’accueil', to: '/sections/create', icon: LayoutGrid },
        { label: 'Publier Release OTA', desc: 'Déployer un APK Android', to: '/releases', icon: Smartphone },
        { label: 'Notification App', desc: 'Informer les utilisateurs', to: '/notifications', icon: Bell },
    ];

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
            {/* Grille KPI */}
            <div className="grid-responsive-3" style={{ marginBottom: '24px' }}>
                {kpis.map(kpi => {
                    const Icon = kpi.icon;
                    return (
                        <Link key={kpi.label} to={kpi.to} className="card kpi-card" style={{ textDecoration: 'none' }}>
                            <div className="kpi-icon-wrapper" style={{ color: kpi.color, backgroundColor: kpi.bg }}>
                                <Icon size={22} />
                            </div>
                            <div className="kpi-info" style={{ flex: 1 }}>
                                <p>{kpi.label}</p>
                                <h3>{loading ? '—' : kpi.value}</h3>
                            </div>
                            <ArrowUpRight size={16} color="var(--text-muted)" />
                        </Link>
                    );
                })}
            </div>

            {/* Actions Rapides */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
                    Actions rapides
                </h2>
                <div className="grid-responsive-stats" style={{ marginBottom: 0 }}>
                    {quickActions.map(action => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.label}
                                to={action.to}
                                className="card"
                                style={{
                                    padding: '16px 18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    textDecoration: 'none',
                                }}
                            >
                                <div style={{ width: 38, height: 38, borderRadius: '11px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={18} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>{action.label}</div>
                                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>{action.desc}</div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Activité récente */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Activité récente</h3>
                    {!loading && activities.length > 0 && (
                        <span className="badge badge-primary">{activities.length} événements</span>
                    )}
                </div>
                <div>
                    {loading ? (
                        <div className="p-6 center-content">
                            <div className="loader" />
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="p-12 center-content text-muted flex-col gap-3">
                            <History size={34} style={{ opacity: 0.35 }} />
                            <p style={{ fontSize: '13.5px', fontWeight: 600 }}>Aucune activité récente détectée.</p>
                        </div>
                    ) : (
                        <div>
                            {activities.map((activity, idx) => (
                                <div
                                    key={`${activity.type}-${activity.id}-${idx}`}
                                    className="list-item-responsive"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '14px 24px',
                                        borderBottom: idx === activities.length - 1 ? 'none' : '1px solid var(--border)',
                                    }}
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: activity.bg,
                                        color: activity.color,
                                        flexShrink: 0,
                                    }}>
                                        {activity.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                                            {activity.title}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {activity.desc}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                            {new Date(activity.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {new Date(activity.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
