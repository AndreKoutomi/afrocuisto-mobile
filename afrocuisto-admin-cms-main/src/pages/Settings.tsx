import { useState } from 'react';
import { AdminSelect } from '../components/AdminSelect';
import {
    KeyRound, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff,
    Save, RotateCcw, ShieldCheck, Loader2
} from '../components/SolarIcons';
import { AI_STORAGE_KEYS, getStoredAiModel, getStoredGeminiKey } from '../lib/ai';

interface GeminiModelOption {
    value: string;
    label: string;
}

const FALLBACK_MODELS: GeminiModelOption[] = [
    { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (par défaut)' },
    { value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite' },
    { value: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash' },
    { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite' },
];

export function SettingsPage() {
    const envKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY || '').trim();
    const envModel = ((import.meta as any).env?.VITE_AI_MODEL || 'gemini-3.8-flash').trim();

    const [apiKey, setApiKey] = useState(() => getStoredGeminiKey());
    const [model, setModel] = useState(() => getStoredAiModel() || envModel);
    const [showKey, setShowKey] = useState(false);

    const [models, setModels] = useState<GeminiModelOption[]>(() => {
        const current = getStoredAiModel() || envModel;
        const exists = FALLBACK_MODELS.some(m => m.value === current);
        return exists ? FALLBACK_MODELS : [{ value: current, label: current }, ...FALLBACK_MODELS];
    });
    const [keyValidated, setKeyValidated] = useState(false);
    const [validating, setValidating] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const effectiveKey = apiKey.trim() || envKey;
    const isUsingCustomKey = Boolean(apiKey.trim());

    const handleKeyChange = (value: string) => {
        setApiKey(value);
        setKeyValidated(false);
    };

    const handleValidateKey = async () => {
        if (!effectiveKey) {
            setStatus({
                type: 'error',
                message: 'Veuillez saisir une clé API Gemini avant de valider.',
            });
            return;
        }

        setValidating(true);
        setStatus(null);
        setKeyValidated(false);

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(effectiveKey)}`
            );
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error?.message || `Erreur HTTP ${res.status}`);
            }

            const rawModels: any[] = Array.isArray(data?.models) ? data.models : [];
            const compatible: GeminiModelOption[] = rawModels
                .filter((m) => {
                    const id = String(m?.name || '').replace(/^models\//, '');
                    const methods: string[] = Array.isArray(m?.supportedGenerationMethods)
                        ? m.supportedGenerationMethods
                        : [];
                    return id.startsWith('gemini') && methods.includes('generateContent');
                })
                .map((m) => {
                    const id = String(m.name).replace(/^models\//, '');
                    const display = m.displayName ? `${m.displayName} (${id})` : id;
                    return { value: id, label: display };
                });

            if (compatible.length === 0) {
                throw new Error('Clé valide, mais aucun modèle Gemini compatible (generateContent) n’a été trouvé.');
            }

            setModels(compatible);
            if (!compatible.some(m => m.value === model)) {
                const preferred =
                    compatible.find(m => m.value === 'gemini-3.8-flash') ||
                    compatible.find(m => m.value === 'gemini-3.5-flash-lite') ||
                    compatible.find(m => m.value === 'gemini-3.6-flash') ||
                    compatible.find(m => m.value === 'gemini-3.1-flash-lite') ||
                    compatible.find(m => m.value === 'gemini-flash-latest') ||
                    compatible[0];
                setModel(preferred.value);
            }

            setKeyValidated(true);
            setStatus({
                type: 'success',
                message: `Clé API valide : ${compatible.length} modèle${compatible.length > 1 ? 's' : ''} Gemini compatible${compatible.length > 1 ? 's' : ''} détecté${compatible.length > 1 ? 's' : ''}.`,
            });
        } catch (err: any) {
            setStatus({
                type: 'error',
                message: `Clé API invalide : ${err?.message || 'Erreur inconnue'}`,
            });
        } finally {
            setValidating(false);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim()) {
            localStorage.setItem(AI_STORAGE_KEYS.GEMINI_API_KEY, apiKey.trim());
        } else {
            localStorage.removeItem(AI_STORAGE_KEYS.GEMINI_API_KEY);
        }

        if (model.trim()) {
            localStorage.setItem(AI_STORAGE_KEYS.AI_MODEL, model.trim());
        } else {
            localStorage.removeItem(AI_STORAGE_KEYS.AI_MODEL);
        }

        setStatus({
            type: 'success',
            message: `Configuration enregistrée (modèle actif : ${model}).`,
        });
    };

    const handleReset = () => {
        localStorage.removeItem(AI_STORAGE_KEYS.GEMINI_API_KEY);
        localStorage.removeItem(AI_STORAGE_KEYS.AI_MODEL);
        setApiKey('');
        setModel(envModel);
        setModels(FALLBACK_MODELS);
        setKeyValidated(false);
        setStatus({
            type: 'success',
            message: 'Paramètres réinitialisés sur les valeurs par défaut du fichier .env.',
        });
    };

    return (
        <div style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <form onSubmit={handleSave} className="card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <KeyRound size={20} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                                Configuration API Gemini
                            </h2>
                            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                                Validez votre clé API pour charger la liste des modèles Gemini compatibles.
                            </p>
                        </div>
                    </div>

                    <span className={`badge ${effectiveKey ? 'badge-success' : 'badge-primary'}`}>
                        {isUsingCustomKey
                            ? 'Clé personnalisée active'
                            : envKey
                                ? 'Clé .env active'
                                : 'Non configurée'}
                    </span>
                </div>

                {status && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        color: status.type === 'success' ? 'var(--success)' : 'var(--danger)',
                        fontSize: '13px',
                        fontWeight: 600,
                    }}>
                        {status.type === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
                        <span>{status.message}</span>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                        <label className="form-label">1. Clé API Google Gemini</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: '1 1 280px' }}>
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    className="form-control font-mono"
                                    placeholder={envKey ? 'Clé définie dans .env (laisser vide pour utiliser .env)' : 'AIzaSy...'}
                                    value={apiKey}
                                    onChange={(e) => handleKeyChange(e.target.value)}
                                    style={{ paddingRight: '44px', height: '46px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(s => !s)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                                    aria-label={showKey ? 'Masquer la clé' : 'Afficher la clé'}
                                >
                                    {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleValidateKey}
                                disabled={validating || !effectiveKey}
                                className="btn btn-secondary"
                                style={{ height: '46px', whiteSpace: 'nowrap' }}
                            >
                                {validating ? <Loader2 className="spinning" size={15} /> : <ShieldCheck size={15} />}
                                {validating ? 'Validation...' : 'Valider la clé API'}
                            </button>
                        </div>
                        <p style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            Stockée localement dans ce navigateur. Prioritaire sur <code style={{ fontSize: '11px' }}>VITE_GEMINI_API_KEY</code>.
                        </p>
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>2. Modèle Gemini compatible</label>
                            {keyValidated && (
                                <span className="badge badge-success">{models.length} compatibles</span>
                            )}
                        </div>
                        <AdminSelect
                            ariaLabel="Modèle Gemini"
                            value={model}
                            onChange={setModel}
                            options={models.map(option => ({ value: option.value, label: option.label }))}
                            style={{ width: '100%' }}
                            triggerStyle={{ height: '46px' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn btn-secondary"
                    >
                        <RotateCcw size={15} />
                        Réinitialiser
                    </button>

                    <button type="submit" className="btn btn-primary">
                        <Save size={15} />
                        Enregistrer
                    </button>
                </div>
            </form>

            <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={18} />
                </div>
                <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                        Fonctionnalités alimentées par Gemini
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Cette configuration contrôle l’assistant de création de recettes (<strong>Générer par IA</strong>) ainsi que le remplissage automatique des fiches dans le formulaire recette.
                    </p>
                </div>
            </div>
        </div>
    );
}
