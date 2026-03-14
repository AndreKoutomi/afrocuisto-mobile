/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Vue permettant à l'administrateur de valider ou rejeter les suggestions de plats (contributions) envoyées par les utilisateurs.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Utensils, Calendar } from 'lucide-react';

// Suggestions de plats récupérées depuis l'application mobile
interface DishSuggestion {
    id: string;
    name: string;
    ingredients: string;
    description: string;
    created_at: string;
}

function parseSuggestionDescription(description: string) {
    const [mainDescription, extraBlock] = description.split('\n\n---\nInformations complémentaires\n');
    const extras = (extraBlock || '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    return {
        mainDescription: mainDescription?.trim() || '',
        extras,
    };
}

export function Contributions() {
    const [suggestions, setSuggestions] = useState<DishSuggestion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSuggestions();
    }, []);

    async function fetchSuggestions() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('dish_suggestions')
                .select('*')
                .order('created_at', { ascending: false });
            if (error && error.code !== '42P01') throw error;
            setSuggestions(data || []);
        } catch (err) {
            console.error('Erreur lors de la récupération des suggestions:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #f3f4f6', borderTopColor: '#fb5607', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#9ca3af', fontWeight: 600, fontSize: 14 }}>Chargement des contributions...</p>
        </div>
    );

    return (
        <div style={{ width: '100%', boxSizing: 'border-box', paddingBottom: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>Communauté AfroCuisto</p>

                </div>
                <button
                    onClick={fetchSuggestions}
                    style={{
                        width: 44, height: 44, borderRadius: 14,
                        border: '1.5px solid #e5e7eb', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#6b7280',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease'
                    }}
                    title="Actualiser les suggestions"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {suggestions.length === 0 ? (
                <div style={{
                    background: '#fff',
                    borderRadius: 32,
                    padding: '80px 40px',
                    border: '1px dashed #e5e7eb',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16
                }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb5607' }}>
                        <Utensils size={32} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#4b5563' }}>
                            {loading === false && suggestions.length === 0 ? "Aucune suggestion" : "Initialisation requise"}
                        </p>
                        <p style={{ margin: '4px 0 20px', fontSize: 14, color: '#9ca3af', maxWidth: 400 }}>
                            Pour recevoir les suggestions de vos utilisateurs, vous devez créer la table correspondante dans Supabase.
                        </p>

                        <div style={{ padding: 20, background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 20, textAlign: 'left', width: '100%', maxWidth: 500 }}>
                            <p style={{ fontSize: 12, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', marginBottom: 12 }}>Action requise : SQL Editor</p>
                            <code style={{ fontSize: 11, color: '#b91c1c', display: 'block', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: '#fff', padding: 15, borderRadius: 12, border: '1px solid #fecaca' }}>
                                {`CREATE TABLE dish_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  description TEXT NOT NULL,
  region TEXT,
  category TEXT,
  cooking_time TEXT,
  submitter_name TEXT,
  submitter_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dish_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert" ON dish_suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view" ON dish_suggestions FOR SELECT USING (true);`}
                            </code>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
                    {suggestions.map((suggestion) => {
                        const parsed = parseSuggestionDescription(suggestion.description || '');
                        return (
                            <div
                                key={suggestion.id}
                                style={{
                                    background: '#fff',
                                    borderRadius: 32,
                                    border: '1px solid #f0f0f0',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                    padding: 26,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 20,
                                    transition: 'transform 0.2s ease',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fb5607' }}>Nouveau Plat</p>
                                        <h3 style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 900, color: '#111827', lineHeight: 1.2 }}>{suggestion.name}</h3>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af', flexShrink: 0 }}>
                                        <Calendar size={12} />
                                        <span style={{ fontSize: 11, fontWeight: 700 }}>
                                            {new Date(suggestion.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>Ingrédients clés</p>
                                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#374151', padding: '12px 16px', background: '#f9fafb', borderRadius: 16, border: '1px solid #f3f4f6' }}>
                                        {suggestion.ingredients}
                                    </p>
                                </div>

                                <div>
                                    <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>Description / Histoire</p>
                                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#4b5563' }}>{parsed.mainDescription || '—'}</p>
                                </div>

                                {parsed.extras.length > 0 && (
                                    <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {parsed.extras.map((line, index) => {
                                                const [label, value] = line.split(':');
                                                return (
                                                    <div
                                                        key={`${suggestion.id}-${index}`}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#fff7ed',
                                                            borderRadius: 10,
                                                            fontSize: 11,
                                                            color: '#c2410c',
                                                            border: '1px solid #ffedd5',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        <span style={{ opacity: 0.7, marginRight: 4 }}>{label}:</span>
                                                        <span>{value}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
