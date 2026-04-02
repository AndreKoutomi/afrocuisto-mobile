/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Composant visuel représentant le formulaire permettant à un utilisateur de suggérer un nouveau plat (nom, ingrédients). Il vérifie les saisies avant envoi.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import React, { useMemo, useState, useRef } from 'react'; // Importation des outils de base de React
import { Camera, Image as ImageIcon, X, UploadCloud } from 'lucide-react'; // Importation des icônes

// Définition de la structure des données envoyées par le formulaire
export interface DishSuggestionPayload {
    name: string; // Nom du plat
    ingredients: string; // Liste des ingrédients
    description: string; // Description ou méthode
    region?: string; // Région (optionnel)
    category?: string; // Catégorie (optionnel)
    cooking_time?: string; // Temps de cuisson (optionnel)
    submitter_name?: string; // Nom de celui qui envoie
    submitter_email?: string; // Email de celui qui envoie
    image?: string; // Image en base64 (optionnel)
}

// Propriétés acceptées par le composant (ici une fonction de soumission)
interface DishSuggestionFormProps {
    onSubmit: (dish: DishSuggestionPayload) => Promise<boolean> | boolean;
}

// Styles graphiques (Tailwind CSS) pour les champs de saisie et les textes
const inputClassName = "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-[#fb5607] focus:ring-4 focus:ring-[#fb5607]/10";
const labelClassName = "mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-stone-400";

// Liste des catégories possibles pour le menu déroulant
const CATEGORIES = [
    "Pâtes et Céréales (Wɔ̌)",
    "Sauces (Nùsúnnú)",
    "Plats de Résistance & Ragoûts",
    "Protéines & Grillades",
    "Street Food & Snacks (Amuse-bouche)",
    "Boissons & Douceurs",
    "Condiments & Accompagnements",
    "Autre"
];

// Liste des régions du Bénin
const REGIONS = [
    "Alibori", "Atacora", "Atlantique", "Borgou",
    "Collines", "Couffo", "Donga", "Littoral",
    "Mono", "Ouémé", "Plateau", "Zou",
    "Diaspora", "Nationale / Tout le pays", "Autre Afrique", "Autre"
];

// Le composant principal du formulaire
const DishSuggestionForm: React.FC<DishSuggestionFormProps> = ({ onSubmit }) => {
    // État (mémoire) du formulaire pour stocker ce que l'utilisateur écrit
    const [formData, setFormData] = useState<DishSuggestionPayload>({
        name: '',
        ingredients: '',
        description: '',
        region: '',
        category: '',
        cooking_time: '',
        submitter_name: '',
        submitter_email: '',
        image: '',
    });

    // État pour la prévisualisation de l'image
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // État pour savoir si l'envoi est en cours (pour désactiver le bouton)
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Vérifie si les champs obligatoires sont remplis
    const isValid = useMemo(() => {
        return Boolean(
            formData.name.trim() &&
            formData.ingredients.trim() &&
            formData.description.trim()
        );
    }, [formData]);

    // Fonction pour mettre à jour la mémoire du formulaire quand on tape au clavier
    const handleChange = (field: keyof DishSuggestionPayload, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Gestion de l'image
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("L'image est trop lourde (max 5Mo)");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImagePreview(base64String);
                setFormData(prev => ({ ...prev, image: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setFormData(prev => ({ ...prev, image: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Fonction déclenchée quand on clique sur "Envoyer"
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault(); // Empêche le rechargement de la page
        if (!isValid || isSubmitting) return; // Arrête si invalide ou déjà en cours

        setIsSubmitting(true); // Indique que le chargement commence
        try {
            // Appel de la fonction onSubmit passée par le parent (App.tsx)
            const success = await onSubmit({
                name: formData.name.trim(),
                ingredients: formData.ingredients.trim(),
                description: formData.description.trim(),
                region: formData.region?.trim() || undefined,
                category: formData.category?.trim() || undefined,
                cooking_time: formData.cooking_time?.trim() || undefined,
                submitter_name: formData.submitter_name?.trim() || undefined,
                submitter_email: formData.submitter_email?.trim() || undefined,
                image: formData.image || undefined,
            });

            // Si l'envoi a réussi, on vide le formulaire
            if (success) {
                setFormData({
                    name: '',
                    ingredients: '',
                    description: '',
                    region: '',
                    category: '',
                    cooking_time: '',
                    submitter_name: '',
                    submitter_email: '',
                    image: '',
                });
                setImagePreview(null);
            }
        } finally {
            setIsSubmitting(false); // Fin du chargement
        }
    };

    // Ce qui est affiché à l'écran (HTML/JSX)
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Champ pour le nom du plat */}
            <div>
                <label htmlFor="dish-name" className={labelClassName}>Nom du plat</label>
                <input
                    id="dish-name"
                    type="text"
                    className={inputClassName}
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ex: Amiwo au poulet fumé"
                    required
                />
            </div>

            {/* Champ d'ajout d'image - Premium */}
            <div>
                <label className={labelClassName}>Photo du plat (Optionnel)</label>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    id="dish-image-upload"
                />
                
                {imagePreview ? (
                    <div className="relative group overflow-hidden rounded-2xl border-4 border-white shadow-xl aspect-video bg-stone-100">
                        <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                        <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={16} strokeWidth={3} />
                        </button>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors pointer-events-none" />
                    </div>
                ) : (
                    <label
                        htmlFor="dish-image-upload"
                        className="flex flex-col items-center justify-center w-full aspect-video rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-[#fb5607]/40 transition-all cursor-pointer group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-stone-100 flex items-center justify-center text-stone-400 group-hover:text-[#fb5607] group-hover:scale-110 transition-all mb-3 text-2xl">
                            <Camera size={26} strokeWidth={1.5} />
                        </div>
                        <p className="text-[11px] font-black text-stone-400 uppercase tracking-widest group-hover:text-stone-600 transition-colors">
                            Choisir une photo
                        </p>
                        <p className="text-[9px] text-stone-300 mt-1 font-bold">Formats acceptés : JPG, PNG (Max 5Mo)</p>
                    </label>
                )}
            </div>

            {/* Sélections de Région et Catégorie en deux colonnes */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="dish-region" className={labelClassName}>Région / origine</label>
                    <select
                        id="dish-region"
                        className={`${inputClassName} appearance-none cursor-pointer bg-no-repeat`}
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundPosition: 'right 16px center' }}
                        value={formData.region}
                        onChange={(e) => handleChange('region', e.target.value)}
                    >
                        <option value="" disabled>Sélectionner une région...</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="dish-category" className={labelClassName}>Catégorie</label>
                    <select
                        id="dish-category"
                        className={`${inputClassName} appearance-none cursor-pointer bg-no-repeat`}
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundPosition: 'right 16px center' }}
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                    >
                        <option value="" disabled>Sélectionner une catégorie...</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Informations sur l'expéditeur */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="dish-submit-name" className={labelClassName}>Votre nom</label>
                    <input
                        id="dish-submit-name"
                        type="text"
                        className={inputClassName}
                        value={formData.submitter_name}
                        onChange={(e) => handleChange('submitter_name', e.target.value)}
                        placeholder="Ex: André Koutomi"
                    />
                </div>
                <div>
                    <label htmlFor="dish-submit-email" className={labelClassName}>Votre email</label>
                    <input
                        id="dish-submit-email"
                        type="email"
                        className={inputClassName}
                        value={formData.submitter_email}
                        onChange={(e) => handleChange('submitter_email', e.target.value)}
                        placeholder="Ex: nom@email.com"
                    />
                </div>
            </div>

            {/* Temps de cuisson */}
            <div>
                <label htmlFor="dish-cooking-time" className={labelClassName}>Temps estimé</label>
                <input
                    id="dish-cooking-time"
                    type="text"
                    className={inputClassName}
                    value={formData.cooking_time}
                    onChange={(e) => handleChange('cooking_time', e.target.value)}
                    placeholder="Ex: 45 min"
                />
            </div>

            {/* Zone de texte pour les ingrédients */}
            <div>
                <label htmlFor="dish-ingredients" className={labelClassName}>Ingrédients principaux</label>
                <textarea
                    id="dish-ingredients"
                    className={`${inputClassName} min-h-[110px] resize-none`}
                    value={formData.ingredients}
                    onChange={(e) => handleChange('ingredients', e.target.value)}
                    placeholder="Listez les ingrédients clés du plat"
                    required
                />
            </div>

            {/* Zone de texte pour la description */}
            <div>
                <label htmlFor="dish-description" className={labelClassName}>Description / méthode</label>
                <textarea
                    id="dish-description"
                    className={`${inputClassName} min-h-[140px] resize-none`}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Décrivez le plat, sa préparation ou son histoire"
                    required
                />
            </div>

            {/* Bouton de validation final */}
            <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full rounded-full bg-[#fb5607] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#fb5607]/20 transition disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none"
            >
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre la suggestion'}
            </button>
        </form>
    );
};

export default DishSuggestionForm;
