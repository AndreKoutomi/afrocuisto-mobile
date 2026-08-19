import { AiChefRecipeResult, AiChefIngredient } from '../types/aiChef';

/**
 * 1. SYSTEM PROMPT & RESTRICTIONS STRICTES DE L'IA AFROCUISTO
 */
export const CHEF_IA_SYSTEM_PROMPT = `Tu es exclusivement le Chef IA d'AfroCuisto, expert d'élite en gastronomie béninoise et africaine.

DIRECTIVES STRICTES & GARDE-FOUS :
1. Périmètre strict : Tu ne réponds QU'AUX questions culinaires, suggestions de recettes avec des ingrédients donnés, techniques de préparation du terroir africain et accompagnements traditionnels.
2. Zéro bavardage / Anti-perte de temps : Ne génère AUCUNE introduction superflue ("Bonjour cher gourmand", "Voici une recette..."), AUCUN bavardage conversationnel. Va droit au but.
3. Garde-fous absolu : Si l'utilisateur pose une question hors cuisine/ingrédients (ex: météo, politique, devoirs, santé non nutritionnelle, etc.), réponds EXACTEMENT et UNIQUEMENT :
"Je suis uniquement programmé pour vous aider à cuisiner de délicieux plats africains. Quels ingrédients avez-vous sous la main ?"
4. Format de réponse structuré : Retourne directement les données de la recette selon ce format :
- Nom du plat & Région/Origine
- Métriques clés (Temps total, Difficulté, Portions)
- Ingrédients utilisés vs Ingrédients du placard manquants
- 3 à 4 étapes de préparation ultra-synthétiques
- Suggestions d'accompagnements locaux`;

export const GUARDRAIL_RESPONSE =
  'Je suis uniquement programmé pour vous aider à cuisiner de délicieux plats africains. Quels ingrédients avez-vous sous la main ?';

// Base de connaissances gastronomique du terroir pour suggestion instantanée ultra-précise
interface RecipeTemplate {
  keywords: string[];
  dishName: string;
  region: string;
  category: string;
  totalTime: string;
  prepTime: string;
  cookTime: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  servings: string;
  allIngredients: AiChefIngredient[];
  steps: string[];
  suggestedSides: string[];
  chefTip: string;
}

const CULINARY_KNOWLEDGE_BASE: RecipeTemplate[] = [
  {
    keywords: ['poulet', 'chicken', 'volaille'],
    dishName: 'Amiwô au Poulet Doré & Sauce Tomate',
    region: 'Sud-Bénin 🇧🇯',
    category: 'Pâtes & Céréales du Terroir',
    totalTime: '40 min',
    prepTime: '15 min',
    cookTime: '25 min',
    difficulty: 'Moyen',
    servings: '4 pers.',
    allIngredients: [
      { name: 'Morceaux de Poulet', amount: '500g' },
      { name: 'Farine de Maïs fine', amount: '350g' },
      { name: 'Tomates fraîches mixées', amount: '4 belles pièces' },
      { name: 'Oignons rouges & Ail', amount: '2 pièces' },
      { name: 'Huile rouge (Zomi) ou végétale', amount: '3 c. à soupe' },
      { name: 'Piment vert & Sel de mer', amount: '1 pincée' },
    ],
    steps: [
      'Assaisonner le poulet avec ail, gingembre et sel, puis le faire dorer dans une sauteuse.',
      'Faire revenir les oignons et les tomates mixées dans l’huile pour obtenir une base rouge onctueuse.',
      'Prélever une louche de bouillon de tomate, y diluer une partie de la farine de maïs, puis verser le tout à ébullition.',
      'Verser le reste de farine en pluie en tournant vigoureusement à la spatule pendant 10 min jusqu’à consistance parfaite.',
    ],
    suggestedSides: ['Piment vert écrasé', 'Oignons frits', 'Jus de Bissap glacé'],
    chefTip: 'Ajoutez une larme d’huile rouge Zomi en fin de cuisson pour donner ce parfum fumé authentique.',
  },
  {
    keywords: ['poisson', 'fish', 'carpe', 'tilapia', 'fum'],
    dishName: 'Sauce Gboman au Poisson Fumé & Crevettes',
    region: 'Bénin / Togo 🇧🇯🇹🇬',
    category: 'Sauces Feuilles & Poissons',
    totalTime: '30 min',
    prepTime: '10 min',
    cookTime: '20 min',
    difficulty: 'Facile',
    servings: '3-4 pers.',
    allIngredients: [
      { name: 'Poisson fumé (ou frais doré)', amount: '2 pièces' },
      { name: 'Feuilles de Gboman (ou épinards)', amount: '1 botte' },
      { name: 'Tomates fraîches écrasées', amount: '3 pièces' },
      { name: 'Oignon & Piment rouge', amount: '1 pièce' },
      { name: 'Poudre de crevettes séchées', amount: '2 c. à café' },
      { name: 'Huile de palme raffinée', amount: '2 c. à soupe' },
    ],
    steps: [
      'Laver et blanchir les feuilles de Gboman 3 minutes dans de l’eau bouillante salée, puis égoutter.',
      'Faire rissoler l’oignon et la tomate avec la poudre de crevette dans l’huile chaude.',
      'Ajouter le poisson fumé émietté et laisser mijoter 5 minutes à feu doux.',
      'Incorporer les feuilles blanchies, remuer délicatement et laisser cuire 5 minutes supplémentaires.',
    ],
    suggestedSides: ['Pâte blanche (Wô)', 'Akassa au maïs fermenté', 'Riz blanc cassé'],
    chefTip: 'Ne couvrez pas la marmite en fin de cuisson pour garder l’éclat vert naturel des feuilles.',
  },
  {
    keywords: ['igname', 'yam', 'agoun'],
    dishName: "Agoun d'Igname pilée & Sauce Tomate Épicée",
    region: 'Centre-Nord Bénin 🇧🇯',
    category: 'Tubercules & Pâtes Pilonnées',
    totalTime: '35 min',
    prepTime: '10 min',
    cookTime: '25 min',
    difficulty: 'Facile',
    servings: '4 pers.',
    allIngredients: [
      { name: 'Igname douce', amount: '1 kg' },
      { name: 'Tomates & Oignons', amount: '3 pièces' },
      { name: 'Ail & Piment frais', amount: '2 gousses' },
      { name: 'Huile d’arachide', amount: '2 c. à soupe' },
      { name: 'Épices du terroir', amount: '1 c. à café' },
    ],
    steps: [
      'Éplucher l’igname, la couper en gros morceaux et la faire bouillir dans une eau salée jusqu’à tendreté.',
      'Piler l’igname encore chaude au mortier ou au robot jusqu’à obtenir une texture élastique et fondante.',
      'Préparer la sauce en faisant mijoter les tomates, oignons émincés et piment dans un filet d’huile.',
      'Dresser la boule d’igname tiède avec la sauce onctueuse au centre.',
    ],
    suggestedSides: ['Sauce d’arachide (Azin)', 'Sauce Gombo (Févî)', 'Poisson braisé'],
    chefTip: 'Piler dès la sortie de l’eau bouillante pour éviter la formation de petits grumeaux.',
  },
  {
    keywords: ['plantain', 'banane', 'alloco', 'dodo'],
    dishName: 'Alloco Crousti-Moelleux & Dja Pimenté',
    region: 'Afrique de l’Ouest 🇨🇮🇧🇯',
    category: 'Street Food & Gourmandises',
    totalTime: '20 min',
    prepTime: '8 min',
    cookTime: '12 min',
    difficulty: 'Facile',
    servings: '2-3 pers.',
    allIngredients: [
      { name: 'Bananes plantains mûres', amount: '3 pièces' },
      { name: 'Huile de friture', amount: '1 bain' },
      { name: 'Tomates fraîches', amount: '2 pièces' },
      { name: 'Oignon rouge & Piment', amount: '1 pièce' },
      { name: 'Sel fin', amount: '1 pincée' },
    ],
    steps: [
      'Éplucher les plantains et les couper en rondelles ou dés réguliers de 1,5 cm.',
      'Chauffer l’huile à 175°C et y plonger les bananes jusqu’à une belle couleur acajou dorée.',
      'Mixer les tomates, oignons et piment, puis faire réduire à feu vif avec un peu d’huile.',
      'Saler légèrement les allocos à la sortie du bain et servir avec la sauce pimentée bien chaude.',
    ],
    suggestedSides: ['Œufs durs ou au plat', 'Poisson frit', 'Poulet grillé au feu de bois'],
    chefTip: 'Choisissez des plantains dont la peau est tachetée de noir pour un goût sucré et fondant.',
  },
  {
    keywords: ['gboman', 'feuille', 'epinard', 'legume'],
    dishName: 'Sauce Légumes Gboman Traditionnelle',
    region: 'Sud-Bénin 🇧🇯',
    category: 'Sauces Feuilles du Terroir',
    totalTime: '25 min',
    prepTime: '10 min',
    cookTime: '15 min',
    difficulty: 'Facile',
    servings: '4 pers.',
    allIngredients: [
      { name: 'Feuilles fraîches de Gboman', amount: '2 bottes' },
      { name: 'Tomates mixées', amount: '3 pièces' },
      { name: 'Oignon & Ail râpé', amount: '1 pièce' },
      { name: 'Poissons séchés ou crevettes', amount: '100g' },
      { name: 'Huile végétale ou rouge', amount: '3 c. à soupe' },
    ],
    steps: [
      'Équeuter et rincer abondamment les feuilles de Gboman, puis les découper finement.',
      'Blanchir les feuilles 2 minutes dans l’eau bouillante avec une pincée de bicarbonate ou potasse.',
      'Préparer un fond de sauce aromatique avec oignons, tomates et crevettes séchées.',
      'Ajouter les légumes égouttés, mélanger et laisser mijoter 4 minutes.',
    ],
    suggestedSides: ['Pâte de maïs Wô', 'Piron rouge', 'Manioc vapeur'],
    chefTip: 'Une pointe de gingembre frais dans le fond de sauce rehausse immédiatement le goût des feuilles.',
  },
  {
    keywords: ['oeuf', 'egg', 'tomate', 'oignon', 'piment'],
    dishName: 'Omelette Africaine Revisitée au Piment doux & Oignons',
    region: 'Afrique de l’Ouest 🌍',
    category: 'Petits Plats Express',
    totalTime: '15 min',
    prepTime: '5 min',
    cookTime: '10 min',
    difficulty: 'Facile',
    servings: '2 pers.',
    allIngredients: [
      { name: 'Œufs frais', amount: '4 pièces' },
      { name: 'Tomates fermes en dés', amount: '2 pièces' },
      { name: 'Oignon émincé', amount: '1 pièce' },
      { name: 'Piment vert doux & Poivre', amount: '1 pièce' },
      { name: 'Huile de cuisson', amount: '1 c. à soupe' },
    ],
    steps: [
      'Battre énergiquement les œufs dans un bol avec sel, poivre et une pointe de bouillon.',
      'Faire suer les oignons et tomates dans une poêle chaude pendant 3 minutes.',
      'Verser les œufs battus sur les légumes et laisser prendre à feu doux.',
      'Replier l’omelette sur elle-même pour garder un cœur baveux et fondant.',
    ],
    suggestedSides: ['Pain baguette croustillant', 'Rondelles d’avocat mûr', 'Café chaud au lait'],
    chefTip: 'Ajoutez une pincée de persil ou de ciboulette locale au moment de battre les œufs.',
  },
  {
    keywords: ['riz', 'rice', 'viande', 'boeuf', 'gras'],
    dishName: 'Riz au Gras Africain (Thieboudienne Express)',
    region: 'Afrique de l’Ouest 🇸🇳🇧🇯',
    category: 'Riz & Céréales Mijotées',
    totalTime: '45 min',
    prepTime: '15 min',
    cookTime: '30 min',
    difficulty: 'Moyen',
    servings: '4-5 pers.',
    allIngredients: [
      { name: 'Riz parfumé ou brisure', amount: '400g' },
      { name: 'Viande de bœuf ou agneau', amount: '400g' },
      { name: 'Concentré de tomate & Tomates fraîches', amount: '3 c. à soupe' },
      { name: 'Oignons, Ail & Poivron', amount: '2 pièces' },
      { name: 'Légumes du marché (carottes, chou)', amount: '200g' },
    ],
    steps: [
      'Dorer la viande coupée en dés dans l’huile chaude, puis réserver.',
      'Faire roussir la tomate et le mélange oignon-ail-poivron mixé pour créer la base.',
      'Ajouter de l’eau, la viande et les légumes, puis laisser frémir 15 minutes.',
      'Laver le riz, le verser dans le bouillon filtré, couvrir hermétiquement et cuire à feu très doux 20 minutes.',
    ],
    suggestedSides: ['Sauce piment rouge maison', 'Quartiers de citron vert', 'Salade fraîche'],
    chefTip: 'Placez une feuille d’aluminium ou un sachet propre sous le couvercle pour une cuisson vapeur parfaite du riz.',
  },
];

/**
 * Détecte si le texte de l'utilisateur est strictement lié à la cuisine / ingrédients
 */
function isCulinaryQuery(text: string): boolean {
  const clean = text.toLowerCase().trim();
  if (!clean) return false;

  // Mots clés hors sujet évidents
  const offTopicKeywords = [
    'président',
    'politique',
    'météo',
    'bitcoin',
    'crypto',
    'football match',
    'qui es-tu',
    'ton nom',
    'devoirs de maths',
    'python code',
    'programmeur',
    'chante',
    'poème',
    'blague',
  ];

  for (const off of offTopicKeywords) {
    if (clean.includes(off)) {
      return false;
    }
  }

  // Mots clés ou ingrédients culinaires
  const culinaryKeywords = [
    'poulet',
    'poisson',
    'tomate',
    'oignon',
    'plantain',
    'igname',
    'gboman',
    'oeuf',
    'riz',
    'manioc',
    'gari',
    'viande',
    'boeuf',
    'farine',
    'gombo',
    'crincrin',
    'ademe',
    'huile',
    'piment',
    'ail',
    'sel',
    'cuisiner',
    'manger',
    'plat',
    'recette',
    'frigo',
    'repas',
    'sauce',
    'ingrédient',
    'ingredients',
    'amiwo',
    'agoun',
    'akassa',
    'atassi',
    'ablo',
    'dèguè',
    'degue',
    'alloco',
    'dodo',
    'mafé',
    'yassa',
  ];

  return culinaryKeywords.some(k => clean.includes(k)) || clean.length > 2;
}

/**
 * Service Chef IA AfroCuisto
 */
export const AiChefService = {
  /**
   * Traite une demande utilisateur selon les règles strictes
   */
  async processUserMessage(
    userText: string
  ): Promise<{ isGuardrail: boolean; text?: string; recipe?: AiChefRecipeResult }> {
    // 1. Simuler un temps de calcul fluide (500-900ms)
    await new Promise(resolve => setTimeout(resolve, 750));

    const cleanInput = userText.trim().toLowerCase();

    // 2. Vérification des Garde-fous (Périmètre strict)
    if (!isCulinaryQuery(cleanInput)) {
      return {
        isGuardrail: true,
        text: GUARDRAIL_RESPONSE,
      };
    }

    // 3. Identification des ingrédients fournis par l'utilisateur
    const detectedIngredients: string[] = [];
    const knownIngredientMap: Record<string, string> = {
      poulet: 'Poulet',
      poisson: 'Poisson',
      tomate: 'Tomates fraîches',
      oignon: 'Oignon',
      plantain: 'Banane plantain',
      igname: 'Igname',
      gboman: 'Feuilles de Gboman',
      oeuf: 'Œufs',
      egg: 'Œufs',
      riz: 'Riz',
      manioc: 'Manioc',
      gombo: 'Gombo frais',
      piment: 'Piment rouge',
      ail: 'Ail',
      viande: 'Viande de bœuf',
    };

    for (const [key, label] of Object.entries(knownIngredientMap)) {
      if (cleanInput.includes(key)) {
        detectedIngredients.push(label);
      }
    }

    // 4. Recherche de la meilleure correspondance de recette
    let matchedTemplate = CULINARY_KNOWLEDGE_BASE.find(tpl =>
      tpl.keywords.some(k => cleanInput.includes(k))
    );

    // Si aucune correspondance exacte, prendre la première recette équilibrée (Amiwô au Poulet)
    if (!matchedTemplate) {
      matchedTemplate = CULINARY_KNOWLEDGE_BASE[0];
    }

    // 5. Partition des ingrédients : Utilisés (ceux mentionnés) vs Manquants (placard / courses)
    const usedIngredients: AiChefIngredient[] = [];
    const missingIngredients: AiChefIngredient[] = [];

    matchedTemplate.allIngredients.forEach(ing => {
      const isMentioned =
        detectedIngredients.some(d => ing.name.toLowerCase().includes(d.toLowerCase())) ||
        cleanInput.includes(ing.name.toLowerCase().split(' ')[0]);

      if (isMentioned || usedIngredients.length < 2) {
        usedIngredients.push(ing);
      } else {
        missingIngredients.push(ing);
      }
    });

    const structuredRecipe: AiChefRecipeResult = {
      id: `ai_recipe_${Date.now()}`,
      dishName: matchedTemplate.dishName,
      region: matchedTemplate.region,
      category: matchedTemplate.category,
      totalTime: matchedTemplate.totalTime,
      prepTime: matchedTemplate.prepTime,
      cookTime: matchedTemplate.cookTime,
      difficulty: matchedTemplate.difficulty,
      servings: matchedTemplate.servings,
      usedIngredients,
      missingIngredients,
      steps: matchedTemplate.steps,
      suggestedSides: matchedTemplate.suggestedSides,
      chefTip: matchedTemplate.chefTip,
    };

    return {
      isGuardrail: false,
      recipe: structuredRecipe,
    };
  },
};
