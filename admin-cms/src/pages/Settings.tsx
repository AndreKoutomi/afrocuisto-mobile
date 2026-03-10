/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Page des paramètres pour personnaliser le comportement global de l'application.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { Save, Key, Layers, CheckCircle2, AlertCircle, Beaker, Loader2 } from 'lucide-react';
import { aiService } from '../lib/ai';

export function Settings() {
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [model, setModel] = useState('');
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        setApiKey(localStorage.getItem('gemini_api_key') || '');
        setBaseUrl(localStorage.getItem('ai_base_url') || '');
        setModel(localStorage.getItem('gemini_model') || 'gemini-1.5-flash');
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('gemini_api_key', apiKey);
        localStorage.setItem('ai_base_url', baseUrl);
        localStorage.setItem('gemini_model', model);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleTestKey = async () => {
        if (!apiKey) {
            setTestResult({ success: false, message: 'Veuillez entrer une clé API.' });
            return;
        }
        setTesting(true);
        setTestResult(null);
        const result = await aiService.testKey(apiKey, model, baseUrl);
        setTesting(result.success); // Keep green if success
        setTestResult(result);
        setTesting(false);
    };

    const cardStyle: React.CSSProperties = {
        background: '#fff',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid #f0f0f0',
        maxWidth: '800px',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px 18px',
        borderRadius: '14px',
        border: '1.5px solid #e5e7eb',
        fontSize: '14px',
        fontWeight: 500,
        outline: 'none',
        transition: 'all 0.2s',
        marginBottom: '20px',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '11px',
        fontWeight: 800,
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '8px',
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                    <div style={{ width: '48px', height: '48px', background: '#fff5f0', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Key size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Réglages IA</h2>
                        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Configurez vos accès Gemini ou OpenAI pour la génération de recettes</p>
                    </div>
                </div>

                <form onSubmit={handleSave}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}><Key size={12} style={{ marginRight: '4px' }} /> Clé API (Gemini ou OpenAI)</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Entrez votre clé API..."
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>Base URL (Optionnel - Pour OpenAI/Proxy)</label>
                        <input
                            type="text"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            placeholder="https://api.openai.com/v1"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={labelStyle}><Layers size={12} style={{ marginRight: '4px' }} /> Modèle à utiliser</label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                            <optgroup label="Google Gemini">
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rapide)</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Puissant)</option>
                            </optgroup>
                            <optgroup label="OpenAI / ChatGPT">
                                <option value="gpt-4o">GPT-4o (Le plus récent)</option>
                                <option value="gpt-4o-mini">GPT-4o Mini (Rapide)</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </optgroup>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button
                            type="submit"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '14px 30px', borderRadius: '14px',
                                background: 'var(--primary)', color: '#fff',
                                border: 'none', fontWeight: 700, cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(251, 86, 7, 0.2)',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Save size={18} /> Enregistrer la configuration
                        </button>

                        <button
                            type="button"
                            onClick={handleTestKey}
                            disabled={testing}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '14px 25px', borderRadius: '14px',
                                background: '#f9fafb', color: '#374151',
                                border: '1.5px solid #e5e7eb', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.2s',
                                opacity: testing ? 0.7 : 1
                            }}
                        >
                            {testing ? <Loader2 size={18} className="animate-spin" /> : <Beaker size={18} />}
                            Tester la clé
                        </button>

                        {saved && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: 600 }}>
                                <CheckCircle2 size={18} /> Configuration enregistrée !
                            </div>
                        )}
                    </div>

                    {testResult && (
                        <div style={{
                            marginTop: '20px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: testResult.success ? '#ecfdf5' : '#fef2f2',
                            color: testResult.success ? '#059669' : '#dc2626',
                            border: `1px solid ${testResult.success ? '#10b98140' : '#ef444440'}`
                        }}>
                            {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            {testResult.message}
                        </div>
                    )}
                </form>

                <div style={{ marginTop: '40px', padding: '20px', background: '#f0f9ff', borderRadius: '18px', border: '1px solid #e0f2fe' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <AlertCircle size={16} color="#0369a1" />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1' }}>Note de sécurité</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', lineHeight: 1.6 }}>
                        Votre clé API est stockée <strong>localement</strong> dans votre navigateur. Elle ne quitte jamais
                        votre appareil sauf pour interroger directement les serveurs de Google lors de la génération.
                        Assurez-vous d'avoir activé l'API Gemini dans la console Google Cloud.
                    </p>
                </div>
            </div>
        </div>
    );
}
