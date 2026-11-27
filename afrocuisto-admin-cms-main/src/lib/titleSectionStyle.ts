export type TitleFontWeight = '400' | '500' | '600' | '700' | '800' | '900';
export type TitleFontFamily = 'default' | 'sans' | 'serif' | 'mono';
export type TitleTextAlign = 'left' | 'center' | 'right';
export type TitleTextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type TitleAccentStyle = 'none' | 'left' | 'bottom' | 'badge';

export interface TitleStyleConfig {
    subtitle: string;
    fontSize: number;
    fontWeight: TitleFontWeight;
    fontFamily: TitleFontFamily;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    textTransform: TitleTextTransform;
    letterSpacing: number;
    lineHeightMultiplier: number;
    textAlign: TitleTextAlign;
    textColor: string;
    backgroundColor: string;
    borderRadius: number;
    paddingTop: number;
    paddingBottom: number;
    paddingHorizontal: number;
    accentStyle: TitleAccentStyle;
    accentColor: string;
    subtitleFontSize: number;
    subtitleFontWeight: TitleFontWeight;
    subtitleFontFamily: TitleFontFamily;
    subtitleItalic: boolean;
    subtitleUnderline: boolean;
    subtitleStrikethrough: boolean;
    subtitleTextTransform: TitleTextTransform;
    subtitleLetterSpacing: number;
    subtitleLineHeightMultiplier: number;
    subtitleTextColor: string;
    subtitleSpacingTop: number;
}

export const TITLE_STYLE_PREFIX = '__title_style__:';

export const DEFAULT_TITLE_STYLE: TitleStyleConfig = {
    subtitle: '',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'default',
    italic: false,
    underline: false,
    strikethrough: false,
    textTransform: 'none',
    letterSpacing: 0,
    lineHeightMultiplier: 1.25,
    textAlign: 'left',
    textColor: '',
    backgroundColor: '',
    borderRadius: 14,
    paddingTop: 4,
    paddingBottom: 12,
    paddingHorizontal: 20,
    accentStyle: 'none',
    accentColor: '#FB5607',
    subtitleFontSize: 13,
    subtitleFontWeight: '500',
    subtitleFontFamily: 'default',
    subtitleItalic: false,
    subtitleUnderline: false,
    subtitleStrikethrough: false,
    subtitleTextTransform: 'none',
    subtitleLetterSpacing: 0,
    subtitleLineHeightMultiplier: 1.3,
    subtitleTextColor: '',
    subtitleSpacingTop: 4,
};

export function encodeTitleStyleItem(config: TitleStyleConfig): string[] {
    return [`${TITLE_STYLE_PREFIX}${JSON.stringify(config)}`];
}

export function decodeTitleStyleItems(itemIds?: string[] | null): TitleStyleConfig {
    const raw = (itemIds || []).find((item) => typeof item === 'string' && item.startsWith(TITLE_STYLE_PREFIX));
    if (!raw) return { ...DEFAULT_TITLE_STYLE };
    try {
        const parsed = JSON.parse(raw.slice(TITLE_STYLE_PREFIX.length));
        return { ...DEFAULT_TITLE_STYLE, ...(parsed || {}) };
    } catch {
        return { ...DEFAULT_TITLE_STYLE };
    }
}
