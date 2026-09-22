import { AiChefRecipeResult, AiChefIngredient } from '../types/aiChef';
import { GeminiService } from './geminiService';

/**
 * 1. SYSTEM PROMPT & RESTRICTIONS STRICTES DU CHEF IA AFROCUISTO
 */
export const CHEF_IA_SYSTEM_PROMPT = `Tu es le Chef IA d'AfroCuisto, expert d'élite en gastronomie béninoise et africaine.
Périmètre strict : Recettes, ingrédients, terroir, techniques culinaires africaines, astuces de chef, accords boissons locales.
Garde-fous : Toute question hors cuisine reçoit la réponse standard d'orientation culinaire.`;

export const GUARDRAIL_RESPONSE =
  'Je suis votre Chef IA dédié exclusivement à la cuisine africaine et béninoise 🍲. Indiquez-moi vos ingrédients du frigo ou posez-moi une question culinaire, et je vous prépare une recette sur mesure !';

// Modèle de recette pour la base de connaissances
interface RecipeTemplate {
  id: string;
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
  drinkPairing: string;
  suggestedQuickReplies: string[];
}

const CULINARY_KNOWLEDGE_BASE: RecipeTemplate[] = [
  {
    id: 'amiwo_poulet',
    keywords: ['poulet', 'chicken', 'volaille', 'amiwo', 'amiwô', 'farine de mais', 'mais'],
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
    drinkPairing: 'Jus de Bissap bien frais à la menthe fraîche 🌺',
    suggestedQuickReplies: ['Remplacer l’huile rouge ?', 'Comment éviter les grumeaux ?', 'Variante avec poisson'],
  },
  {
    id: 'sauce_gboman',
    keywords: ['poisson', 'fish', 'carpe', 'tilapia', 'gboman', 'feuille', 'epinard', 'crevette'],
    dishName: 'Sauce Gboman au Poisson Fumé & Crevettes',
    region: 'Bénin / Togo 🇧🇯🇹🇬',
    category: 'Sauces Feuilles & Poissons',
    totalTime: '30 min',
    prepTime: '10 min',
    cookTime: '20 min',
    difficulty: 'Facile',
    servings: '3-4 pers.',
    allIngredients: [
      { name: 'Poisson fumé (ou doré)', amount: '2 pièces' },
      { name: 'Feuilles de Gboman fraîches', amount: '1 botte' },
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
    drinkPairing: 'Jus de Baobab onctueux ou eau de coco fraîche 🥥',
    suggestedQuickReplies: ['Quelle pâte choisir ?', 'Remplacer le poisson fumé ?', 'Autre idée express'],
  },
  {
    id: 'agoun_igname',
    keywords: ['igname', 'yam', 'agoun', 'pilée', 'tuber'],
    dishName: "Agoun d'Igname pilée & Sauce Tomate Épicée",
    region: 'Centre-Nord Bénin 🇧🇯',
    category: 'Tubercules & Pâtes Pilonnées',
    totalTime: '35 min',
    prepTime: '10 min',
    cookTime: '25 min',
    difficulty: 'Facile',
    servings: '4 pers.',
    allIngredients: [
      { name: 'Igname douce Laboco', amount: '1 kg' },
      { name: 'Tomates & Oignons', amount: '3 pièces' },
      { name: 'Ail & Piment frais', amount: '2 gousses' },
      { name: 'Huile d’arachide ou zomi', amount: '2 c. à soupe' },
      { name: 'Épices du terroir (Moutarde locale Afitin)', amount: '1 c. à café' },
    ],
    steps: [
      'Éplucher l’igname, la couper en morceaux réguliers et la cuire à l’eau bouillante salée jusqu’à ce qu’un couteau s’y enfonce sans effort.',
      'Piler l’igname encore fumante au mortier ou au robot avec un peu d’eau de cuisson tiède jusqu’à texture élastique.',
      'Préparer la sauce en faisant mijoter les tomates mixées, oignons et piment dans l’huile avec une pointe d’Afitin.',
      'Façonner de belles boules d’igname et napper généreusement de sauce.',
    ],
    suggestedSides: ['Sauce d’arachide Azin', 'Sauce Gombo (Févî)', 'Viande de mouton braisée'],
    chefTip: 'Piler dès la sortie de l’eau bouillante pour une pâte souple, lisse et sans aucun grumeau.',
    drinkPairing: 'Tchoukoutou traditionnel ou jus de Tamarin glacé 🍹',
    suggestedQuickReplies: ['Comment piler au robot ?', 'Sauce arachide compatible ?', 'Conservation de l’igname'],
  },
  {
    id: 'alloco_dja',
    keywords: ['plantain', 'banane', 'alloco', 'aloco', 'dodo', 'friture'],
    dishName: 'Alloco Crousti-Moelleux & Sauce Dja Pimentée',
    region: 'Afrique de l’Ouest 🇨🇮🇧🇯',
    category: 'Street Food & Gourmandises',
    totalTime: '20 min',
    prepTime: '8 min',
    cookTime: '12 min',
    difficulty: 'Facile',
    servings: '2-3 pers.',
    allIngredients: [
      { name: 'Bananes plantains mûres tachetées', amount: '3 pièces' },
      { name: 'Huile de friture', amount: '1 bain' },
      { name: 'Tomates fraîches concassées', amount: '2 pièces' },
      { name: 'Oignon rouge & Piment habanero', amount: '1 pièce' },
      { name: 'Sel fin de mer', amount: '1 pincée' },
    ],
    steps: [
      'Éplucher les plantains et les découper en cubes ou biseaux de 1,5 cm.',
      'Chauffer l’huile à 175°C et y plonger les bananes jusqu’à belle coloration acajou dorée.',
      'Pendant la friture, faire réduire les tomates et oignons mixés avec un filet d’huile pour créer le Dja.',
      'Égoutter les allocos, saler à chaud et servir immédiatement avec le Dja pimenté.',
    ],
    suggestedSides: ['Œufs durs écrasés', 'Poisson frit croustillant', 'Poulet braisé'],
    chefTip: 'Choisissez des plantains dont la peau est bien tachetée de noir pour un cœur ultra fondant et sucré.',
    drinkPairing: 'Jus de Gingembre piquant (Gnamankoudji) bien glacé 🫚',
    suggestedQuickReplies: ['Comment réussir la friture ?', 'Version au four sans huile ?', 'Accompagnement protéiné'],
  },
  {
    id: 'sauce_gombo_fevi',
    keywords: ['gombo', 'okra', 'fevi', 'févi', 'gluante', 'calalou', 'crabe'],
    dishName: 'Sauce Gombo Frais (Févi) aux Crabes & Poissons',
    region: 'Côte Béninoise 🇧🇯',
    category: 'Sauces Traditionnelles Gluantes',
    totalTime: '35 min',
    prepTime: '10 min',
    cookTime: '25 min',
    difficulty: 'Facile',
    servings: '4 pers.',
    allIngredients: [
      { name: 'Gombos frais bien verts', amount: '300g' },
      { name: 'Crabes de lagune ou crevettes', amount: '4 pièces' },
      { name: 'Poisson frais ou fumé', amount: '2 darnes' },
      { name: 'Potasse culinaire (Kaolin)', amount: '1 petite pincée' },
      { name: 'Huile rouge de palme (Zomi)', amount: '2 c. à soupe' },
      { name: 'Piment vert & Afitin (moutarde de néré)', amount: '1 c. à café' },
    ],
    steps: [
      'Hacher finement les gombos ou les mixer grossièrement avec une pointe de potasse.',
      'Faire pocher les crabes et le poisson dans un court-bouillon parfumé à l’ail et à l’oignon.',
      'Ajouter les gombos dans le bouillon frémissant en fouettant à la fourchette pour développer le liant.',
      'Finir par un filet d’huile rouge Zomi et l’Afitin, puis laisser mijoter 5 minutes à feu doux.',
    ],
    suggestedSides: ['Pâte de maïs blanche (Wô)', 'Piron chaud', 'Boule de Telibo (farine de cossettes)'],
    chefTip: 'La potasse fixe la belle chlorophylle verte du gombo et assure un filant soyeux inimitable.',
    drinkPairing: 'Eau fraîche infusée à la citronnelle 🌿',
    suggestedQuickReplies: ['Pâte recommandée avec le gombo ?', 'Version sans fruits de mer', 'Conservation du gombo'],
  },
  {
    id: 'riz_au_gras',
    keywords: ['riz', 'rice', 'gras', 'jollof', 'thieb', 'viande', 'boeuf'],
    dishName: 'Riz au Gras Africain (Jollof Express façon Terroir)',
    region: 'Afrique de l’Ouest 🇧🇯🇳🇬',
    category: 'Riz & Céréales Mijotées',
    totalTime: '45 min',
    prepTime: '15 min',
    cookTime: '30 min',
    difficulty: 'Moyen',
    servings: '4-5 pers.',
    allIngredients: [
      { name: 'Riz parfumé du terroir ou brisure', amount: '400g' },
      { name: 'Viande de bœuf marinée', amount: '400g' },
      { name: 'Concentré & Tomates fraîches', amount: '3 c. à soupe' },
      { name: 'Oignons, Ail & Poivron rouge', amount: '2 pièces' },
      { name: 'Laurier, Thym & Piment entier', amount: '1 bouquet' },
    ],
    steps: [
      'Faire rissoler la viande en dés dans l’huile chaude pour former les sucs, puis réserver.',
      'Faire revenir le mix tomate-oignon-ail jusqu’à ce que l’huile remonte à la surface.',
      'Mouiller avec 600ml de bouillon, réincorporer la viande, laurier et porter à ébullition.',
      'Verser le riz lavé, couvrir hermétiquement à feu doux 20 min sans remuer pour un riz grain à grain.',
    ],
    suggestedSides: ['Alloco doré', 'Salade de crudités au citron', 'Sauce piment maison'],
    chefTip: 'Posez un papier cuisson ou film sous le couvercle : la vapeur piégée cuit le riz à la perfection.',
    drinkPairing: 'Cocktail tropical mangue-passion bien frais 🥭',
    suggestedQuickReplies: ['Comment ne pas faire brûler le fond ?', 'Version poulet', 'Accords sauces'],
  },
  {
    id: 'poulet_yassa',
    keywords: ['yassa', 'citron', 'moutarde', 'oignon', 'poulet mariné'],
    dishName: 'Poulet Yassa aux Oignons Caramélisés & Citron Vert',
    region: 'Sénégal / Ouest Africain 🇸🇳',
    category: 'Mijotés Acidulés & Volailles',
    totalTime: '40 min',
    prepTime: '15 min',
    cookTime: '25 min',
    difficulty: 'Facile',
    servings: '4 pers.',
    allIngredients: [
      { name: 'Cuisses de Poulet fermier', amount: '4 pièces' },
      { name: 'Oignons jaunes émincés', amount: '5 gros oignons' },
      { name: 'Jus de citrons verts frais', amount: '3 pièces' },
      { name: 'Moutarde forte & Ail écrasé', amount: '2 c. à soupe' },
      { name: 'Piment habanero entier & Laurier', amount: '1 pièce' },
    ],
    steps: [
      'Faire griller le poulet préalablement mariné au citron et moutarde à la poêle ou au four.',
      'Dans la même cocotte, faire suer les oignons doucement jusqu’à caramélisation translucide.',
      'Verser la marinade restante, ajouter le laurier et laisser confire 15 minutes.',
      'Remettre le poulet grillé au cœur de la compotée d’oignons 10 minutes avant de servir.',
    ],
    suggestedSides: ['Riz blanc jasmin', 'Attiéké vapeur à l’huile d’olive', 'Bananes plantains frites'],
    chefTip: 'Ne piquez jamais le piment entier dans la cocotte : il parfumera la sauce sans brûler le palais.',
    drinkPairing: 'Jus de Bouye (pain de singe/baobab) vanillé 🧃',
    suggestedQuickReplies: ['Temps de marinade idéal ?', 'Variante avec poisson', 'Quel accompagnement ?'],
  },
  {
    id: 'sauce_arachide_mafe',
    keywords: ['arachide', 'pate d\'arachide', 'mafe', 'mafé', 'azin', 'peanut'],
    dishName: 'Sauce d’Arachide Onctueuse (Azin / Mafé Traditionnel)',
    region: 'Bénin / Sahel 🇧🇯🇲🇱',
    category: 'Sauces Onctueuses & Riches',
    totalTime: '35 min',
    prepTime: '10 min',
    cookTime: '25 min',
    difficulty: 'Facile',
    servings: '4 pers.',
    allIngredients: [
      { name: 'Pâte d’arachide pure non sucrée', amount: '4 c. à soupe' },
      { name: 'Viande de bœuf ou Poulet', amount: '400g' },
      { name: 'Tomates fraîches & Oignons', amount: '3 pièces' },
      { name: 'Légumes (Patate douce, carotte)', amount: '2 pièces' },
      { name: 'Ail, Gingembre & Piment', amount: '1 c. à café' },
    ],
    steps: [
      'Dorer la viande et réserver. Diluer la pâte d’arachide dans 400ml d’eau tiède.',
      'Faire rissoler la purée de tomate et oignon, puis verser le mélange d’arachide fluide.',
      'Ajouter la viande et les légumes en morceaux, puis laisser mijoter 20 min à feu moyen.',
      'La sauce est prête quand une fine pellicule d’huile remonte délicatement en surface.',
    ],
    suggestedSides: ['Riz blanc cassé', 'Boule de pâte de maïs', 'Fonio vapeur'],
    chefTip: 'Remuez régulièrement le fond de la casserole en début de cuisson car l’arachide a tendance à attacher.',
    drinkPairing: 'Jus de Bissap blanc ou infusion de Kinkeliba 🍵',
    suggestedQuickReplies: ['Quelle pâte d’arachide utiliser ?', 'Variante végétarienne', 'Conseil texture'],
  },
  {
    id: 'atassi_waakye',
    keywords: ['haricot', 'haricots', 'atassi', 'waakye', 'ayimolou', 'riz haricot'],
    dishName: 'Atassi Béninois / Ayimolou (Riz & Haricots au Dja)',
    region: 'Bénin / Togo / Ghana 🇧🇯🇹🇬🇬🇭',
    category: 'Classiques du Terroir & Céréales',
    totalTime: '40 min',
    prepTime: '10 min',
    cookTime: '30 min',
    difficulty: 'Facile',
    servings: '4 pers.',
    allIngredients: [
      { name: 'Haricots rouges ou niébé (Kpakpalo)', amount: '200g' },
      { name: 'Riz blanc local', amount: '250g' },
      { name: 'Tomates concassées & Oignons pour le Dja', amount: '3 pièces' },
      { name: 'Poisson frit ou œuf dur', amount: '2 pièces' },
      { name: 'Huile rouge (Zomi) ou végétale', amount: '3 c. à soupe' },
      { name: 'Piment Shito ou piment vert', amount: '1 c. à café' },
    ],
    steps: [
      'Cuire les haricots dans de l’eau salée jusqu’à mi-cuisson (tendres mais fermes).',
      'Ajouter le riz lavé directement dans l’eau teintée des haricots pour qu’il absorbe toute la saveur.',
      'Pendant la cuisson vapeur du riz, préparer le Dja en faisant confire tomates et oignons dans l’huile.',
      'Servir l’Atassi chaud arrosé de Dja, avec poisson frit et une cuillère de piment.',
    ],
    suggestedSides: ['Gari foto ou gari saupoudré', 'Spaghetti sautés', 'Avocat tranché'],
    chefTip: 'Laisser le riz absorber tout le bouillon des haricots sans rajouter d’eau superflue.',
    drinkPairing: 'Jus de Corossol glacé bien crémeux 🍶',
    suggestedQuickReplies: ['Recette du piment Shito ?', 'Variante sans haricot', 'Accords du midi'],
  },
  {
    id: 'omelette_afro',
    keywords: ['oeuf', 'egg', 'oeufs', 'rapide', 'omelette', 'matin'],
    dishName: 'Omelette Africaine aux Tomates, Oignons & Piment Doux',
    region: 'Afrique de l’Ouest 🌍',
    category: 'Petits Plats Express (15 min)',
    totalTime: '15 min',
    prepTime: '5 min',
    cookTime: '10 min',
    difficulty: 'Facile',
    servings: '2 pers.',
    allIngredients: [
      { name: 'Œufs frais', amount: '4 pièces' },
      { name: 'Tomates fermes en dés', amount: '2 pièces' },
      { name: 'Oignon rouge émincé', amount: '1 pièce' },
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
    drinkPairing: 'Thé vert à la menthe douce ou chocolat chaud à la cannelle ☕',
    suggestedQuickReplies: ['Ajouter du fromage ou sardine ?', 'Autre petit-déjeuner express', 'Version sans piment'],
  },
];

/**
 * Réponses intelligentes aux questions culinaires courantes
 */
const CULINARY_ADVICE_RESPONSES: Array<{
  triggers: string[];
  responseTitle: string;
  responseText: string;
  suggestedQuickReplies: string[];
}> = [
  {
    triggers: ['remplacer huile rouge', 'substitut zomi', 'pas d\'huile rouge', 'sans huile de palme', 'remplacer zomi'],
    responseTitle: '💡 Substitution de l’Huile Rouge (Zomi)',
    responseText:
      'Pour remplacer l’huile rouge authentique tout en gardant une belle couleur chaude et un goût riche :\n\n1. **Option Terroir :** Utilisez de l’huile d’arachide ou de tournesol dans laquelle vous faites infuser 1 c. à café de paprika doux fumé et une pincée de curcuma.\n2. **Option Nature :** Une larme d’huile de sésame grillée combinée à du concentré de tomate pour apporter ce parfum torréfié caractéristique.',
    suggestedQuickReplies: ['Recette d’Amiwô sans huile rouge', 'Comment faire du Zomi maison ?', 'Autre conseil d’épices'],
  },
  {
    triggers: ['boisson', 'quoi boire', 'accompagnement boisson', 'jus', 'accord boisson'],
    responseTitle: '🍹 Accords Boissons du Terroir Africain',
    responseText:
      'Voici les meilleures boissons pour sublimer vos plats africains :\n\n• **Avec les plats épicés / pimentés (Alloco, Dja, Suya) :** Le **Jus de Gingembre (Gnamankoudji)** glacé ou de l’**Eau de Coco** pour rafraîchir le palais.\n• **Avec les sauces feuilles et pâtes (Gboman, Amiwô) :** Un **Jus de Bissap à la menthe** ou un **Jus de Baobab (Bouye)** doux et velouté.\n• **En fin de repas :** Une infusion tiède de **Kinkeliba** ou de **Citronnelle sauvage**.',
    suggestedQuickReplies: ['Recette du Bissap maison', 'Comment doser le piment ?', 'Proposer une recette'],
  },
  {
    triggers: ['grumeaux', 'reussir pate', 'pate mais', 'astuce pate', 'cuisson pate', 'piler igname'],
    responseTitle: '👨‍🍳 Secret du Chef : Réussir la Pâte sans Grumeaux',
    responseText:
      'Pour obtenir une pâte (Wô, Amiwô, Piron) parfaitement lisse et élastique :\n\n1. **Délayage à froid :** Délayez toujours une première poignée de farine dans un bol de liquide tiède avant de l’incorporer au bouillon bouillant.\n2. **Tour de main :** Versez la farine restante en pluie fine continue tout en travaillant vigoureusement avec une spatule en bois contre les parois de la marmite.\n3. **Étuvage :** Laissez cuire à feu très doux couvert 5 minutes en fin de cuisson pour parfaire la texture.',
    suggestedQuickReplies: ['Recette d’Amiwô au Poulet', 'Recette Agoun d’Igname', 'Proposer une autre recette'],
  },
  {
    triggers: ['moins pimente', 'sans piment', 'trop piquant', 'adoucir', 'piment'],
    responseTitle: '🌶️ Astuce : Maîtriser le Piquant en Cuisine Africaine',
    responseText:
      'Pour profiter de tous les arômes africains sans brûlure :\n\n1. **Piment entier non percé :** Déposez le piment frais entier dans la sauce sans l’entailler. Il diffusera ses huiles essentielles fruitées sans libérer la capsaïcine piquante.\n2. **Pour adoucir une sauce trop pimentée :** Ajoutez une touche de concentré de tomate douce, une cuillère de pâte d’arachide ou quelques gouttes de jus de citron vert.',
    suggestedQuickReplies: ['Plat doux pour enfants', 'Idée recette express', 'Autre astuce de chef'],
  },
];

/**
 * Détecte si le texte est lié à la gastronomie
 */
function isCulinaryQuery(text: string): boolean {
  const clean = text.toLowerCase().trim();
  if (!clean) return false;

  const offTopicKeywords = [
    'président', 'politique', 'météo', 'bitcoin', 'crypto', 'football match',
    'qui es-tu', 'ton nom', 'devoirs de maths', 'python code', 'programmeur',
    'chante', 'poème', 'blague non culinaire',
  ];

  if (offTopicKeywords.some(k => clean.includes(k))) {
    return false;
  }

  const culinaryKeywords = [
    'poulet', 'poisson', 'tomate', 'oignon', 'plantain', 'igname', 'gboman',
    'oeuf', 'riz', 'manioc', 'gari', 'viande', 'boeuf', 'farine', 'gombo',
    'crincrin', 'ademe', 'huile', 'piment', 'ail', 'sel', 'cuisiner', 'manger',
    'plat', 'recette', 'frigo', 'repas', 'sauce', 'ingrédient', 'ingredients',
    'amiwo', 'amiwô', 'agoun', 'akassa', 'atassi', 'ablo', 'dèguè', 'degue',
    'alloco', 'dodo', 'mafé', 'mafe', 'yassa', 'boisson', 'bissap', 'cuisson',
    'astuce', 'remplacer', 'pâte', 'pate', 'sucre', 'sel', 'gingembre', 'crabe',
    'crevette', 'légume', 'legume', 'déjeuner', 'dîner', 'diner', 'faim',
  ];

  return culinaryKeywords.some(k => clean.includes(k)) || clean.length > 2;
}

export const AiChefService = {
  /**
   * Traite un enregistrement audio direct envoyé à Gemini (Multimodal Audio)
   */
  async processAudioMessage(options: {
    audioBase64: string;
    audioMimeType?: string;
  }): Promise<{
    userTranscript?: string;
    isGuardrail: boolean;
    text?: string;
    recipe?: AiChefRecipeResult;
    quickSuggestions?: string[];
    reactionEmoji?: string;
  }> {
    const key = await GeminiService.getApiKey();
    if (!key) {
      throw new Error('AUCUNE_CLE_GEMINI');
    }

    return await GeminiService.generateChefResponse({
      audioBase64: options.audioBase64,
      audioMimeType: options.audioMimeType || 'audio/webm',
    });
  },

  /**
   * Traite une demande utilisateur (texte ou transcription)
   */
  async processUserMessage(
    userText: string
  ): Promise<{
    userTranscript?: string;
    isGuardrail: boolean;
    text?: string;
    recipe?: AiChefRecipeResult;
    quickSuggestions?: string[];
    reactionEmoji?: string;
  }> {
    // 1. Tenter avec Gemini si une clé est configurée
    const apiKey = await GeminiService.getApiKey();
    if (apiKey) {
      try {
        const geminiResult = await GeminiService.generateChefResponse({ userText });
        return geminiResult;
      } catch (geminiError: any) {
        console.warn('Erreur Gemini API, bascule sur le moteur local:', geminiError.message);
      }
    }

    // 2. Moteur culinaire local
    await new Promise(resolve => setTimeout(resolve, 500));

    const cleanInput = userText.trim().toLowerCase();

    // Vérification des Garde-fous
    if (!isCulinaryQuery(cleanInput)) {
      return {
        isGuardrail: true,
        text: GUARDRAIL_RESPONSE,
        reactionEmoji: '🤔',
        quickSuggestions: ['J’ai du poulet et des tomates', 'Que faire avec des plantains ?', 'Sauce traditionnelle béninoise'],
      };
    }

    // 3. Vérification des questions de conseils culinaires / techniques
    for (const advice of CULINARY_ADVICE_RESPONSES) {
      if (advice.triggers.some(t => cleanInput.includes(t))) {
        return {
          isGuardrail: false,
          text: `${advice.responseTitle}\n\n${advice.responseText}`,
          reactionEmoji: '💡',
          quickSuggestions: advice.suggestedQuickReplies,
        };
      }
    }

    // 4. Détection des ingrédients mentionnés
    const detectedIngredients: string[] = [];
    const knownIngredientMap: Record<string, string> = {
      poulet: 'Poulet',
      volaille: 'Poulet',
      poisson: 'Poisson',
      tilapia: 'Poisson',
      carpe: 'Poisson',
      crevette: 'Crevettes',
      crabe: 'Crabes',
      tomate: 'Tomates fraîches',
      oignon: 'Oignon',
      plantain: 'Banane plantain',
      alloco: 'Banane plantain',
      igname: 'Igname',
      gboman: 'Feuilles de Gboman',
      epinard: 'Feuilles de Gboman',
      oeuf: 'Œufs',
      egg: 'Œufs',
      riz: 'Riz',
      gombo: 'Gombo frais',
      piment: 'Piment frais',
      ail: 'Ail',
      viande: 'Viande de bœuf',
      boeuf: 'Viande de bœuf',
      haricot: 'Haricots',
      arachide: 'Pâte d’arachide',
      citron: 'Citron vert',
    };

    for (const [key, label] of Object.entries(knownIngredientMap)) {
      if (cleanInput.includes(key)) {
        if (!detectedIngredients.includes(label)) {
          detectedIngredients.push(label);
        }
      }
    }

    // 5. Recherche du meilleur template de recette
    let matchedTemplate = CULINARY_KNOWLEDGE_BASE.find(tpl =>
      tpl.keywords.some(k => cleanInput.includes(k))
    );

    // Si demande explicite d'autre idée / alternative
    if (cleanInput.includes('autre') || cleanInput.includes('variante') || cleanInput.includes('alternative')) {
      const candidates = CULINARY_KNOWLEDGE_BASE.filter(tpl =>
        tpl.keywords.some(k => cleanInput.includes(k))
      );
      if (candidates.length > 1) {
        matchedTemplate = candidates[1];
      } else {
        // Prendre un autre plat savoureux
        matchedTemplate = CULINARY_KNOWLEDGE_BASE[Math.floor(Math.random() * CULINARY_KNOWLEDGE_BASE.length)];
      }
    }

    // Fallback par défaut
    if (!matchedTemplate) {
      matchedTemplate = CULINARY_KNOWLEDGE_BASE[0];
    }

    // 6. Partition des ingrédients : Utilisés vs Manquants
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
      id: `ai_recipe_${Date.now()}_${matchedTemplate.id}`,
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
      wineOrDrinkPairing: matchedTemplate.drinkPairing,
    };

    return {
      isGuardrail: false,
      recipe: structuredRecipe,
      reactionEmoji: '✨',
      quickSuggestions: matchedTemplate.suggestedQuickReplies,
    };
  },
};
