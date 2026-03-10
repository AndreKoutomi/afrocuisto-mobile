/*
 * Ce fichier définit les TYPES de données utilisés dans toute l'application (TypeScript).
 * Les "types" ou "interfaces" sont comme des contrats ou des moules : ils précisent
 * exactement quelles propriétés un objet doit avoir, et de quel type elles sont (texte, nombre, booléen...).
 * Cela évite de nombreuses erreurs en développement !
 */

// Tous les niveaux de difficultés possibles pour une recette.
export type Difficulty = 'Très Facile' | 'Facile' | 'Intermédiaire' | 'Moyen' | 'Difficile' | 'Très Difficile' | 'Extrême' | 'N/A';
// Toutes les grandes catégories de repas de l'application.
export type Category =
  | 'Pâtes et Céréales (Wɔ̌)'
  | 'Sauces (Nùsúnnú)'
  | 'Plats de Résistance & Ragoûts'
  | 'Protéines & Grillades'
  | 'Street Food & Snacks (Amuse-bouche)'
  | 'Boissons & Douceurs'
  | 'Condiments & Accompagnements'
  | 'National';

// Interface définissant la structure d'un Ingrédient (son nom et la quantité nécessaire)
export interface Ingredient {
  item: string;   // Le nom de l'ingrédient (ex: "Tomate")
  amount: string; // La quantité (ex: "3 kg")
}

// Le type le plus central : La Recette. 
// Le point d'interrogation (?) signifie que la propriété est optionnelle (elle peut ne pas exister).
export interface Recipe {
  id: string;               // Identifiant unique
  name: string;             // Nom du plat
  alias?: string;           // Autre nom connu
  region: string;           // Région géographique d'origine
  category: string;         // Catégorie (idéalement de type 'Category')
  difficulty: Difficulty;   // Le niveau de difficulté (défini au-dessus)
  prepTime: string;         // Temps de préparation
  cookTime: string;         // Temps de cuisson
  image: string;            // URL ou chemin vers la photo du plat
  ingredients?: Ingredient[]; // Liste des ingrédients (tableau d'Ingredient)
  techniqueTitle?: string;  // Titre technique de cuisson
  techniqueDescription?: string; // Explication technique
  description?: string;     // Une courte description du plat
  steps?: string[];         // Les étapes de préparation (tableau de textes)
  diasporaSubstitutes?: string; // Ingrédients de remplacement pour la diaspora
  suggestedSides?: string[]; // Plats d'accompagnement conseillés
  benefits?: string;        // Bienfaits santé
  pedagogicalNote?: string; // Note historique ou éducative
  type?: string;            // Type spécifique
  base?: string;            // Base (ex: Maïs)
  isFeatured?: boolean;     // Le plat est-il en vedette ?
  style?: string;           // Style de cuisson
  origine_humaine?: string; // Précision sur les concepteurs du plat
  videoUrl?: string;        // Lien vidéo potentiel
}

// Les réglages que l'utilisateur peut modifier
export interface UserSettings {
  darkMode: boolean;             // Mode sombre (vrai/faux)
  language: 'fr' | 'en' | 'es';  // Langue de l'appli
  unitSystem: 'metric' | 'imperial'; // Unité de mesure (Kilo vs Livres)
}

// Format d'un élément du panier (liste de courses)
export interface ShoppingItem {
  id: string;
  item: string;           // Nom de l'article à acheter
  amount: string;         // Combien d'origine
  quantity?: string;      // Quantité en chiffre pour édition
  unit?: string;          // Unité d'achat (kg, L)
  priceXOF?: string;      // Prix estimé en monnaie locale
  isPurchased: boolean;   // Déjà acheté ou pas (case à cocher)
  recipeName?: string;    // Nom de la recette d'où vient l'ingrédient
  recipeId?: string;      // ID de la recette reliée
}

// Structure de l'Utilisateur Connecté
export interface User {
  id: string;             // ID unique (vient souvent de la BDD ou auth)
  name: string;           // Prénom / Nom
  email: string;          // Adresse email
  password?: string;      // Mot de passe (jamais affiché en clair idéalement)
  avatar?: string;        // Photo de profil
  favorites: string[];    // Tableau contenant les IDs des recettes favorites
  shoppingList: ShoppingItem[]; // Sa liste de courses
  joinedDate: string;     // Date d'inscription
  settings?: UserSettings; // Ses préférences (sombre/clair, langue...)
}

// État gérant la connexion
export interface AuthState {
  user: User | null;         // L'utilisateur si connecté, null si non connecté
  isAuthenticated: boolean;  // Vrai si utilisateur authentifié
}
