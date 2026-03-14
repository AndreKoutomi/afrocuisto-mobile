/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Le tableau de bord central. Affiche des statistiques rapides (nombre total de recettes, utilisateurs récents) pour aider l'administrateur.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { useEffect, useState } from 'react'; // Outils pour gérer le cycle de vie et la mémoire du composant
import { supabase } from '../lib/supabase'; // Client pour lire les données dans la base Supabase
import { Book, Users, Star, PlusCircle, Edit, MessageSquare, History } from 'lucide-react'; // Icônes pour illustrer les statistiques

export function Dashboard() {
    // État (mémoire) pour stocker les statistiques (ex: nombre de recettes)
    const [stats, setStats] = useState({ recipes: 0, users: 0, contributions: 0 });
    // État pour savoir si on est encore en train de charger les données
    const [loading, setLoading] = useState(true);
    // État pour les activités récentes
    const [activities, setActivities] = useState<any[]>([]);

    // useEffect : s'exécute automatiquement quand la page s'affiche pour la première fois
    useEffect(() => {
        // Fonction interne pour aller chercher les chiffres dans la base de données
        async function fetchData() {
            try {
                // 1. Statistiques
                const { count: recipesCount } = await supabase
                    .from('recipes')
                    .select('*', { count: 'exact', head: true });

                const { count: suggestionsCount } = await supabase
                    .from('dish_suggestions')
                    .select('*', { count: 'exact', head: true });

                const { count: usersCount } = await supabase
                    .from('user_profiles')
                    .select('*', { count: 'exact', head: true });

                setStats({
                    recipes: recipesCount || 0,
                    users: usersCount || 0,
                    contributions: suggestionsCount || 0
                });

                // 2. Activités Récentes (Recettes)
                const { data: latestRecipes } = await supabase
                    .from('recipes')
                    .select('id, name, created_at, updated_at')
                    .order('updated_at', { ascending: false })
                    .limit(5);

                // 3. Activités Récentes (Suggestions)
                const { data: latestSuggestions } = await supabase
                    .from('dish_suggestions')
                    .select('id, name, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5);

                // Formater et fusionner
                const recipeActivities = (latestRecipes || []).map(r => {
                    const isNew = Math.abs(new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) < 2000;
                    return {
                        id: r.id,
                        type: isNew ? 'recipe_new' : 'recipe_update',
                        title: r.name,
                        date: r.updated_at,
                        icon: isNew ? <PlusCircle size={16} /> : <Edit size={16} />,
                        color: isNew ? '#059669' : '#3b82f6',
                        bg: isNew ? '#d1fae5' : '#dbeafe',
                        desc: isNew ? 'Nouvelle recette ajoutée' : 'Recette mise à jour'
                    };
                });

                const suggestionActivities = (latestSuggestions || []).map(s => ({
                    id: s.id,
                    type: 'suggestion',
                    title: s.name,
                    date: s.created_at,
                    icon: <MessageSquare size={16} />,
                    color: '#f97316',
                    bg: '#fff7ed',
                    desc: 'Nouvelle suggestion reçue'
                }));

                const allActivities = [...recipeActivities, ...suggestionActivities]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10);

                setActivities(allActivities);

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false); // On dit que le chargement est terminé
            }
        }
        fetchData();
    }, []);

    // Rendu visuel de la page
    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>

            {/* Grille de 3 colonnes pour afficher les KPI (chiffres clés) */}
            <div className="grid grid-cols-3 grid-gap-6 mb-8">
                {/* Carte 1 : Nombre de recettes */}
                <div className="card kpi-card">
                    <div className="kpi-icon-wrapper">
                        <Book size={28} />
                    </div>
                    <div className="kpi-info">
                        <p>Total Recettes</p>
                        <h3>{loading ? '...' : stats.recipes}</h3>
                    </div>
                </div>

                {/* Carte 2 : Utilisateurs actifs */}
                <div className="card kpi-card">
                    <div className="kpi-icon-wrapper" style={{ color: 'var(--success)', backgroundColor: 'rgba(5, 205, 153, 0.1)' }}>
                        <Users size={28} />
                    </div>
                    <div className="kpi-info">
                        <p>Utilisateurs Actifs</p>
                        <h3>{loading ? '...' : stats.users}</h3>
                    </div>
                </div>

                {/* Carte 3 : Contributions */}
                <div className="card kpi-card">
                    <div className="kpi-icon-wrapper" style={{ color: 'var(--warning)', backgroundColor: 'rgba(255, 206, 32, 0.1)' }}>
                        <Star size={28} />
                    </div>
                    <div className="kpi-info">
                        <p>Contributions</p>
                        <h3>{loading ? '...' : stats.contributions}</h3>
                    </div>
                </div>
            </div>

            {/* Section basse pour l'activité récente */}
            <div className="mt-8 card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title">Activité Récente</h3>
                    {!loading && activities.length > 0 && <span style={{ fontSize: '12px', color: '#9ca3af' }}>{activities.length} derniers événements</span>}
                </div>
                <div className="p-0">
                    {loading ? (
                        <div className="p-6 center-content">
                            <div className="loader"></div>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="p-12 center-content text-muted flex-col gap-4">
                            <History size={40} className="opacity-20" />
                            <p>Aucune activité récente détectée.</p>
                        </div>
                    ) : (
                        <div className="activity-list">
                            {activities.map((activity, idx) => (
                                <div
                                    key={`${activity.type}-${activity.id}-${idx}`}
                                    className="activity-item"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '16px 24px',
                                        borderBottom: idx === activities.length - 1 ? 'none' : '1px solid #f9fafb'
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
                                        flexShrink: 0
                                    }}>
                                        {activity.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                                            {activity.title}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                                            {activity.desc}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                                            {new Date(activity.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>
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
