/**
 * Utilitaires fiables pour parser, calculer et formater les durées de recettes
 * (gestion des formats : "20 min", "2h", "1.5h", "1h", "48h", "3 jours", etc.)
 */

export interface RecipeDurationInfo {
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  formattedTotal: string;
  formattedPrep: string;
  formattedCook: string;
  displayLabel: string;
}

/**
 * Parse une chaîne de durée en minutes entières
 */
export function parseDurationToMinutes(durationStr?: string | null): number {
  if (!durationStr) return 0;
  const raw = durationStr.trim().toLowerCase();

  // Format jours : "3 jours", "2 jours"
  if (raw.includes('jour')) {
    const daysMatch = raw.match(/([0-9]+(?:\.[0-9]+)?)/);
    const days = daysMatch ? parseFloat(daysMatch[1]) : 1;
    return Math.round(days * 24 * 60);
  }

  // Format heures : "2h", "1.5h", "2 h", "1h20", "2h 20 min"
  if (raw.includes('h')) {
    const parts = raw.split('h');
    const hours = parseFloat(parts[0].replace(/[^0-9.]/g, '') || '0');
    let extraMinutes = 0;
    if (parts[1]) {
      extraMinutes = parseFloat(parts[1].replace(/[^0-9.]/g, '') || '0');
    }
    return Math.round(hours * 60 + extraMinutes);
  }

  // Format minutes : "25 min", "30 minutes", "15"
  const minMatch = raw.match(/([0-9]+)/);
  return minMatch ? parseInt(minMatch[1], 10) : 0;
}

/**
 * Formate un nombre de minutes en texte lisible (ex: "25 min", "1h15", "2h", "2h20")
 */
export function formatMinutesToText(minutes: number): string {
  if (minutes <= 0) return 'Rapide';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}j`;
  }

  if (remainingMin === 0) {
    return `${hours}h`;
  }

  return `${hours}h${remainingMin < 10 ? '0' : ''}${remainingMin}`;
}

/**
 * Analyse complète d'une recette et calcul du temps total
 */
export function getRecipeDurationInfo(
  prepTime?: string | null,
  cookTime?: string | null
): RecipeDurationInfo {
  const prepMinutes = parseDurationToMinutes(prepTime);
  const cookMinutes = parseDurationToMinutes(cookTime);
  const totalMinutes = prepMinutes + cookMinutes;

  const formattedPrep = formatMinutesToText(prepMinutes);
  const formattedCook = formatMinutesToText(cookMinutes);
  const formattedTotal = formatMinutesToText(totalMinutes);

  // Détermine le label le plus pertinent pour les cartes
  let displayLabel: string;
  if (totalMinutes > 0) {
    if (cookMinutes === 0) {
      displayLabel = `Prép. ${formattedPrep}`;
    } else {
      displayLabel = `Total ${formattedTotal}`;
    }
  } else if (prepMinutes > 0) {
    displayLabel = `Prép. ${formattedPrep}`;
  } else {
    displayLabel = '30 min';
  }

  return {
    prepMinutes,
    cookMinutes,
    totalMinutes,
    formattedTotal,
    formattedPrep,
    formattedCook,
    displayLabel,
  };
}
