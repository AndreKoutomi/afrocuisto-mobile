import { useState, useEffect } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import { AdminSelect } from '../components/AdminSelect';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Search, Utensils, CheckCircle2 } from '../components/SolarIcons';
import { APP_SECTION_TYPES, getAppSectionTypeMeta } from '../lib/sectionTypes';

interface RecipeSummary {
    id: string;
    name: string;
    category: string;
    image: string;
    region: string;
    prep_time: string;
}

export function SectionForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [sectionType, setSectionType] = useState(APP_SECTION_TYPES[0].value);
    const [orderIndex, setOrderIndex] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [itemIds, setItemIds] = useState<string[]>([]);

    const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: recipeData } = await supabaseAdmin
                    .from('recipes')
                    .select('id, name, category, image, region, prep_time')
                    .order('name');
                if (recipeData) setRecipes(recipeData);

                if (id) {
                    const { data: sectionData, error } = await supabaseAdmin
                        .from('home_sections')
                        .select('*')
                        .eq('id', id)
                        .single();
                    if (sectionData && !error) {
                        setTitle(sectionData.title || '');
                        setSectionType(sectionData.section_type || 'recipes');
                        setOrderIndex(sectionData.order_index ?? 0);
                        setIsActive(sectionData.is_active ?? true);
                        setItemIds(sectionData.item_ids || []);
                    }
                }
            } catch (err) {
                console.error('Erreur chargement section:', err);
            } finally {
                setInitialLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const toggleRecipe = (recipeId: string) => {
        setItemIds(prev =>
            prev.includes(recipeId) ? prev.filter(x => x !== recipeId) : [...prev, recipeId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Le titre de la section est requis.');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                title: title.trim(),
                section_type: sectionType,
                item_ids: itemIds,
                order_index: Number(orderIndex) || 0,
                is_active: isActive,
            };

            if (id) {
                const { error } = await supabaseAdmin.from('home_sections').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabaseAdmin.from('home_sections').insert([payload]);
                if (error) throw error;
            }
            navigate('/sections');
        } catch (err: any) {
            alert('Erreur lors de l’enregistrement : ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredRecipes = recipes.filter(r =>
        !searchTerm ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (initialLoading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Chargement...</div>;
    }

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <Link
                to="/sections"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontWeight: 700, fontSize: '13px', textDecoration: 'none', marginBottom: '20px' }}
            >
                <ArrowLeft size={16} /> Retour aux sections
            </Link>

            <form onSubmit={handleSubmit} className="card" style={{ padding: '28px', borderRadius: '22px' }}>
                <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 800, color: '#111827' }}>
                    {id ? 'Modifier la Section' : 'Nouvelle Section d’Accueil'}
                </h2>

                <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                            Titre de la section *
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Plats populaires du Bénin"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                            Type d’affichage
                        </label>
                        <AdminSelect
                            ariaLabel="Type d’affichage"
                            value={sectionType}
                            onChange={setSectionType}
                            options={APP_SECTION_TYPES.map(type => ({ value: type.value, label: type.label }))}
                            style={{ width: '100%' }}
                            triggerStyle={{ height: '46px' }}
                        />
                        <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            {getAppSectionTypeMeta(sectionType).description}
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                            Ordre d’affichage
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={orderIndex}
                            onChange={e => setOrderIndex(Number(e.target.value))}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '24px' }}>
                        <input
                            id="is_active_section"
                            type="checkbox"
                            checked={isActive}
                            onChange={e => setIsActive(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                        />
                        <label htmlFor="is_active_section" style={{ fontSize: '14px', fontWeight: 700, color: '#111827', cursor: 'pointer' }}>
                            Section active (visible dans l’app)
                        </label>
                    </div>
                </div>

                <div style={{ marginTop: '24px', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>
                                Recettes incluses ({itemIds.length} sélectionnée{itemIds.length > 1 ? 's' : ''})
                            </h3>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
                                Sélectionnez les recettes à afficher dans cette section.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f9fafb', padding: '8px 14px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                            <Search size={15} color="#9ca3af" />
                            <input
                                type="text"
                                placeholder="Filtrer les recettes..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '180px' }}
                            />
                        </div>
                    </div>

                    {filteredRecipes.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', background: '#f9fafb', borderRadius: '14px', color: '#9ca3af', fontSize: '13px' }}>
                            <Utensils size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                            Aucune recette trouvée dans le catalogue.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', maxHeight: '380px', overflowY: 'auto', padding: '4px' }}>
                            {filteredRecipes.map(recipe => {
                                const selected = itemIds.includes(recipe.id);
                                return (
                                    <div
                                        key={recipe.id}
                                        onClick={() => toggleRecipe(recipe.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '10px',
                                            borderRadius: '14px',
                                            border: selected ? '2px solid var(--primary)' : '1px solid #e5e7eb',
                                            background: selected ? '#fff7ed' : '#fff',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {recipe.image ? (
                                            <img src={recipe.image} alt={recipe.name} style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                                        ) : (
                                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Utensils size={16} color="#9ca3af" />
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {recipe.name}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {recipe.region || recipe.category || recipe.id}
                                            </div>
                                        </div>
                                        {selected && <CheckCircle2 size={18} color="var(--primary)" style={{ flexShrink: 0 }} />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
                    <Link
                        to="/sections"
                        style={{ padding: '12px 20px', borderRadius: '12px', background: '#f3f4f6', color: '#374151', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                    >
                        <Save size={16} /> {loading ? 'Enregistrement...' : 'Enregistrer la section'}
                    </button>
                </div>
            </form>
        </div>
    );
}
