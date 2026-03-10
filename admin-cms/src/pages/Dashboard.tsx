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

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Book, Users, Star } from 'lucide-react';

export function Dashboard() {
    const [stats, setStats] = useState({ recipes: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const { count, error } = await supabase
                    .from('recipes')
                    .select('*', { count: 'exact', head: true });

                if (!error && count !== null) {
                    setStats({ recipes: count });
                }
            } catch (err) {
                console.error('Error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    return (
        <div>
            <h2 className="mb-6 font-bold text-2xl">Aperçu</h2>
            <div className="grid grid-cols-3 grid-gap-6 mb-8">
                <div className="card kpi-card">
                    <div className="kpi-icon-wrapper">
                        <Book size={28} />
                    </div>
                    <div className="kpi-info">
                        <p>Total Recettes</p>
                        <h3>{loading ? '...' : stats.recipes}</h3>
                    </div>
                </div>

                <div className="card kpi-card">
                    <div className="kpi-icon-wrapper" style={{ color: 'var(--success)', backgroundColor: 'rgba(5, 205, 153, 0.1)' }}>
                        <Users size={28} />
                    </div>
                    <div className="kpi-info">
                        <p>Utilisateurs Actifs</p>
                        <h3>14</h3>
                    </div>
                </div>

                <div className="card kpi-card">
                    <div className="kpi-icon-wrapper" style={{ color: 'var(--warning)', backgroundColor: 'rgba(255, 206, 32, 0.1)' }}>
                        <Star size={28} />
                    </div>
                    <div className="kpi-info">
                        <p>Avis & Notes</p>
                        <h3>4.8</h3>
                    </div>
                </div>
            </div>

            <div className="mt-8 card">
                <div className="card-header">
                    <h3 className="card-title">Activité Récente</h3>
                </div>
                <div className="p-6 center-content text-muted">
                    L'historique des modifications apparaîtra ici.
                </div>
            </div>
        </div>
    );
}
