/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : La page qui liste toutes les recettes enregistrées dans la base de données sous forme de tableau interactif (recherche, filtre, suppression).
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { useEffect, useState, useMemo } from 'react'; // Hooks React pour le cycle de vie et le calcul optimisé
import { supabase } from '../lib/supabase'; // Client pour communiquer avec la base de données
import { Plus, Edit2, Trash2, Search, RefreshCw, ChefHat, Clock, MapPin, Filter, X, Sparkles } from 'lucide-react'; // Collection d'icônes
import { Link, useSearchParams } from 'react-router-dom'; // Outils de navigation
import { RecipeAIWizard } from '../components/RecipeAIWizard'; // Composant assistant IA

// Définition des catégories avec leurs couleurs pour l'affichage
const CATEGORIES = [
    { value: "Pâtes et Céréales (Wɔ̌)", label: "Pâtes & Céréales", color: '#d97706', bg: '#fef3c7' },
    { value: "Sauces (Nùsúnnú)", label: "Sauces", color: '#059669', bg: '#d1fae5' },
    { value: "Plats de Résistance & Ragoûts", label: "Plats de résistance", color: '#dc2626', bg: '#fee2e2' },
    { value: "Protéines & Grillades", label: "Grillades", color: '#7c3aed', bg: '#ede9fe' },
    { value: "Street Food & Snacks (Amuse-bouche)", label: "Street Food", color: '#0891b2', bg: '#e0f2fe' },
    { value: "Boissons & Douceurs", label: "Boissons", color: '#db2777', bg: '#fce7f3' },
    { value: "Condiments & Accompagnements", label: "Condiments", color: '#65a30d', bg: '#ecfccb' },
];

// Styles pour les badges de difficulté
const DIFFICULTY_META: Record<string, { color: string; bg: string }> = {
    'Facile': { color: '#059669', bg: '#d1fae5' },
    'Moyen': { color: '#d97706', bg: '#fef3c7' },
    'Difficile': { color: '#dc2626', bg: '#fee2e2' },
};

// Fonction utilitaire pour trouver le style d'une catégorie
function getCategoryMeta(cat: string) {
    return CATEGORIES.find(c => c.value === cat) || { label: cat, color: '#6b7280', bg: '#f3f4f6' };
}

// Composant principal de la page
export function RecipesList() {
    // Gestion de l'URL pour la recherche (mémoriser ce qu'on cherche)
    const [searchParams, setSearchParams] = useSearchParams();

    // Etats de la page
    const [recipes, setRecipes] = useState<any[]>([]); // Liste de toutes les recettes
    const [loading, setLoading] = useState(true); // Est-ce qu'on charge les données ?
    const [deletingId, setDeletingId] = useState<string | null>(null); // Id de la recette en cours de suppression
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || ''); // Texte de recherche
    const [filterCategory, setFilterCategory] = useState(''); // Filtre par catégorie
    const [filterDifficulty, setFilterDifficulty] = useState(''); // Filtre par difficulté
    const [showAIWizard, setShowAIWizard] = useState(false); // Est-ce qu'on montre l'assistant IA ?

    // Fonction pour charger les recettes depuis Supabase
    async function fetchRecipes() {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('recipes').select('*').order('name');
            if (error) throw error;
            if (data) setRecipes(data);
        } catch (err) {
            console.error('Error fetching recipes:', err);
        } finally {
            setLoading(false);
        }
    }

    // On charge les recettes au premier affichage
    useEffect(() => { fetchRecipes(); }, []);

    // Mise à jour de la barre de recherche selon l'URL
    useEffect(() => {
        const q = searchParams.get('q');
        if (q !== null) setSearchTerm(q);
    }, [searchParams]);

    // Mise à jour de l'URL quand on tape dans la recherche
    useEffect(() => {
        if (searchTerm) setSearchParams({ q: searchTerm }, { replace: true });
        else { searchParams.delete('q'); setSearchParams(searchParams, { replace: true }); }
    }, [searchTerm]);

    // Filtrage dynamique de la liste des recettes (sans recharger la page)
    const filteredRecipes = useMemo(() => {
        return recipes.filter(r => {
            const matchSearch = !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()) || (r.region || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchCat = !filterCategory || r.category === filterCategory;
            const matchDiff = !filterDifficulty || r.difficulty === filterDifficulty;
            return matchSearch && matchCat && matchDiff;
        });
    }, [recipes, searchTerm, filterCategory, filterDifficulty]);

    // Fonction de suppression d'une recette
    async function handleDelete(id: string) {
        if (!window.confirm('Supprimer cette recette ?')) return;
        setDeletingId(id);
        try {
            const { error } = await supabase.from('recipes').delete().eq('id', id);
            if (error) throw error;
            // On retire la recette de l'écran sans tout recharger
            setRecipes(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error('Failed to delete:', err);
            alert('Erreur lors de la suppression.');
        } finally {
            setDeletingId(null);
        }
    }

    const hasActiveFilters = searchTerm || filterCategory || filterDifficulty;

    // Styles CSS réutilisables dans le code
    const inputStyle: React.CSSProperties = {
        height: '42px', borderRadius: '12px',
        border: '1.5px solid #e5e7eb', fontSize: '13px', fontWeight: 500,
        color: '#111827', backgroundColor: '#fff',
        padding: '0 14px', outline: 'none', transition: 'border-color 0.2s',
    };

    const cardStyle: React.CSSProperties = {
        background: '#fff', borderRadius: '20px',
        border: '1px solid #f0f0f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    };

    // --- RENDU VISUEL (HTML) ---
    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>

            {/* En-tête de la page */}
            <div className="flex-responsive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>Gérez les plats et spécialités culinaires</p>
                </div>
                {/* Boutons d'action (Refresh, IA, Ajout) */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={fetchRecipes}
                        style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: '#f3f4f6', border: '1px solid #e5e7eb',
                            cursor: 'pointer', color: '#6b7280',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        title="Rafraîchir"
                    >
                        <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                    <button
                        onClick={() => setShowAIWizard(true)}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                            color: '#fff', border: 'none',
                            borderRadius: '14px', padding: '10px 18px',
                            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(109,40,217,0.3)',
                        }}
                    >
                        <Sparkles size={16} /> Générer par IA
                    </button>
                    <Link
                        to="/recipes/create"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: 'var(--primary)', color: '#fff', textDecoration: 'none',
                            borderRadius: '14px', padding: '10px 20px',
                            fontSize: '14px', fontWeight: 700,
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                        }}
                    >
                        <Plus size={17} /> Nouvelle Recette
                    </Link>
                </div>
            </div>

            {/* Barre de statistiques (Chiffres clés) */}
            <div className="grid-responsive-stats">
                {[
                    { label: 'Total recettes', value: recipes.length, icon: ChefHat, color: 'var(--primary)', bg: '#fff5f0' },
                    { label: 'Résultats', value: filteredRecipes.length, icon: Search, color: '#059669', bg: '#d1fae5' },
                    { label: 'Catégories', value: [...new Set(recipes.map(r => r.category).filter(Boolean))].length, icon: Filter, color: '#d97706', bg: '#fef3c7' },
                    { label: 'Régions', value: [...new Set(recipes.map(r => r.region).filter(Boolean))].length, icon: MapPin, color: '#0891b2', bg: '#e0f2fe' },
                ].map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} style={{ ...cardStyle, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={17} color={stat.color} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{stat.value}</p>
                                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Barre de filtres (Recherche et Sélecteurs) */}
            <div className="flex-responsive" style={{ ...cardStyle, padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 100%', minWidth: '220px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '13px' }} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou région..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ ...inputStyle, width: '100%', paddingLeft: '38px' }}
                    />
                </div>

                <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    style={{ ...inputStyle, flex: '1 1 auto', minWidth: '160px', cursor: 'pointer', color: filterCategory ? '#111827' : '#9ca3af' }}
                >
                    <option value="">Toutes les catégories</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>

                <select
                    value={filterDifficulty}
                    onChange={e => setFilterDifficulty(e.target.value)}
                    style={{ ...inputStyle, flex: '1 1 auto', minWidth: '140px', cursor: 'pointer', color: filterDifficulty ? '#111827' : '#9ca3af' }}
                >
                    <option value="">Toute difficulté</option>
                    <option value="Facile">Facile</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Difficile">Difficile</option>
                </select>

                {hasActiveFilters && (
                    <button
                        onClick={() => { setSearchTerm(''); setFilterCategory(''); setFilterDifficulty(''); }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '0 14px', height: '42px', borderRadius: '12px',
                            background: '#fee2e2', border: 'none', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 700, color: '#ef4444',
                        }}
                    >
                        <X size={14} /> Effacer
                    </button>
                )}
            </div>

            {/* Tableau des recettes */}
            <div className="table-mobile-card" style={{ ...cardStyle, width: '100%', overflowX: 'auto', boxSizing: 'border-box' }}>
                {loading ? (
                    // On affiche des barres de chargement (shimmer) si c'est en cours
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} style={{
                                height: '72px', borderRadius: '14px',
                                background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
                                backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
                            }} />
                        ))}
                    </div>
                ) : filteredRecipes.length === 0 ? (
                    // Si rien ne correspond à la recherche
                    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                        <div style={{ width: '60px', height: '60px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                            <ChefHat size={28} color="#d1d5db" />
                        </div>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#374151' }}>Aucune recette trouvée</p>
                        <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#9ca3af' }}>Modifiez vos filtres ou ajoutez une nouvelle recette.</p>
                    </div>
                ) : (
                    <>
                        {/* En-tête du tableau (noms des colonnes) */}
                        <div className="table-header-hidden" style={{
                            display: 'grid',
                            gridTemplateColumns: '56px 1fr 130px 160px 100px 110px',
                            gap: '0 12px',
                            padding: '12px 20px',
                            background: '#f9fafb',
                            borderRadius: '20px 20px 0 0',
                            borderBottom: '1px solid #f0f0f0',
                        }}>
                            {['Image', 'Nom', 'Région', 'Catégorie', 'Difficulté', 'Actions'].map(h => (
                                <span key={h} style={{ fontSize: '10px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                            ))}
                        </div>

                        {/* Liste des lignes (Une ligne par recette) */}
                        <>
                            {filteredRecipes.map((recipe, idx) => {
                                const catMeta = getCategoryMeta(recipe.category);
                                const diffMeta = DIFFICULTY_META[recipe.difficulty] || { color: '#6b7280', bg: '#f3f4f6' };
                                const isDeleting = deletingId === recipe.id;

                                return (
                                    <div
                                        key={recipe.id}
                                        className="recipe-mobile-row"
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '56px 1fr 130px 160px 100px 110px',
                                            gap: '0 12px',
                                            alignItems: 'center',
                                            padding: '10px 8px',
                                            borderRadius: '14px',
                                            borderBottom: idx < filteredRecipes.length - 1 ? '1px solid #f9fafb' : 'none',
                                            transition: 'background 0.15s',
                                            opacity: isDeleting ? 0.4 : 1,
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        {/* Colonne 1 : Image du plat */}
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                                            {recipe.image ? (
                                                <img
                                                    src={recipe.image}
                                                    alt={recipe.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={e => { e.currentTarget.style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <ChefHat size={18} color="#d1d5db" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Colonne 2 : Nom et Temps de préparation */}
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {recipe.name}
                                            </p>
                                            {recipe.prep_time && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                                                    <Clock size={11} color="#9ca3af" />
                                                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>{recipe.prep_time}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Colonne 3 : Région d'origine */}
                                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {recipe.region ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={11} color="#9ca3af" /> {recipe.region}
                                                </span>
                                            ) : '—'}
                                        </p>

                                        {/* Colonne 4 : Badge de Catégorie */}
                                        <div style={{ minWidth: 0 }}>
                                            <span style={{
                                                display: 'inline-block', fontSize: '10px', fontWeight: 700,
                                                color: catMeta.color, background: catMeta.bg,
                                                borderRadius: '8px', padding: '3px 10px',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                maxWidth: '155px',
                                            }}>
                                                {catMeta.label || recipe.category || '—'}
                                            </span>
                                        </div>

                                        {/* Colonne 5 : Badge de Difficulté */}
                                        <div>
                                            {recipe.difficulty ? (
                                                <span style={{
                                                    display: 'inline-block', fontSize: '10px', fontWeight: 700,
                                                    color: diffMeta.color, background: diffMeta.bg,
                                                    borderRadius: '8px', padding: '3px 10px',
                                                }}>
                                                    {recipe.difficulty}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#d1d5db', fontSize: '13px' }}>—</span>
                                            )}
                                        </div>

                                        {/* Colonne 6 : Boutons Modifier / Supprimer */}
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <Link
                                                to={`/recipes/edit/${recipe.id}`}
                                                style={{
                                                    width: '34px', height: '34px', borderRadius: '10px',
                                                    background: '#f3f4f6', border: '1px solid #e5e7eb',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#6b7280', textDecoration: 'none', transition: 'all 0.15s',
                                                }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e5e7eb'; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; }}
                                            >
                                                <Edit2 size={14} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(recipe.id)}
                                                disabled={isDeleting}
                                                style={{
                                                    width: '34px', height: '34px', borderRadius: '10px',
                                                    background: '#fff5f5', border: '1px solid #fee2e2',
                                                    cursor: 'pointer', color: '#ef4444',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.15s',
                                                }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fee2e2'; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff5f5'; }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </>

                        {/* Bas du tableau : Compteur de résultats */}
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', background: '#fafafa', borderRadius: '0 0 20px 20px' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>
                                {filteredRecipes.length} recette{filteredRecipes.length !== 1 ? 's' : ''} affichée{filteredRecipes.length !== 1 ? 's' : ''}
                                {recipes.length !== filteredRecipes.length && ` sur ${recipes.length}`}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Styles d'animation CSS */}
            <style>{`
                @keyframes shimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position:  200% 0; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>

            {/* Fenêtre surgissante (Modal) de l'assistant IA */}
            {showAIWizard && (
                <RecipeAIWizard
                    onClose={() => setShowAIWizard(false)}
                    onSaved={() => { fetchRecipes(); }}
                />
            )}
        </div>
    );
}
