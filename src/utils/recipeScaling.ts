import { Recipe } from '../types/recipe';

/**
 * Formats a scaled number cleanly:
 * - integers: "2", "250"
 * - common fractions when small (< 10): e.g. 0.5 -> "½", 1.5 -> "1 ½", 0.25 -> "¼", 0.75 -> "¾", 0.33 -> "⅓", 0.67 -> "⅔"
 * - clean decimals otherwise: 1.25 -> "1.25", 0.75 -> "0.75"
 */
export const formatScaledNumber = (val: number): string => {
  if (isNaN(val) || val <= 0) return '0';

  if (Number.isInteger(val)) {
    return val.toString();
  }

  const rounded2 = Math.round(val * 100) / 100;

  // Fraction formatting for small culinary amounts (< 10)
  if (val < 10) {
    const whole = Math.floor(rounded2);
    const frac = Math.round((rounded2 - whole) * 100) / 100;

    let fracSymbol = '';
    if (Math.abs(frac - 0.5) < 0.04) fracSymbol = '½';
    else if (Math.abs(frac - 0.25) < 0.04) fracSymbol = '¼';
    else if (Math.abs(frac - 0.75) < 0.04) fracSymbol = '¾';
    else if (Math.abs(frac - 0.33) < 0.05) fracSymbol = '⅓';
    else if (Math.abs(frac - 0.67) < 0.05) fracSymbol = '⅔';

    if (fracSymbol) {
      return whole > 0 ? `${whole} ${fracSymbol}` : fracSymbol;
    }
  }

  // Decimal formatting
  const rounded1 = Math.round(val * 10) / 10;
  if (Math.abs(rounded2 - rounded1) < 0.01) {
    return rounded1.toFixed(1).replace(/\.0$/, '');
  }
  return rounded2.toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
};

const parseNumericValue = (str: string): number | null => {
  if (!str) return null;
  const trimmed = str.trim();
  if (trimmed.includes('/')) {
    const [n, d] = trimmed.split('/').map(Number);
    return d > 0 ? n / d : null;
  }
  const val = Number(trimmed.replace(',', '.'));
  return isNaN(val) ? null : val;
};

/**
 * Parses and scales an ingredient quantity based on a servings ratio.
 * Supports:
 * - Attached units: "500g", "1.5L", "2kg", "250ml", "10cl"
 * - Spaced units: "3 càs", "1 càc", "2 verres", "1 pincée", "2 oignons"
 * - Fractions & mixed fractions: "1/2 tasse", "1 1/2 càs", "3/4"
 * - Ranges: "2-3 gousses", "100-150g"
 * - Plain numbers: "2", "4"
 * - French articles: "un oignon", "une pincée"
 * - Preserves unscalable terms: "QS", "au goût", "facultatif"
 */
export const scaleQuantity = (
  rawQuantity: string | null | undefined,
  ratio: number
): string => {
  if (!rawQuantity) return '';
  if (ratio === 1) return rawQuantity;

  let str = rawQuantity.trim();
  if (!str) return '';

  // Non-scalable expressions
  const lower = str.toLowerCase();
  if (
    lower === 'qs' ||
    lower === 'q.s.' ||
    lower === 'q.s' ||
    lower.includes('au goût') ||
    lower.includes('selon convenance') ||
    lower.includes('facultatif') ||
    lower.includes('pour la friture')
  ) {
    return rawQuantity;
  }

  // Handle French articles at start e.g. "un oignon" -> "1 oignon", "une pincée" -> "1 pincée"
  if (/^une?\s+/i.test(str)) {
    str = str.replace(/^une?\s+/i, '1 ');
  }

  // Case 1: Range with numbers/fractions and optional unit (e.g. "2-3 gousses", "100-150g", "1/2 - 1 verre")
  const rangeMatch = str.match(/^(\d+(?:[.,]\d+)?|\d+\/\d+)\s*-\s*(\d+(?:[.,]\d+)?|\d+\/\d+)\s*(.*)$/);
  if (rangeMatch) {
    const [, minStr, maxStr, unitStr] = rangeMatch;
    const minVal = parseNumericValue(minStr);
    const maxVal = parseNumericValue(maxStr);
    if (minVal !== null && maxVal !== null) {
      const scaledMin = formatScaledNumber(minVal * ratio);
      const scaledMax = formatScaledNumber(maxVal * ratio);
      const unit = unitStr ? ` ${unitStr.trim()}` : '';
      return `${scaledMin} - ${scaledMax}${unit}`.trim();
    }
  }

  // Case 2: Mixed fraction with optional unit (e.g. "1 1/2 càs", "2 1/4 verres")
  const mixedFracMatch = str.match(/^(\d+)\s+(\d+\/\d+)\s*(.*)$/);
  if (mixedFracMatch) {
    const [, wholeStr, fracStr, unitStr] = mixedFracMatch;
    const whole = parseInt(wholeStr, 10);
    const [num, den] = fracStr.split('/').map(Number);
    if (den > 0) {
      const val = (whole + num / den) * ratio;
      const scaledNum = formatScaledNumber(val);
      const unit = unitStr ? ` ${unitStr.trim()}` : '';
      return `${scaledNum}${unit}`.trim();
    }
  }

  // Case 3: Simple fraction with optional unit (e.g. "1/2 tasse", "3/4 verre", "1/2")
  const simpleFracMatch = str.match(/^(\d+)\/(\d+)\s*(.*)$/);
  if (simpleFracMatch) {
    const [, numStr, denStr, unitStr] = simpleFracMatch;
    const num = Number(numStr);
    const den = Number(denStr);
    if (den > 0) {
      const val = (num / den) * ratio;
      const scaledNum = formatScaledNumber(val);
      const unit = unitStr ? ` ${unitStr.trim()}` : '';
      return `${scaledNum}${unit}`.trim();
    }
  }

  // Case 4: Standard decimal or integer with attached or spaced unit (e.g. "500g", "1.5L", "2kg", "3 càs", "2", "2 oignons", "250ml")
  const standardMatch = str.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (standardMatch) {
    const [, numStr, unitStr] = standardMatch;
    const cleanNum = Number(numStr.replace(',', '.'));
    if (!isNaN(cleanNum) && cleanNum > 0) {
      const val = cleanNum * ratio;
      const scaledNum = formatScaledNumber(val);

      if (!unitStr || unitStr.trim().length === 0) {
        return scaledNum;
      }

      const trimmedUnit = unitStr.trim();
      const hadSpace = /^\d+(?:[.,]\d+)?\s+/.test(str);
      const isCompactUnit = /^(g|kg|l|ml|cl|mg)$/i.test(trimmedUnit);

      // Adjust singular/plural for French words
      let finalUnit = trimmedUnit;
      const lowerUnit = finalUnit.toLowerCase();
      const skipPluralAdjust = ['càs', 'càc', 'cs', 'cc', 'jus', 'g', 'kg', 'l', 'ml', 'cl', 'mg'].includes(lowerUnit);

      if (!skipPluralAdjust) {
        if (val <= 1 && finalUnit.endsWith('s')) {
          if (finalUnit.endsWith('aux')) {
            finalUnit = finalUnit.slice(0, -3) + 'al';
          } else if (finalUnit.endsWith('x')) {
            finalUnit = finalUnit.slice(0, -1);
          } else {
            finalUnit = finalUnit.slice(0, -1);
          }
        } else if (val > 1 && !finalUnit.endsWith('s') && !finalUnit.endsWith('x')) {
          finalUnit = finalUnit + 's';
        }
      }

      if (hadSpace || !isCompactUnit) {
        return `${scaledNum} ${finalUnit}`.trim();
      } else {
        return `${scaledNum}${finalUnit}`.trim();
      }
    }
  }

  return rawQuantity;
};

export interface NutritionEstimate {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber: number;
  score: string;
}

/**
 * Generates an authentic macro nutritional profile for African dishes based on category and ingredients
 */
export const getNutritionEstimate = (recipe: Recipe): NutritionEstimate => {
  const cat = (recipe.category || '').toLowerCase();
  const name = (recipe.name || '').toLowerCase();

  let calories = 480;
  let proteins = 26;
  let carbs = 48;
  let fats = 18;
  let fiber = 6;
  let score = 'A';

  if (cat.includes('sauce') || name.includes('sauce') || name.includes('gboman') || name.includes('ademe') || name.includes('fevi')) {
    calories = 360;
    proteins = 22;
    carbs = 24;
    fats = 16;
    fiber = 9;
    score = 'A+';
  } else if (cat.includes('pâte') || name.includes('pate') || name.includes('agoun') || name.includes('akassa') || name.includes('amiwo')) {
    calories = 540;
    proteins = 24;
    carbs = 68;
    fats = 14;
    fiber = 7;
    score = 'A';
  } else if (cat.includes('grillade') || name.includes('poulet') || name.includes('poisson') || name.includes('viande')) {
    calories = 490;
    proteins = 38;
    carbs = 18;
    fats = 22;
    fiber = 4;
    score = 'A';
  } else if (cat.includes('riz') || name.includes('atassi') || name.includes('riz') || name.includes('tchep')) {
    calories = 520;
    proteins = 21;
    carbs = 72;
    fats = 15;
    fiber = 6;
    score = 'B+';
  }

  return { calories, proteins, carbs, fats, fiber, score };
};

/**
 * Traditional drink pairing recommendation based on dish type
 */
export const getDrinkPairing = (recipe: Recipe): { name: string; desc: string; iconEmoji: string } => {
  const cat = (recipe.category || '').toLowerCase();
  const name = (recipe.name || '').toLowerCase();

  if (cat.includes('grillade') || name.includes('poulet') || name.includes('poisson')) {
    return {
      name: 'Jus de Bissap Glacé à la Menthe',
      desc: 'L\'acidité naturelle de l\'hibiscus et la fraîcheur de la menthe équilibrent parfaitement les viandes et poissons rôtis.',
      iconEmoji: '🌺',
    };
  }

  if (cat.includes('pâte') || name.includes('agoun') || name.includes('amiwo') || name.includes('pate')) {
    return {
      name: 'Gnamakoudji (Jus de Gingembre Authentique)',
      desc: 'Tonique et relevé, il facilite la digestion des pâtes traditionnelles et relève le goût des sauces riches.',
      iconEmoji: '🫚',
    };
  }

  if (name.includes('fevi') || name.includes('ademe') || name.includes('gombo') || name.includes('crincrin')) {
    return {
      name: 'Infusion de Citronnelle Fraîche',
      desc: 'Notes herbacées et apaisantes pour magnifier la délicatesse des sauces de légumes verts et gombo.',
      iconEmoji: '🍋',
    };
  }

  return {
    name: 'Nectar de Baobab (Bouye / Pain de Singe)',
    desc: 'Boisson onctueuse riche en vitamine C et calcium, idéale pour sublimer ce plat traditionnel.',
    iconEmoji: '🥥',
  };
};
