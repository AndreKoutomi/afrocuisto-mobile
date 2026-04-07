import React, { useMemo, useState, useRef } from 'react';
import { Camera, X, AlertCircle, Tag, FileText, Layers, Send } from 'lucide-react';
import { User } from '../types';

/**
 * ============================================================================
 * COMPOSANT BUGREPORTFORM
 * ============================================================================
 * Rôle : Formulaire permettant aux utilisateurs de signaler un bug dans l'application.
 * Design : Mobile-first, premium, s'inspire du pattern de DishSuggestionForm.tsx.
 * ============================================================================
 */

export interface BugReportPayload {
    title: string;          // Titre du bug (requis)
    category: string;       // Accueil, Recettes, Communauté, Boutique, Profil, Connexion, Autre
    severity: string;       // Cosmétique, Mineur, Majeur, Bloquant
    description: string;    // Description détaillée (requis)
    reproduction_steps?: string; // Étapes pour reproduire le bug (optionnel)
    screenshot?: string;    // Capture d'écran en base64 (optionnel)
    user_id?: string;
    user_name?: string;
    user_email?: string;
    device_info: string;    // navigator.userAgent
    app_version: string;    // "1.0.6"
    status: string;         // "Nouveau"
}

interface BugReportFormProps {
    onSubmit: (data: BugReportPayload) => Promise<boolean>;
    currentUser: User | null;
}

const CATEGORIES = ["Accueil", "Recettes", "Communauté", "Boutique", "Profil", "Connexion", "Autre"];
const SEVERITIES = ["Cosmétique", "Mineur", "Majeur", "Bloquant"];

const inputClassName = "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-[#fb5607] focus:ring-4 focus:ring-[#fb5607]/10";
const labelClassName = "mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-stone-400";

const BugReportForm: React.FC<BugReportFormProps> = ({ onSubmit, currentUser }) => {
    const [formData, setFormData] = useState<Partial<BugReportPayload>>({
        title: '',
        category: CATEGORIES[0],
        severity: SEVERITIES[1], // "Mineur" par défaut
        description: '',
        reproduction_steps: '',
        screenshot: '',
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isValid = useMemo(() => {
        return Boolean(
            formData.title?.trim() &&
            formData.category &&
            formData.severity &&
            formData.description?.trim()
        );
    }, [formData]);

    const handleChange = (field: keyof BugReportPayload, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

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
                setFormData(prev => ({ ...prev, screenshot: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setFormData(prev => ({ ...prev, screenshot: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!isValid || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const payload: BugReportPayload = {
                title: formData.title!.trim(),
                category: formData.category!,
                severity: formData.severity!,
                description: formData.description!.trim(),
                reproduction_steps: formData.reproduction_steps?.trim() || undefined,
                screenshot: formData.screenshot || undefined,
                user_id: currentUser?.id,
                user_name: currentUser?.name,
                user_email: currentUser?.email,
                device_info: navigator.userAgent,
                app_version: "1.0.6",
                status: "Nouveau"
            };

            const success = await onSubmit(payload);

            if (success) {
                setFormData({
                    title: '',
                    category: CATEGORIES[0],
                    severity: SEVERITIES[1],
                    description: '',
                    reproduction_steps: '',
                    screenshot: '',
                });
                setImagePreview(null);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titre du bug */}
            <div>
                <label htmlFor="bug-title" className={labelClassName}>
                    <AlertCircle size={14} className="text-[#fb5607]" />
                    Titre du bug
                </label>
                <input
                    id="bug-title"
                    type="text"
                    className={inputClassName}
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Ex: Crash lors de l'ouverture d'une recette"
                    required
                />
            </div>

            {/* Catégorie */}
            <div>
                <label htmlFor="bug-category" className={labelClassName}>
                    <Tag size={14} />
                    Catégorie
                </label>
                <select
                    id="bug-category"
                    className={`${inputClassName} appearance-none cursor-pointer bg-no-repeat`}
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundPosition: 'right 16px center' }}
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Sévérité (Pills) */}
            <div>
                <label className={labelClassName}>
                    <Layers size={14} />
                    Sévérité
                </label>
                <div className="flex flex-wrap gap-2">
                    {SEVERITIES.map((s) => {
                        const isSelected = formData.severity === s;
                        let colorClass = "bg-stone-100 text-stone-500 border-stone-200";
                        
                        if (isSelected) {
                            if (s === "Bloquant") colorClass = "bg-red-500 text-white border-red-500 shadow-md shadow-red-200";
                            else if (s === "Majeur") colorClass = "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200";
                            else if (s === "Mineur") colorClass = "bg-[#fb5607] text-white border-[#fb5607] shadow-md shadow-orange-100";
                            else colorClass = "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-100";
                        }

                        return (
                            <button
                                key={s}
                                type="button"
                                onClick={() => handleChange('severity', s)}
                                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${colorClass} ${!isSelected ? 'hover:bg-stone-200' : ''}`}
                            >
                                {s}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Description */}
            <div>
                <label htmlFor="bug-description" className={labelClassName}>
                    <FileText size={14} />
                    Description du problème
                </label>
                <textarea
                    id="bug-description"
                    className={`${inputClassName} min-h-[120px] resize-none`}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Décrivez précisément ce qui se passe..."
                    required
                />
            </div>

            {/* Étapes de reproduction */}
            <div>
                <label htmlFor="bug-steps" className={labelClassName}>
                    Étapes de reproduction (Optionnel)
                </label>
                <textarea
                    id="bug-steps"
                    className={`${inputClassName} min-h-[100px] resize-none`}
                    value={formData.reproduction_steps}
                    onChange={(e) => handleChange('reproduction_steps', e.target.value)}
                    placeholder="1. Ouvrir l'app\n2. Aller sur...\n3. Cliquer sur..."
                />
            </div>

            {/* Capture d'écran */}
            <div>
                <label className={labelClassName}>
                    <Camera size={14} />
                    Capture d'écran (Optionnel)
                </label>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    id="bug-screenshot-upload"
                />
                
                {imagePreview ? (
                    <div className="relative group overflow-hidden rounded-2xl border-4 border-white shadow-xl aspect-video bg-stone-100">
                        <img 
                            src={imagePreview} 
                            alt="Screenshot Preview" 
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
                        htmlFor="bug-screenshot-upload"
                        className="flex flex-col items-center justify-center w-full aspect-video rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-[#fb5607]/40 transition-all cursor-pointer group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-stone-100 flex items-center justify-center text-stone-400 group-hover:text-[#fb5607] group-hover:scale-110 transition-all mb-3 text-2xl">
                            <Camera size={26} strokeWidth={1.5} />
                        </div>
                        <p className="text-[11px] font-black text-stone-400 uppercase tracking-widest group-hover:text-stone-600 transition-colors">
                            Ajouter une preuve visuelle
                        </p>
                        <p className="text-[9px] text-stone-300 mt-1 font-bold">Max 5Mo</p>
                    </label>
                )}
            </div>

            {/* Bouton de soumission */}
            <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#fb5607] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#fb5607]/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none"
            >
                {isSubmitting ? (
                    'Signalement en cours...'
                ) : (
                    <>
                        <Send size={18} />
                        Envoyer le rapport de bug
                    </>
                )}
            </button>
        </form>
    );
};

export default BugReportForm;
