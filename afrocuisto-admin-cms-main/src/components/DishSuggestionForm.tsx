import React, { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface DishSuggestion {
    name: string;
    ingredients: string;
    description: string;
    region?: string;
    category?: string;
    cooking_time?: string;
    submitter_name?: string;
    submitter_email?: string;
}

interface DishSuggestionFormProps {
    onSubmit?: (dish: DishSuggestion) => void;
}

const inputClassName = {
    width: '100%',
    borderRadius: 16,
    border: '1px solid #e7e5e4',
    background: '#fff',
    padding: '12px 14px',
    fontSize: 14,
    color: '#1f2937',
    outline: 'none',
    boxSizing: 'border-box' as const,
};

const labelClassName = {
    display: 'block',
    marginBottom: 8,
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.16em',
    color: '#a8a29e',
};

const DishSuggestionForm: React.FC<DishSuggestionFormProps> = ({ onSubmit }) => {
    const [formData, setFormData] = useState<DishSuggestion>({
        name: '',
        ingredients: '',
        description: '',
        region: '',
        category: '',
        cooking_time: '',
        submitter_name: '',
        submitter_email: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isValid = useMemo(() => {
        return Boolean(formData.name.trim() && formData.ingredients.trim() && formData.description.trim());
    }, [formData]);

    const handleChange = (field: keyof DishSuggestion, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            ingredients: '',
            description: '',
            region: '',
            category: '',
            cooking_time: '',
            submitter_name: '',
            submitter_email: '',
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!isValid || isSubmitting) return;

        setIsSubmitting(true);
        setMessage(null);
        setErrorMessage(null);

        const payload: DishSuggestion = {
            name: formData.name.trim(),
            ingredients: formData.ingredients.trim(),
            description: [
                formData.description.trim(),
                '',
                '---',
                'Informations complémentaires',
                formData.region?.trim() ? `Région / origine: ${formData.region.trim()}` : null,
                formData.category?.trim() ? `Catégorie: ${formData.category.trim()}` : null,
                formData.cooking_time?.trim() ? `Temps estimé: ${formData.cooking_time.trim()}` : null,
                formData.submitter_name?.trim() ? `Nom du contributeur: ${formData.submitter_name.trim()}` : null,
                formData.submitter_email?.trim() ? `Email du contributeur: ${formData.submitter_email.trim()}` : null,
            ].filter(Boolean).join('\n'),
        };

        try {
            const { error } = await supabase.from('dish_suggestions').insert(payload);
            if (error) throw error;
            onSubmit?.(payload);
            resetForm();
            setMessage('Suggestion enregistrée avec succès.');
        } catch (error) {
            console.error('Erreur lors de la soumission de suggestion:', error);
            setErrorMessage("Impossible d'enregistrer la suggestion pour le moment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <div>
                <label htmlFor="admin-dish-name" style={labelClassName}>Nom du plat</label>
                <input
                    id="admin-dish-name"
                    type="text"
                    style={inputClassName}
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ex: Sauce feuille au crabe"
                    required
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                    <label htmlFor="admin-dish-region" style={labelClassName}>Région / origine</label>
                    <input
                        id="admin-dish-region"
                        type="text"
                        style={inputClassName}
                        value={formData.region}
                        onChange={(e) => handleChange('region', e.target.value)}
                        placeholder="Ex: Atlantique"
                    />
                </div>
                <div>
                    <label htmlFor="admin-dish-category" style={labelClassName}>Catégorie</label>
                    <input
                        id="admin-dish-category"
                        type="text"
                        style={inputClassName}
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        placeholder="Ex: Plat principal"
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                    <label htmlFor="admin-submit-name" style={labelClassName}>Nom du contributeur</label>
                    <input
                        id="admin-submit-name"
                        type="text"
                        style={inputClassName}
                        value={formData.submitter_name}
                        onChange={(e) => handleChange('submitter_name', e.target.value)}
                        placeholder="Ex: André Koutomi"
                    />
                </div>
                <div>
                    <label htmlFor="admin-submit-email" style={labelClassName}>Email du contributeur</label>
                    <input
                        id="admin-submit-email"
                        type="email"
                        style={inputClassName}
                        value={formData.submitter_email}
                        onChange={(e) => handleChange('submitter_email', e.target.value)}
                        placeholder="Ex: andre@email.com"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="admin-cooking-time" style={labelClassName}>Temps estimé</label>
                <input
                    id="admin-cooking-time"
                    type="text"
                    style={inputClassName}
                    value={formData.cooking_time}
                    onChange={(e) => handleChange('cooking_time', e.target.value)}
                    placeholder="Ex: 1h 10 min"
                />
            </div>

            <div>
                <label htmlFor="admin-ingredients" style={labelClassName}>Ingrédients principaux</label>
                <textarea
                    id="admin-ingredients"
                    style={{ ...inputClassName, minHeight: 110, resize: 'vertical' }}
                    value={formData.ingredients}
                    onChange={(e) => handleChange('ingredients', e.target.value)}
                    placeholder="Décrivez les ingrédients nécessaires"
                    required
                />
            </div>

            <div>
                <label htmlFor="admin-description" style={labelClassName}>Description / préparation</label>
                <textarea
                    id="admin-description"
                    style={{ ...inputClassName, minHeight: 140, resize: 'vertical' }}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Ajoutez les détails utiles pour l'équipe AfroCuisto"
                    required
                />
            </div>

            {message && (
                <div style={{ borderRadius: 14, background: '#ecfdf5', border: '1px solid #86efac', color: '#166534', padding: '12px 14px', fontSize: 13, fontWeight: 700 }}>
                    {message}
                </div>
            )}

            {errorMessage && (
                <div style={{ borderRadius: 14, background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 14px', fontSize: 13, fontWeight: 700 }}>
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={!isValid || isSubmitting}
                style={{
                    height: 48,
                    borderRadius: 999,
                    border: 'none',
                    background: !isValid || isSubmitting ? '#d6d3d1' : '#fb5607',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: !isValid || isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: !isValid || isSubmitting ? 'none' : '0 10px 30px rgba(251, 86, 7, 0.18)',
                }}
            >
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre la suggestion'}
            </button>
        </form>
    );
};

export default DishSuggestionForm;
