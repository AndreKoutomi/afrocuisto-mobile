import React from 'react';
import type {
    TitleAccentStyle,
    TitleFontFamily,
    TitleFontWeight,
    TitleStyleConfig,
    TitleTextAlign,
    TitleTextTransform,
} from '../lib/titleSectionStyle';
import { DEFAULT_TITLE_STYLE } from '../lib/titleSectionStyle';

interface TitleStyleEditorProps {
    title: string;
    value: TitleStyleConfig;
    onChange: (next: TitleStyleConfig) => void;
}

const WEIGHT_OPTIONS: { value: TitleFontWeight; label: string }[] = [
    { value: '400', label: 'Normal (400)' },
    { value: '500', label: 'Moyen (500)' },
    { value: '600', label: 'Semi-gras (600)' },
    { value: '700', label: 'Gras (700)' },
    { value: '800', label: 'Extra-gras (800)' },
    { value: '900', label: 'Noir (900)' },
];

const FAMILY_OPTIONS: { value: TitleFontFamily; label: string }[] = [
    { value: 'default', label: 'Système (Nexa / Défaut)' },
    { value: 'sans', label: 'Sans-Serif' },
    { value: 'serif', label: 'Serif (Éditorial)' },
    { value: 'mono', label: 'Monospace' },
];

const ACCENT_OPTIONS: { value: TitleAccentStyle; label: string }[] = [
    { value: 'none', label: 'Aucun' },
    { value: 'left', label: 'Barre gauche' },
    { value: 'bottom', label: 'Soulignement accent' },
    { value: 'badge', label: 'Badge pilule' },
];

const COLOR_PRESETS = ['', '#111827', '#FFFFFF', '#FB5607', '#10B981', '#6366F1', '#F59E0B', '#EF4444'];
const BG_PRESETS = ['', '#FFFFFF', '#F8FAFC', '#FFF7ED', '#111827', '#1E293B', '#EEF2FF', '#ECFDF5'];

export const TitleStyleEditor: React.FC<TitleStyleEditorProps> = ({ title, value, onChange }) => {
    const update = <K extends keyof TitleStyleConfig>(key: K, val: TitleStyleConfig[K]) => {
        onChange({ ...value, [key]: val });
    };

    const toggleBold = () => {
        const isBold = Number(value.fontWeight) >= 700;
        update('fontWeight', isBold ? '400' : '800');
    };

    const previewText = (title.trim() || 'Exemple de titre de section');
    const previewFontFamily =
        value.fontFamily === 'serif'
            ? 'Georgia, Cambria, "Times New Roman", serif'
            : value.fontFamily === 'mono'
              ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
              : 'inherit';

    const textDecorations = [
        value.underline ? 'underline' : '',
        value.strikethrough ? 'line-through' : '',
    ]
        .filter(Boolean)
        .join(' ') || 'none';

    const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
        padding: '7px 12px',
        borderRadius: '10px',
        border: active ? '1.5px solid var(--primary)' : '1.5px solid #e5e7eb',
        background: active ? 'rgba(251, 86, 7, 0.12)' : '#ffffff',
        color: active ? 'var(--primary)' : '#374151',
        fontWeight: 800,
        fontSize: '13px',
        cursor: 'pointer',
    });

    return (
        <div style={{ marginTop: '24px', borderTop: '1px solid #f0f0f0', paddingTop: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>
                        Mise en forme avancée du Titre
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#6b7280' }}>
                        Tous ces paramètres sont appliqués à l’identique sur la page d’accueil de l’application.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onChange({ ...DEFAULT_TITLE_STYLE })}
                    style={{ padding: '7px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#4b5563', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                    Réinitialiser le style
                </button>
            </div>

            {/* Aperçu en direct */}
            <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '16px', background: '#f8fafc', border: '1.5px dashed #cbd5e1' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                    Aperçu en direct (App Home)
                </div>
                <div
                    style={{
                        paddingTop: `${value.paddingTop}px`,
                        paddingBottom: `${value.paddingBottom}px`,
                        paddingLeft: `${value.paddingHorizontal}px`,
                        paddingRight: `${value.paddingHorizontal}px`,
                        background: value.backgroundColor || 'transparent',
                        borderRadius: value.backgroundColor ? `${value.borderRadius}px` : undefined,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems:
                            value.textAlign === 'center'
                                ? 'center'
                                : value.textAlign === 'right'
                                  ? 'flex-end'
                                  : 'flex-start',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: value.accentStyle === 'left' || value.accentStyle === 'bottom' ? '100%' : undefined,
                            justifyContent:
                                value.textAlign === 'center'
                                    ? 'center'
                                    : value.textAlign === 'right'
                                      ? 'flex-end'
                                      : 'flex-start',
                        }}
                    >
                        {value.accentStyle === 'left' && (
                            <span style={{ width: '4px', height: `${Math.max(18, value.fontSize)}px`, borderRadius: '99px', background: value.accentColor || '#FB5607', flexShrink: 0 }} />
                        )}
                        <div
                            style={{
                                fontSize: `${value.fontSize}px`,
                                fontWeight: Number(value.fontWeight),
                                fontFamily: previewFontFamily,
                                fontStyle: value.italic ? 'italic' : 'normal',
                                textDecoration: textDecorations,
                                textTransform: value.textTransform,
                                letterSpacing: `${value.letterSpacing}px`,
                                lineHeight: value.lineHeightMultiplier,
                                textAlign: value.textAlign,
                                color: value.textColor || '#111827',
                                ...(value.accentStyle === 'badge'
                                    ? {
                                          background: `${value.accentColor || '#FB5607'}1F`,
                                          padding: '5px 14px',
                                          borderRadius: '999px',
                                          border: `1px solid ${value.accentColor || '#FB5607'}55`,
                                      }
                                    : {}),
                            }}
                        >
                            {previewText}
                        </div>
                    </div>
                    {value.accentStyle === 'bottom' && (
                        <div style={{ width: '48px', height: '3.5px', borderRadius: '99px', background: value.accentColor || '#FB5607', marginTop: '6px' }} />
                    )}
                    {value.subtitle.trim() && (
                        <div
                            style={{
                                marginTop: `${value.subtitleSpacingTop}px`,
                                fontSize: `${value.subtitleFontSize}px`,
                                fontWeight: Number(value.subtitleFontWeight),
                                fontFamily:
                                    value.subtitleFontFamily === 'serif'
                                        ? 'Georgia, Cambria, "Times New Roman", serif'
                                        : value.subtitleFontFamily === 'mono'
                                          ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
                                          : 'inherit',
                                fontStyle: value.subtitleItalic ? 'italic' : 'normal',
                                textDecoration:
                                    [
                                        value.subtitleUnderline ? 'underline' : '',
                                        value.subtitleStrikethrough ? 'line-through' : '',
                                    ]
                                        .filter(Boolean)
                                        .join(' ') || 'none',
                                textTransform: value.subtitleTextTransform,
                                letterSpacing: `${value.subtitleLetterSpacing}px`,
                                lineHeight: value.subtitleLineHeightMultiplier,
                                color: value.subtitleTextColor || '#6b7280',
                                textAlign: value.textAlign,
                                width: '100%',
                            }}
                        >
                            {value.subtitle}
                        </div>
                    )}
                </div>
            </div>

            {/* Barre rapide de mise en forme */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                <button type="button" onClick={toggleBold} style={toggleBtnStyle(Number(value.fontWeight) >= 700)} title="Gras">
                    B
                </button>
                <button type="button" onClick={() => update('italic', !value.italic)} style={{ ...toggleBtnStyle(value.italic), fontStyle: 'italic' }} title="Italique">
                    I
                </button>
                <button type="button" onClick={() => update('underline', !value.underline)} style={{ ...toggleBtnStyle(value.underline), textDecoration: 'underline' }} title="Souligné">
                    U
                </button>
                <button type="button" onClick={() => update('strikethrough', !value.strikethrough)} style={{ ...toggleBtnStyle(value.strikethrough), textDecoration: 'line-through' }} title="Barré">
                    S
                </button>

                <span style={{ width: '1px', background: '#e5e7eb', margin: '0 4px' }} />

                {(['left', 'center', 'right'] as TitleTextAlign[]).map((align) => (
                    <button
                        key={align}
                        type="button"
                        onClick={() => update('textAlign', align)}
                        style={toggleBtnStyle(value.textAlign === align)}
                    >
                        {align === 'left' ? 'Gauche' : align === 'center' ? 'Centré' : 'Droite'}
                    </button>
                ))}

                <span style={{ width: '1px', background: '#e5e7eb', margin: '0 4px' }} />

                {(['none', 'uppercase', 'capitalize', 'lowercase'] as TitleTextTransform[]).map((tf) => (
                    <button
                        key={tf}
                        type="button"
                        onClick={() => update('textTransform', tf)}
                        style={toggleBtnStyle(value.textTransform === tf)}
                    >
                        {tf === 'none' ? 'Normal' : tf === 'uppercase' ? 'AA' : tf === 'capitalize' ? 'Aa' : 'aa'}
                    </button>
                ))}
            </div>

            {/* Sous-titre optionnel & sa mise en forme */}
            <div style={{ marginBottom: '18px', padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                    Sous-titre (optionnel)
                </label>
                <input
                    type="text"
                    placeholder="Ex: Sélection du chef mise à jour chaque matin"
                    value={value.subtitle}
                    onChange={(e) => update('subtitle', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '13.5px', boxSizing: 'border-box', background: '#fff' }}
                />

                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={() => update('subtitleFontWeight', Number(value.subtitleFontWeight) >= 700 ? '500' : '700')}
                        style={toggleBtnStyle(Number(value.subtitleFontWeight) >= 700)}
                    >
                        B
                    </button>
                    <button
                        type="button"
                        onClick={() => update('subtitleItalic', !value.subtitleItalic)}
                        style={{ ...toggleBtnStyle(value.subtitleItalic), fontStyle: 'italic' }}
                    >
                        I
                    </button>
                    <button
                        type="button"
                        onClick={() => update('subtitleUnderline', !value.subtitleUnderline)}
                        style={{ ...toggleBtnStyle(value.subtitleUnderline), textDecoration: 'underline' }}
                    >
                        U
                    </button>
                    <button
                        type="button"
                        onClick={() => update('subtitleStrikethrough', !value.subtitleStrikethrough)}
                        style={{ ...toggleBtnStyle(value.subtitleStrikethrough), textDecoration: 'line-through' }}
                    >
                        S
                    </button>
                    <span style={{ width: '1px', height: '22px', background: '#e5e7eb', margin: '0 2px' }} />
                    {(['none', 'uppercase', 'capitalize', 'lowercase'] as TitleTextTransform[]).map((tf) => (
                        <button
                            key={`sub-tf-${tf}`}
                            type="button"
                            onClick={() => update('subtitleTextTransform', tf)}
                            style={toggleBtnStyle(value.subtitleTextTransform === tf)}
                        >
                            {tf === 'none' ? 'Normal' : tf === 'uppercase' ? 'AA' : tf === 'capitalize' ? 'Aa' : 'aa'}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '12px', marginTop: '12px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4b5563', marginBottom: '4px' }}>
                            Taille sous-titre ({value.subtitleFontSize} sp)
                        </label>
                        <input type="range" min={10} max={24} step={0.5} value={value.subtitleFontSize} onChange={(e) => update('subtitleFontSize', Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4b5563', marginBottom: '4px' }}>
                            Graisse sous-titre
                        </label>
                        <select value={value.subtitleFontWeight} onChange={(e) => update('subtitleFontWeight', e.target.value as TitleFontWeight)} style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '12.5px', background: '#fff' }}>
                            {WEIGHT_OPTIONS.map((opt) => (
                                <option key={`sub-w-${opt.value}`} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4b5563', marginBottom: '4px' }}>
                            Police sous-titre
                        </label>
                        <select value={value.subtitleFontFamily} onChange={(e) => update('subtitleFontFamily', e.target.value as TitleFontFamily)} style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '12.5px', background: '#fff' }}>
                            {FAMILY_OPTIONS.map((opt) => (
                                <option key={`sub-f-${opt.value}`} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4b5563', marginBottom: '4px' }}>
                            Espacement lettres ({value.subtitleLetterSpacing} sp)
                        </label>
                        <input type="range" min={-0.5} max={4} step={0.5} value={value.subtitleLetterSpacing} onChange={(e) => update('subtitleLetterSpacing', Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4b5563', marginBottom: '4px' }}>
                            Hauteur de ligne ({value.subtitleLineHeightMultiplier.toFixed(2)}x)
                        </label>
                        <input type="range" min={1.0} max={2.0} step={0.05} value={value.subtitleLineHeightMultiplier} onChange={(e) => update('subtitleLineHeightMultiplier', Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4b5563', marginBottom: '4px' }}>
                            Écart sous le titre ({value.subtitleSpacingTop} dp)
                        </label>
                        <input type="range" min={0} max={20} step={1} value={value.subtitleSpacingTop} onChange={(e) => update('subtitleSpacingTop', Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                    </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4b5563', marginBottom: '6px' }}>
                        Couleur du sous-titre {value.subtitleTextColor ? `(${value.subtitleTextColor})` : '(Thème auto)'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {['', '#6B7280', '#111827', '#FFFFFF', '#FB5607', '#10B981', '#6366F1'].map((hex) => (
                            <button
                                key={hex || 'auto-sub-text'}
                                type="button"
                                onClick={() => update('subtitleTextColor', hex)}
                                title={hex || 'Thème automatique'}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    border: value.subtitleTextColor === hex ? '2.5px solid var(--primary)' : '1.5px solid #d1d5db',
                                    background: hex || 'linear-gradient(135deg, #6B7280 50%, #ffffff 50%)',
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                        <input
                            type="color"
                            value={value.subtitleTextColor || '#6B7280'}
                            onChange={(e) => update('subtitleTextColor', e.target.value.toUpperCase())}
                            style={{ width: '30px', height: '26px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                        />
                    </div>
                </div>
            </div>

            {/* Grille typographie & dimensions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Taille du texte ({value.fontSize} sp)
                    </label>
                    <input
                        type="range"
                        min={12}
                        max={36}
                        step={1}
                        value={value.fontSize}
                        onChange={(e) => update('fontSize', Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Graisse (Épaisseur)
                    </label>
                    <select
                        value={value.fontWeight}
                        onChange={(e) => update('fontWeight', e.target.value as TitleFontWeight)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '13px', background: '#fff' }}
                    >
                        {WEIGHT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Police de caractères
                    </label>
                    <select
                        value={value.fontFamily}
                        onChange={(e) => update('fontFamily', e.target.value as TitleFontFamily)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '13px', background: '#fff' }}
                    >
                        {FAMILY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Espacement lettres ({value.letterSpacing} sp)
                    </label>
                    <input
                        type="range"
                        min={-1}
                        max={6}
                        step={0.5}
                        value={value.letterSpacing}
                        onChange={(e) => update('letterSpacing', Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Hauteur de ligne ({value.lineHeightMultiplier.toFixed(2)}x)
                    </label>
                    <input
                        type="range"
                        min={1.0}
                        max={2.0}
                        step={0.05}
                        value={value.lineHeightMultiplier}
                        onChange={(e) => update('lineHeightMultiplier', Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Style d’accentuation
                    </label>
                    <select
                        value={value.accentStyle}
                        onChange={(e) => update('accentStyle', e.target.value as TitleAccentStyle)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '13px', background: '#fff' }}
                    >
                        {ACCENT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Couleurs & Fond */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Couleur du texte {value.textColor ? `(${value.textColor})` : '(Thème auto)'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {COLOR_PRESETS.map((hex) => (
                            <button
                                key={hex || 'auto-text'}
                                type="button"
                                onClick={() => update('textColor', hex)}
                                title={hex || 'Thème automatique'}
                                style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    border: value.textColor === hex ? '2.5px solid var(--primary)' : '1.5px solid #d1d5db',
                                    background: hex || 'linear-gradient(135deg, #111827 50%, #ffffff 50%)',
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                        <input
                            type="color"
                            value={value.textColor || '#111827'}
                            onChange={(e) => update('textColor', e.target.value.toUpperCase())}
                            style={{ width: '32px', height: '28px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Couleur de fond {value.backgroundColor ? `(${value.backgroundColor})` : '(Transparent)'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {BG_PRESETS.map((hex) => (
                            <button
                                key={hex || 'transparent-bg'}
                                type="button"
                                onClick={() => update('backgroundColor', hex)}
                                title={hex || 'Transparent'}
                                style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    border: value.backgroundColor === hex ? '2.5px solid var(--primary)' : '1.5px solid #d1d5db',
                                    background: hex || 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%) 50% / 10px 10px',
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                        <input
                            type="color"
                            value={value.backgroundColor || '#FFF7ED'}
                            onChange={(e) => update('backgroundColor', e.target.value.toUpperCase())}
                            style={{ width: '32px', height: '28px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                {value.accentStyle !== 'none' && (
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                            Couleur d’accent ({value.accentColor})
                        </label>
                        <input
                            type="color"
                            value={value.accentColor || '#FB5607'}
                            onChange={(e) => update('accentColor', e.target.value.toUpperCase())}
                            style={{ width: '44px', height: '32px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                        />
                    </div>
                )}
            </div>

            {/* Marges & Arrondi */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Marge haut ({value.paddingTop} dp)
                    </label>
                    <input type="range" min={0} max={32} value={value.paddingTop} onChange={(e) => update('paddingTop', Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Marge bas ({value.paddingBottom} dp)
                    </label>
                    <input type="range" min={0} max={32} value={value.paddingBottom} onChange={(e) => update('paddingBottom', Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Marge horizontale ({value.paddingHorizontal} dp)
                    </label>
                    <input type="range" min={0} max={32} value={value.paddingHorizontal} onChange={(e) => update('paddingHorizontal', Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>
                {value.backgroundColor && (
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                            Arrondi du fond ({value.borderRadius} dp)
                        </label>
                        <input type="range" min={0} max={28} value={value.borderRadius} onChange={(e) => update('borderRadius', Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                    </div>
                )}
            </div>
        </div>
    );
};
