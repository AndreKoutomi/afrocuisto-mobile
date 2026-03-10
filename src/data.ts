/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Base de données locale de secours. Contient une liste de recettes pré-enregistrées en dur dans le code pour garantir que l'application fonctionne même sans connexion internet.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { Recipe } from './types';

export const recipes: Recipe[] = [
  // --- Pâtes et Céréales (Wɔ̌) ---
  {
    id: "P01",
    name: "Wô (Pâte blanche)",
    base: "Maïs",
    region: "National",
    category: "Pâtes et Céréales (Wɔ̌)",
    difficulty: "Facile",
    prepTime: "10 min",
    cookTime: "20 min",
    image: "/images/pate_blanche_1772192522680.png",
    description: "La pâte de maïs blanche, aliment de base consommé quotidiennement au Bénin.",
    ingredients: [
      { item: "Farine de maïs fine", amount: "500g" },
      { item: "Eau", amount: "1.5L" },
      { item: "Sel", amount: "1 pincée" }
    ],
    techniqueTitle: "Le Pétrissage",
    techniqueDescription: "Utiliser une spatule en bois (longue) pour pétrir énergiquement la pâte contre les parois de la marmite.",
    steps: [
      "Porter l'eau à ébullition dans une grande marmite.",
      "Prélever un bol d'eau bouillante et y délayer une petite partie de la farine pour faire une bouillie légère.",
      "Verser la bouillie dans la marmite et laisser bouillir à nouveau.",
      "Verser le reste de la farine en pluie tout en remuant vigoureusement avec la spatule.",
      "Pétrir la pâte jusqu'à ce qu'elle soit homogène, lisse et sans grumeaux.",
      "Ajouter un peu d'eau chaude si nécessaire et laisser cuire à feu doux 5 minutes."
    ]
  },
  {
    id: "P02",
    name: "Amiwô (Pâte rouge)",
    base: "Maïs/Tomate",
    region: "Sud-Bénin",
    category: "Pâtes et Céréales (Wɔ̌)",
    difficulty: "Moyen",
    prepTime: "15 min",
    cookTime: "30 min",
    image: "/images/amiwo_poulet_1772192535717.png",
    description: "Pâte de maïs cuite dans un bouillon de tomate et d'épices, souvent accompagnée de poulet frité.",
    ingredients: [
      { item: "Farine de maïs", amount: "500g" },
      { item: "Huile de palme rouge (Zomi)", amount: "3 càs" },
      { item: "Tomates fraîches mixées", amount: "300g" },
      { item: "Oignons émincés", amount: "2" },
      { item: "Ail et Gingembre écrasés", amount: "1 càs" },
      { item: "Bouillon de poulet", amount: "1L" }
    ],
    techniqueTitle: "Le Bouillon Aromatique",
    techniqueDescription: "La clé d'un bon Amiwô est la richesse du bouillon de base utilisé pour cuire la farine.",
    steps: [
      "Chauffer l'huile rouge et y faire revenir les oignons, l'ail et le gingembre.",
      "Ajouter la tomate et laisser réduire jusqu'à ce que l'huile remonte.",
      "Verser le bouillon de poulet et porter à ébullition.",
      "Délayer un peu de farine dans de l'eau froide et l'ajouter pour lier.",
      "Verser le reste de la farine en remuant constamment pour éviter les grumeaux.",
      "Pétrir jusqu'à obtenir une pâte ferme et bien colorée."
    ]
  },
  {
    id: "P03",
    name: "Agoun (Igname pilée)",
    base: "Igname",
    region: "National",
    category: "Pâtes et Céréales (Wɔ̌)",
    difficulty: "Moyen",
    prepTime: "20 min",
    cookTime: "30 min",
    image: "/images/agoun_igname_1772192553037.png",
    description: "Igname cuite puis pilée jusqu'à obtenir une texture élastique et lisse.",
    ingredients: [
      { item: "Igname (variété Laboco de préférence)", amount: "2kg" },
      { item: "Eau", amount: "QS" }
    ],
    benefits: "Source de glucides complexes à index glycémique modéré.",
    steps: [
      "Éplucher l'igname et la couper en gros morceaux.",
      "Laver les morceaux et les mettre à cuire dans une grande marmite d'eau.",
      "Vérifier la cuisson : l'igname doit être très tendre sous la fourchette.",
      "Mettre les morceaux chauds dans un mortier.",
      "Piler énergiquement avec un pilon en ajoutant progressivement un peu d'eau de cuisson.",
      "Continuer jusqu'à ce que la pâte soit lisse, élastique et sans morceaux."
    ],
    videoUrl: "https://youtu.be/_H1PaAbpdQc?si=QaiDgbZG02OHAtQW"
  },
  {
    id: "P04",
    name: "Télibô Wô (Pâte noire)",
    base: "Cossettes d'igname",
    region: "Sud/Centre",
    category: "Pâtes et Céréales (Wɔ̌)",
    difficulty: "Facile",
    prepTime: "10 min",
    cookTime: "20 min",
    image: "/images/telibo_wo_1772192566532.png",
    description: "Pâte faite à base de farine de cossettes d'igname séchées au soleil.",
    ingredients: [
      { item: "Farine de Télibô", amount: "500g" },
      { item: "Eau", amount: "1.2L" }
    ],
    steps: [
      "Porter l'eau à ébullition.",
      "Délayer un peu de farine dans de l'eau froide.",
      "Verser le mélange dans l'eau bouillante.",
      "Ajouter le reste de la farine en pluie tout en remuant vigoureusement.",
      "Pétrir contre les parois de la marmite jusqu'à l'obtention d'une pâte noire et homogène.",
      "Laisser cuire à feu doux 5 minutes avant de servir."
    ]
  },
  {
    id: "P05",
    name: "Akassa",
    base: "Maïs fermenté",
    region: "Sud-Bénin",
    category: "Pâtes et Céréales (Wɔ̌)",
    difficulty: "Moyen",
    prepTime: "3 jours",
    cookTime: "30 min",
    image: "/images/akassa_1772192596776.png",
    description: "Pâte de maïs fermentée et cuite, de texture fine et légèrement acide.",
    ingredients: [
      { item: "Amidion de maïs fermenté (Ogui)", amount: "500g" },
      { item: "Eau", amount: "1L" },
      { item: "Sel", amount: "1 pincée" }
    ],
    steps: [
      "Fermenter le maïs concassé dans l'eau pendant 3 jours.",
      "Mixer et filtrer pour récupérer l'amidon très fin (Ogui).",
      "Porter de l'eau à ébullition.",
      "Délayer l'amidon dans un peu d'eau froide.",
      "Verser dans l'eau bouillante en remuant sans arrêt.",
      "Cuire à feu doux en remuant vigoureusement jusqu'à ce que la pâte soit brillante.",
      "Emballer chaud dans des feuilles de bananier ou de teck."
    ]
  },
  {
    id: "P06",
    name: "Ablo",
    base: "Riz/Maïs vapeur",
    region: "Sud-Bénin",
    category: "Pâtes et Céréales (Wɔ̌)",
    difficulty: "Difficile",
    prepTime: "2h",
    cookTime: "20 min",
    image: "/images/ablo_1772192776472.png",
    description: "Petits pains de maïs et riz légèrement sucrés et cuits à la vapeur.",
    ingredients: [
      { item: "Riz moulu", amount: "300g" },
      { item: "Farine de maïs", amount: "100g" },
      { item: "Levure boulangère", amount: "1 càs" },
      { item: "Sucre", amount: "50g" },
      { item: "Bouillie de riz (liant)", amount: "100ml" }
    ],
    steps: [
      "Mélanger le riz moulu, la farine de maïs et la bouillie de riz précuite.",
      "Ajouter la levure activée dans un peu d'eau tiède.",
      "Ajouter le sucre et mélanger jusqu'à obtenir une pâte lisse.",
      "Laisser fermenter dans un endroit chaud pendant 1h à 2h (la pâte doit doubler de volume).",
      "Verser dans des petits moules.",
      "Cuire à la vapeur pendant 20 minutes."
    ]
  },
  {
    id: "P07",
    name: "Piron (Blanc)",
    base: "Gari",
    region: "National",
    category: "Pâtes et Céréales (Wɔ̌)",
    difficulty: "Très Facile",
    prepTime: "5 min",
    cookTime: "10 min",
    image: "/images/piron_blanc_1772192948416.png",
    description: "Pâte rapide faite à base de gari (semoule de manioc séchée) et d'eau bouillante.",
    ingredients: [
      { item: "Gari (blanc)", amount: "500g" },
      { item: "Eau bouillante", amount: "1L" },
      { item: "Sel", amount: "1 pincée" }
    ],
    steps: [
      "Porter l'eau à ébullition avec une pincée de sel.",
      "Verser l'eau bouillante dans un saladier contenant le gari.",
      "Couvrir 2 minutes pour laisser le gari gonfler.",
      "Remuer énergiquement avec une spatule jusqu'à obtenir une pâte ferme et homogène."
    ]
  },
  {
    id: "P11",
    name: "Atassi (Watché)",
    alias: "Watché",
    base: "Riz & Haricots",
    region: "National",
    category: "Pâtes et Céréales (Wɔ̌)",
    difficulty: "Facile",
    prepTime: "15 min",
    cookTime: "45 min",
    image: "/images/atassi_1772192610097.png",
    description: "Mélange cuit de riz et de haricots, souvent consommé avec une friture de tomate (Dja).",
    ingredients: [
      { item: "Riz", amount: "500g" },
      { item: "Haricots rouges (Niébé)", amount: "200g" },
      { item: "Potasse (pincée)", amount: "1" },
      { item: "Sel", amount: "QS" }
    ],
    steps: [
      "Cuire les haricots dans de l'eau avec une pincée de potasse jusqu'à ce qu'ils soient tendres.",
      "Laver le riz et l'ajouter aux haricots avec son eau de cuisson.",
      "Ajuster le sel et l'eau.",
      "Laisser mijoter à feu doux jusqu'à ce que le riz ait absorbé toute l'eau.",
      "Servir avec du piment noir (Yébessé-fionfion) et de la friture."
    ]
  },
  {
    id: "P13",
    name: "Kom (Dokounou)",
    base: "Maïs fermenté",
    region: "Sud-Bénin / Togo",
    category: "Pâtes et Céréales (Wɔ̌)",
    difficulty: "Moyen",
    prepTime: "48h",
    cookTime: "30 min",
    image: "/images/kom_dokounou_1772192961914.png",
    description: "Pâte de maïs fermentée, moulée dans des feuilles de maïs et cuite à la vapeur.",
    ingredients: [
      { item: "Mawè (Farine de maïs fermentée)", amount: "500g" },
      { item: "Amidon de manioc", amount: "100g" },
      { item: "Sel", amount: "QS" }
    ],
    steps: [
      "Mélanger la farine fermentée avec l'amidon de manioc et de l'eau.",
      "Précuire une partie du mélange à la casserole pour obtenir une masse épaisse.",
      "Mélanger la partie cuite à la partie crue.",
      "Former des boules et les emballer dans des feuilles de maïs séchées.",
      "Cuire à la vapeur pendant 30 minutes."
    ]
  },
  {
    id: "P14",
    name: "Couscous au Poulet Frit",
    base: "Blé",
    region: "National",
    category: "Pâtes et Céréales (Wɔ̌)",
    difficulty: "Moyen",
    prepTime: "20 min",
    cookTime: "40 min",
    image: "https://ewoiqbhqtcdatpzhdaef.supabase.co/storage/v1/object/public/recipe-images/couscous_poulet.png",
    description: "Semoule de blé fine et légère accompagnée d'un ragoût de légumes et de morceaux de poulet frits croustillants.",
    ingredients: [
      { item: "Semoule de couscous fine", amount: "500g" },
      { item: "Poulet découpé", amount: "1/2 poulet" },
      { item: "Légumes (Carottes, Courgettes)", amount: "300g" },
      { item: "Tomate concentrée", amount: "1 càs" },
      { item: "Oignon et ail", amount: "QS" },
      { item: "Huile de friture", amount: "QS" }
    ],
    steps: [
      "Assaisonner et faire frire le poulet jusqu'à ce qu'il soit bien doré et croustillant.",
      "Préparer une sauce tomate légère avec les légumes coupés en dés.",
      "Faire cuire le couscous à la vapeur ou à l'eau bouillante selon la méthode traditionnelle pour qu'il soit bien égrainé.",
      "Servir le couscous chaud nappé de la sauce aux légumes, avec le poulet frit sur le côté."
    ]
  },
  {
    id: "P15",
    name: "Spaghetti Africain",
    base: "Blé",
    region: "National",
    category: "Pâtes et Céréales (Wɔ̌)",
    difficulty: "Très Facile",
    prepTime: "10 min",
    cookTime: "25 min",
    image: "https://ewoiqbhqtcdatpzhdaef.supabase.co/storage/v1/object/public/recipe-images/spaghetti_africain.png",
    description: "Plat de pâtes généreux sauté dans une sauce tomate épicée avec des légumes croquants et du bœuf ou du poisson.",
    ingredients: [
      { item: "Spaghetti", amount: "500g" },
      { item: "Tomates fraîches mixées", amount: "300g" },
      { item: "Oignons", amount: "2 gros" },
      { item: "Bœuf coupé en dés", amount: "250g" },
      { item: "Petit pois et Carottes", amount: "150g" },
      { item: "Huile de tournesol", amount: "QS" },
      { item: "Œufs bouillis", amount: "2" }
    ],
    steps: [
      "Faire cuire les spaghetti dans de l'eau bouillante salée, les égoutter 'al dente'.",
      "Faire revenir le bœuf dans l'huile chaude jusqu'à coloration, puis ajouter les oignons.",
      "Verser la tomate et laisser réduire à feu moyen jusqu'à l'obtention d'une sauce onctueuse.",
      "Ajouter les légumes et laisser mijoter 5 minutes.",
      "Mélanger les spaghetti à la sauce, bien enrober chaque brin de pâtes.",
      "Servir chaud garni d'un œuf bouilli coupé en deux."
    ]
  },

  // --- Sauces (Nùsúnnú) ---
  {
    id: "S01",
    name: "Gboman",
    type: "Légumes-feuilles",
    region: "Sud-Bénin",
    category: "Sauces (Nùsúnnú)",
    difficulty: "Moyen",
    prepTime: "30 min",
    cookTime: "40 min",
    image: "/images/gboman_1772192977053.png",
    description: "Sauce à base de feuilles de Grande Morelle, très riche en fer.",
    ingredients: [
      { item: "Feuilles de Gboman", amount: "1kg" },
      { item: "Poisson fumé", amount: "200g" },
      { item: "Crabes", amount: "4" },
      { item: "Huile de palme", amount: "10cl" },
      { item: "Tomate et Piment", amount: "QS" }
    ],
    steps: [
      "Laver et hacher les feuilles de Gboman.",
      "Blanchir les feuilles 5 min et les presser pour retirer l'amertume.",
      "Faire une friture avec l'huile, la tomate et les oignons.",
      "Ajouter les crabes et le poisson fumé.",
      "Incorporer les feuilles pressées et laisser mijoter 15 min."
    ]
  },
  {
    id: "S02",
    name: "Adémè (Crincrin)",
    type: "Sauce gluante",
    region: "Sud-Bénin",
    category: "Sauces (Nùsúnnú)",
    difficulty: "Facile",
    prepTime: "20 min",
    cookTime: "15 min",
    image: "/images/ademe_crincrin_1772193087836.png",
    description: "Sauce gluante à base de corète potagère, idéale avec l'Akassa.",
    ingredients: [
      { item: "Feuilles d'Adémè frais", amount: "500g" },
      { item: "Crevettes fraîches", amount: "200g" },
      { item: "Friture de tomate (base)", amount: "3 càs" },
      { item: "Bicarbonate (pincée)", amount: "1" }
    ],
    steps: [
      "Hacher finement les feuilles d'Adémè.",
      "Porter un peu de bouillon ou d'eau à ébullition avec le bicarbonate.",
      "Jeter les feuilles dans l'eau bouillante et remuer vigoureusement.",
      "Ajouter les crevettes et la friture de tomate.",
      "Laisser cuire 5 à 10 minutes maximum pour garder la texture gluante et la couleur verte."
    ]
  },
  {
    id: "S03",
    name: "Févi (Sauce Gombo)",
    type: "Sauce gluante",
    region: "National",
    category: "Sauces (Nùsúnnú)",
    difficulty: "Facile",
    prepTime: "15 min",
    cookTime: "20 min",
    image: "/images/fevi_gombo_1772193101830.png",
    description: "Sauce gombo classique, onctueuse et savoureuse.",
    ingredients: [
      { item: "Gombos frais", amount: "300g" },
      { item: "Poisson fumé ou Viande", amount: "200g" },
      { item: "Potasse", amount: "1 pincée" },
      { item: "Crevettes séchées moulues", amount: "1 càs" }
    ],
    steps: [
      "Râper ou couper les gombos en petits dés.",
      "Porter de l'eau à ébullition avec la potasse.",
      "Ajouter le gombo et battre avec une spatule pour augmenter le 'gluant'.",
      "Ajouter les protéines (poisson/viande) et les épices.",
      "Laisser cuire 15 minutes à feu moyen."
    ]
  },
  {
    id: "S05",
    name: "Dékoun (Sauce graine)",
    type: "Noix de palme",
    region: "Sud-Bénin",
    category: "Sauces (Nùsúnnú)",
    difficulty: "Difficile",
    prepTime: "1h",
    cookTime: "1.5h",
    image: "/images/dekoun_graine_1772193114112.png",
    description: "Sauce onctueuse extraite de la pulpe des noix de palme.",
    ingredients: [
      { item: "Noix de palme fraîches", amount: "1kg" },
      { item: "Viande de bœuf", amount: "500g" },
      { item: "Poisson fumé", amount: "200g" },
      { item: "Gingembre et Ail", amount: "QS" }
    ],
    steps: [
      "Bouillir les noix de palme jusqu'à ce que la peau se fende.",
      "Piler les noix pour extraire la pulpe, puis mélanger à de l'eau tiède pour filtrer le jus.",
      "Cuire la viande avec les épices.",
      "Verser le jus de palme sur la viande et porter à ébullition.",
      "Laisser réduire jusqu'à ce que la sauce épaississe et que l'huile remonte.",
      "Ajouter le poisson fumé en fin de cuisson."
    ]
  },
  {
    id: "S06",
    name: "Azin Nùsúnnú (Sauce Arachide)",
    type: "Arachide",
    region: "National",
    category: "Sauces (Nùsúnnú)",
    difficulty: "Moyen",
    prepTime: "20 min",
    cookTime: "40 min",
    image: "/images/azin_arachide_1772193124987.png",
    description: "Sauce à base de pâte d'arachide, onctueuse et très nutritive.",
    ingredients: [
      { item: "Pâte d'arachide", amount: "200g" },
      { item: "Poulet ou Bœuf", amount: "500g" },
      { item: "Tomate concentrée", amount: "1 càs" },
      { item: "Oignon et Ail", amount: "QS" }
    ],
    steps: [
      "Cuire la viande avec les oignons et les épices.",
      "Délayer la pâte d'arachide dans un peu d'eau tiède.",
      "Ajouter la tomate au bouillon de viande, puis verser le mélange d'arachide.",
      "Laisser mijoter à feu doux en remuant régulièrement jusqu'à ce que l'huile d'arachide remonte à la surface."
    ]
  },
  {
    id: "S12",
    name: "Man-Tindjan",
    type: "Légumes composés",
    region: "Sud-Bénin (Abomey)",
    category: "Sauces (Nùsúnnú)",
    difficulty: "Difficile",
    prepTime: "45 min",
    cookTime: "1h",
    image: "/images/man_tindjan_1772194012289.png",
    description: "La 'Sauce Coincée', extrêmement riche en obstacles (viandes, poissons, crabes) et légumes.",
    ingredients: [
      { item: "Feuilles de Gboman et Tchiayo", amount: "1kg" },
      { item: "Viande frite, Crabes, Fromage", amount: "500g" },
      { item: "Poisson fumé", amount: "200g" },
      { item: "Huile de palme (Zomi)", amount: "15cl" },
      { item: "Moutarde de néré (Afintin)", amount: "2 càs" }
    ],
    steps: [
      "Blanchir et presser les légumes.",
      "Faire une friture intense avec l'huile rouge et l'afintin.",
      "Ajouter tous les 'obstacles' (crabes, viandes, fromage).",
      "Incorporer les légumes pressés et bien mélanger.",
      "Laisser cuire à feu doux jusqu'à ce qu'il n'y ait presque plus de jus."
    ]
  },
  {
    id: "S17",
    name: "Goussi (Sauce Sésame/Courge)",
    type: "Graines de courge",
    region: "National",
    category: "Sauces (Nùsúnnú)",
    difficulty: "Moyen",
    prepTime: "30 min",
    cookTime: "40 min",
    image: "/images/goussi_1772194027152.png",
    description: "Sauce à base de graines de courge moulues, souvent préparée avec des épinards.",
    ingredients: [
      { item: "Farine de Goussi", amount: "200g" },
      { item: "Viande ou Poisson", amount: "500g" },
      { item: "Oignons et Tomates", amount: "QS" },
      { item: "Epinards locaux", amount: "300g" }
    ],
    steps: [
      "Faire revenir les oignons et la tomate.",
      "Diluer la farine de goussi avec un peu d'eau pour former une pâte épaisse.",
      "Précipiter de petites boules de goussi dans la friture chaude.",
      "Ajouter le bouillon de viande et les légumes.",
      "Laisser cuire jusqu'à ce que les boulettes de goussi soient fermes."
    ]
  },
  {
    id: "S08",
    name: "Tchiayo",
    type: "Légumes-feuilles",
    region: "Sud-Bénin",
    category: "Sauces (Nùsúnnú)",
    difficulty: "Facile",
    prepTime: "20 min",
    cookTime: "30 min",
    image: "/images/tchiayo_1772194040696.png",
    description: "Sauce à base de feuilles de basilic africain, très parfumée et digestive.",
    ingredients: [
      { item: "Feuilles de Tchiayo", amount: "500g" },
      { item: "Poisson fumé", amount: "200g" },
      { item: "Friture de tomate", amount: "QS" }
    ],
    steps: [
      "Laver les feuilles et les hacher grossièrement.",
      "Les ajouter à une friture de tomate déjà prête.",
      "Incorporer le poisson fumé et laisser mijoter 15 minutes.",
      "Servir avec du riz ou de la pâte (Wô)."
    ]
  },

  // --- Plats de Résistance & Ragoûts ---
  {
    id: "R01",
    name: "Dakouin",
    style: "Bouillon de poisson + Gari",
    region: "Sud-Bénin (Littoral)",
    category: "Plats de Résistance & Ragoûts",
    difficulty: "Moyen",
    prepTime: "20 min",
    cookTime: "30 min",
    image: "https://picsum.photos/seed/R01/800/600",
    description: "Spécialité lacustre de gari cuit dans un bouillon de poisson frais richement épicé.",
    ingredients: [
      { item: "Gari (semoule de manioc)", amount: "500g" },
      { item: "Poisson frais (Bar, Carpe...)", amount: "1kg" },
      { item: "Tomates, Oignons, Piments", amount: "QS" },
      { item: "Huile végétale", amount: "5cl" }
    ],
    steps: [
      "Préparer un bouillon de poisson très parfumé avec les légumes mixés.",
      "Une fois le poisson cuit, le retirer délicatement.",
      "Verser le gari en pluie dans le bouillon bouillant tout en remuant vigoureusement.",
      "Servir la pâte de gari obtenue avec le poisson et la sauce restante."
    ]
  },
  {
    id: "R02",
    name: "Toubani",
    style: "Gâteau de haricot vapeur",
    region: "Nord-Bénin",
    category: "Plats de Résistance & Ragoûts",
    difficulty: "Moyen",
    prepTime: "30 min",
    cookTime: "45 min",
    image: "https://picsum.photos/seed/R02/800/600",
    description: "Beignets de farine de haricots (ou niébé) cuits à la vapeur, légers et digestes.",
    ingredients: [
      { item: "Farine de niébé", amount: "500g" },
      { item: "Potasse", amount: "1 pincée" },
      { item: "Ail et Gingembre", amount: "QS" },
      { item: "Feuilles de bananier (pour la cuisson)", amount: "QS" }
    ],
    steps: [
      "Mélanger la farine avec un peu d'eau, le sel, l'ail et la potasse.",
      "Battre le mélange jusqu'à ce qu'il soit mousseux.",
      "Verser dans des feuilles de bananier ou des moules.",
      "Cuire à la vapeur pendant 45 minutes.",
      "Servir arrosé d'huile et de piment sec."
    ]
  },
  {
    id: "R03",
    name: "Adôwè (Purée de haricots)",
    style: "Purée de légumineuses",
    region: "Centre-Bénin",
    category: "Plats de Résistance & Ragoûts",
    difficulty: "Moyen",
    prepTime: "15 min",
    cookTime: "1h",
    image: "https://picsum.photos/seed/R03/800/600",
    description: "Mélange onctueux de haricots blancs cuits et écrasés, servis avec du gari et de l'huile rouge.",
    ingredients: [
      { item: "Haricots blancs", amount: "500g" },
      { item: "Huile de palme rouge", amount: "10cl" },
      { item: "Oignons frits", amount: "QS" }
    ],
    steps: [
      "Cuire les haricots jusqu'à ce qu'ils soient très tendres.",
      "Les écraser au pilon ou à la cuillère pour obtenir une purée lisse.",
      "Servir la purée chaude garnie d'huile rouge et d'oignons croustillants."
    ]
  },
  {
    id: "R04",
    name: "Abobo",
    style: "Haricots bouillis au Zomi",
    region: "Sud-Bénin",
    category: "Plats de Résistance & Ragoûts",
    difficulty: "Facile",
    prepTime: "10 min",
    cookTime: "50 min",
    image: "https://ewoiqbhqtcdatpzhdaef.supabase.co/storage/v1/object/public/recipe-images/abobo_benin.png",
    description: "Plat traditionnel de haricots rouges (niébé) cuits à l'eau, servis avec de l'huile de palme brute et du gari.",
    ingredients: [
      { item: "Haricots niébé rouges", amount: "500g" },
      { item: "Huile de palme rouge (Zomi)", amount: "10cl" },
      { item: "Oignon", amount: "1 gros" },
      { item: "Gari (semoule de manioc)", amount: "QS" },
      { item: "Sel", amount: "QS" }
    ],
    steps: [
      "Trier les haricots et les laver à l'eau claire.",
      "Mettre les haricots dans une marmite avec 3 fois leur volume d'eau et porter à ébullition.",
      "Cuire à feu moyen jusqu'à ce que les haricots soient très tendres (ne saler qu'en fin de cuisson).",
      "Pendant ce temps, faire chauffer légèrement l'huile rouge avec quelques tranches d'oignon pour la parfumer.",
      "Une fois les haricots cuits et salés, les servir dans une assiette ou un bol.",
      "Arroser généreusement d'huile rouge (Zomi) et saupoudrer de friture d'oignon et de gari blanc."
    ]
  },

  // --- Protéines & Grillades ---
  {
    id: "V03",
    name: "Tchatchanga",
    type: "Grillade",
    region: "Nord-Bénin",
    category: "Protéines & Grillades",
    difficulty: "Moyen",
    prepTime: "1h",
    cookTime: "20 min",
    image: "https://picsum.photos/seed/V03/800/600",
    description: "Brochettes de mouton ou de bœuf marinées à la poudre d'arachide et aux épices.",
    ingredients: [
      { item: "Viande de mouton", amount: "1kg" },
      { item: "Poudre d'arachide (Koulikouli)", amount: "100g" },
      { item: "Mélange d'épices (suya)", amount: "2 càs" },
      { item: "Huile", amount: "QS" }
    ],
    steps: [
      "Couper la viande en fines lanières.",
      "Enfiler sur des piques en bois.",
      "Enduire d'un mélange d'huile, poudre d'arachide et épices.",
      "Griller sur un feu de bois ou au charbon jusqu'à ce que la viande soit saisie et parfumée."
    ]
  },
  {
    id: "V10",
    name: "Vatido (Porc grillé)",
    alias: "Porc au four",
    type: "Grillade",
    region: "Sud-Bénin (Ouidah)",
    category: "Protéines & Grillades",
    difficulty: "Moyen",
    prepTime: "2h",
    cookTime: "1h",
    image: "https://picsum.photos/seed/V10/800/600",
    description: "Porc mariné puis grillé ou rôti, spécialité de la côte sud.",
    ingredients: [
      { item: "Viande de porc", amount: "1kg" },
      { item: "Ail, Poivre, Gros sel", amount: "QS" },
      { item: "Citron vert", amount: "2" }
    ],
    steps: [
      "Laver la viande avec du citron.",
      "Faire des entailles et y insérer l'ail et les épices.",
      "Laisser mariner au moins 2 heures.",
      "Griller lentement au feu de bois ou rôtir au four jusqu'à ce que la peau soit croustillante."
    ]
  },

  // --- Street Food & Snacks ---
  {
    id: "A03",
    name: "Talé-Talé",
    type: "Banane",
    region: "Sud-Bénin",
    category: "Street Food & Snacks (Amuse-bouche)",
    difficulty: "Très Facile",
    prepTime: "10 min",
    cookTime: "10 min",
    image: "https://picsum.photos/seed/A03/800/600",
    description: "Beignets de bananes très mûres, parfaits pour le goûter.",
    ingredients: [
      { item: "Bananes très mûres (noires)", amount: "6" },
      { item: "Farine de blé", amount: "100g" },
      { item: "Sel", amount: "1 pincée" }
    ],
    steps: [
      "Écraser les bananes à la fourchette.",
      "Mélanger avec la farine et le sel.",
      "Frire des petits tas de pâte dans l'huile chaude.",
      "Déguster chaud."
    ]
  },
  {
    id: "A06",
    name: "Amon Soja (Fromage de Soja)",
    alias: "Tofu béninois",
    type: "Protéine végétale",
    region: "National",
    category: "Street Food & Snacks (Amuse-bouche)",
    difficulty: "Moyen",
    prepTime: "2h",
    cookTime: "30 min",
    image: "https://picsum.photos/seed/A06/800/600",
    description: "Cubes de soja caillé, frits et servis avec du piment.",
    ingredients: [
      { item: "Graines de soja", amount: "1kg" },
      { item: "Citron ou Coagulant", amount: "QS" },
      { item: "Sel et Piment", amount: "QS" }
    ],
    steps: [
      "Tremper et mixer le soja.",
      "Bouillir le lait de soja et ajouter le coagulant pour faire cailler.",
      "Presser le caillé dans un linge pour évacuer l'eau.",
      "Découper en cubes et frire jusqu'à ce qu'ils soient dorés."
    ]
  },
  {
    id: "A01",
    name: "Yovo-Doko (Beignets)",
    type: "Sucré",
    region: "National",
    category: "Street Food & Snacks (Amuse-bouche)",
    difficulty: "Facile",
    prepTime: "1h",
    cookTime: "15 min",
    image: "https://picsum.photos/seed/A01/800/600",
    description: "Petits beignets de farine de blé sucrés, moelleux à souhait.",
    ingredients: [
      { item: "Farine de blé", amount: "500g" },
      { item: "Levure boulangère", amount: "10g" },
      { item: "Sucre", amount: "100g" },
      { item: "Eau tiède", amount: "300ml" }
    ],
    steps: [
      "Mélanger la farine, le sucre et le sel.",
      "Ajouter la levure délayée dans l'eau tiède.",
      "Battre énergiquement la pâte à la main jusqu'à ce qu'elle soit élastique.",
      "Couvrir et laisser lever 1h dans un endroit chaud.",
      "Former des boules avec les doigts et frire dans une huile bien chaude."
    ]
  },
  {
    id: "A02",
    name: "Ata (Beignets de haricots)",
    alias: "Akara",
    type: "Salé",
    region: "National",
    category: "Street Food & Snacks (Amuse-bouche)",
    difficulty: "Moyen",
    prepTime: "30 min",
    cookTime: "20 min",
    image: "https://picsum.photos/seed/A02/800/600",
    description: "Beignets de haricots niébé, aériens et épicés.",
    ingredients: [
      { item: "Haricots niébé (pelés)", amount: "500g" },
      { item: "Oignon et Piment", amount: "QS" },
      { item: "Eau (pour le mixage)", amount: "QS" }
    ],
    steps: [
      "Frotter les haricots trempés pour retirer la peau et les rincer.",
      "Mixer les haricots avec l'oignon et le piment avec très peu d'eau.",
      "Battre la pâte vigoureusement avec le plat de la main pour l'aérer.",
      "Frire par petites cuillerées dans l'huile chaude jusqu'à ce que les beignets flottent et dorent."
    ]
  },

  // --- Boissons & Douceurs ---
  {
    id: "B06",
    name: "Akpan (Yaourt de maïs)",
    type: "Dessert",
    region: "National",
    category: "Boissons & Douceurs",
    difficulty: "Moyen",
    prepTime: "1h",
    cookTime: "20 min",
    image: "https://picsum.photos/seed/B06/800/600",
    description: "Yaourt végétal à base d'amidon de maïs fermenté.",
    ingredients: [
      { item: "Amidon de maïs (Ogui)", amount: "500g" },
      { item: "Lait concentré", amount: "QS" },
      { item: "Sucre", amount: "QS" },
      { item: "Citronnelle", amount: "2 tiges" }
    ],
    steps: [
      "Porter l'eau à ébullition avec la citronnelle.",
      "Délayer l'amidon et le verser dans l'eau bouillante (hors du feu).",
      "Remuer jusqu'à ce que le mélange épaississe légèrement en refroidissant.",
      "Ajouter le lait concentré et le sucre selon votre goût.",
      "Servir très frais, parfois avec des morceaux de fruits."
    ]
  },
  {
    id: "B01",
    name: "Adoyo",
    type: "Maïs fermenté",
    region: "Sud-Bénin",
    category: "Boissons & Douceurs",
    difficulty: "Facile",
    prepTime: "24h",
    cookTime: "15 min",
    image: "https://picsum.photos/seed/B01/800/600",
    description: "Boisson désaltérante tirée de l'eau de maïs fermentée, ananas et citronnelle.",
    ingredients: [
      { item: "Eau de maïs fermentée", amount: "2L" },
      { item: "Ananas (pelures et chair)", amount: "1" },
      { item: "Citronnelle", amount: "3 tiges" }
    ],
    steps: [
      "Porter l'eau de maïs à ébullition avec les morceaux d'ananas et la citronnelle.",
      "Bouillir 15 minutes.",
      "Filtrer et laisser refroidir.",
      "Ajouter du sucre si nécessaire et servir avec des glaçons."
    ]
  },
  {
    id: "B03",
    name: "Tchoukoutou",
    type: "Bière de mil",
    region: "Nord-Bénin",
    category: "Boissons & Douceurs",
    difficulty: "Très Difficile",
    prepTime: "3 jours",
    cookTime: "5h",
    image: "https://picsum.photos/seed/B03/800/600",
    description: "Bière traditionnelle forte en goût, fermentée à base de sorgho ou de mil.",
    ingredients: [
      { item: "Sorgho ou Mil", amount: "5kg" },
      { item: "Eau", amount: "QS" }
    ],
    steps: [
      "Faire germer les grains de mil en les trempant.",
      "Sécher et moudre les grains germés.",
      "Porter à ébullition la farine dans de grandes jarres d'eau.",
      "Filtrer et laisser fermenter naturellement pendant 24h à 48h."
    ]
  },
  {
    id: "B07",
    name: "Dèguè",
    type: "Mélange Mil/Yaourt",
    region: "Nord-Bénin",
    category: "Boissons & Douceurs",
    difficulty: "Facile",
    prepTime: "20 min",
    cookTime: "15 min",
    image: "https://ewoiqbhqtcdatpzhdaef.supabase.co/storage/v1/object/public/recipe-images/degue.jpg",
    description: "Granules de mil cuites à la vapeur mélangées à du yaourt ou du lait caillé sucré.",
    ingredients: [
      { item: "Granules de mil (Dèguè)", amount: "200g" },
      { item: "Yaourt brassé ou Lait caillé", amount: "500ml" },
      { item: "Sucre", amount: "QS" }
    ],
    steps: [
      "Cuire les granules de mil à la vapeur jusqu'à ce qu'elles soient tendres.",
      "Laisser refroidir complètement.",
      "Mélanger au yaourt bien frais.",
      "Ajouter du sucre et déguster à la cuillère ou au verre."
    ]
  },
  {
    id: "P09",
    name: "Wassa-Wassa",
    base: "Couscous d'igname",
    region: "Nord/Centre-Bénin",
    category: "Pâtes et Céréales (Wɔ̌)",
    difficulty: "Difficile",
    prepTime: "45 min",
    cookTime: "40 min",
    image: "https://picsum.photos/seed/P09/800/600",
    description: "Couscous noir de cossettes d'igname, servi avec de l'huile et du piment.",
    ingredients: [
      { item: "Farine de cossette d'igname", amount: "500g" },
      { item: "Eau (brumisation)", amount: "QS" },
      { item: "Huile végétale", amount: "10cl" }
    ],
    techniqueTitle: "Le Granulage",
    techniqueDescription: "Le secret réside dans l'art de transformer la farine fine en minuscules granules régulières par brumisation et rotation manuelle.",
    steps: [
      "Brumiser la farine d'igname avec un peu d'eau.",
      "Formation des granules par des mouvements circulaires dans une bassine.",
      "Cuire à la vapeur une première fois.",
      "Laver les granules précuites à l'eau froide pour enlever l'amertume.",
      "Recuire à la vapeur jusqu'à ce que les grains soient tendres.",
      "Servir avec de l'huile, du piment et du poisson frit."
    ]
  },
  {
    id: "J01",
    name: "Jus de Bissap",
    region: "National",
    category: "Boissons & Douceurs",
    difficulty: "Très Facile",
    prepTime: "10 min",
    cookTime: "15 min",
    image: "/images/juices/bissap.png",
    description: "L'infusion d'hibiscus rouge rafraîchissante, parfaite pour accompagner tout repas béninois.",
    ingredients: [
      { item: "Fleurs d'hibiscus (Bissap)", amount: "200g" },
      { item: "Eau", amount: "2L" },
      { item: "Sucre", amount: "150g" },
      { item: "Feuilles de menthe fraîche", amount: "1 poignée" }
    ],
    steps: [
      "Laver soigneusement les fleurs à l'eau froide.",
      "Porter l'eau à ébullition dans une grande casserole.",
      "Ajouter l'hibiscus et laisser bouillir 15 minutes.",
      "Retirer du feu, ajouter la menthe et laisser infuser.",
      "Filtrer le mélange à l'aide d'un tamis fin.",
      "Sucrer selon votre goût et mettre au réfrigérateur au moins 3h."
    ]
  },
  {
    id: "J02",
    name: "Jus de Baobab (Bouye)",
    region: "Nord-Bénin",
    category: "Boissons & Douceurs",
    difficulty: "Facile",
    prepTime: "15 min",
    cookTime: "0 min",
    image: "/images/juices/baobab.jpg",
    description: "Une boisson onctueuse et laiteuse extraite de la pulpe du fruit du baobab.",
    ingredients: [
      { item: "Pain de singe (pulpe de baobab)", amount: "300g" },
      { item: "Eau tiède", amount: "1.5L" },
      { item: "Lait concentré sucré", amount: "1 boîte" },
      { item: "Extrait de vanille ou Muscade", amount: "1 càc" }
    ],
    steps: [
      "Faire tremper la pulpe de baobab dans l'eau tiède pendant 2h.",
      "Malaxer à la main pour séparer la pulpe des graines.",
      "Filtrer pour obtenir un jus épais et lisse.",
      "Ajouter le lait concentré et les épices.",
      "Bien mélanger et servir très frais."
    ]
  },
  {
    id: "J03",
    name: "Jus d'Ananas Pain de Sucre",
    region: "Plateau / National",
    category: "Boissons & Douceurs",
    difficulty: "Très Facile",
    prepTime: "20 min",
    cookTime: "0 min",
    image: "/images/juices/ananas.jpg",
    description: "Le célèbre ananas du Bénin, naturellement sucré et sans acidité.",
    ingredients: [
      { item: "Ananas Pain de sucre bien mûr", amount: "2 gros" },
      { item: "Gingembre frais (optionnel)", amount: "30g" },
      { item: "Eau", amount: "20cl" }
    ],
    steps: [
      "Peler l'ananas et le couper en dés.",
      "Mixer les morceaux avec le gingembre et un peu d'eau.",
      "Filtrer le jus à l'aide d'un linge propre ou d'un tamis très fin.",
      "Ne pas ajouter de sucre (l'ananas béninois se suffit à lui-même).",
      "Refroidir avant dégustation."
    ]
  },
  {
    id: "J04",
    name: "Jus de Tamarin",
    region: "Nord/Centre",
    category: "Boissons & Douceurs",
    difficulty: "Facile",
    prepTime: "15 min",
    cookTime: "10 min",
    image: "/images/juices/tamarin.jpg",
    description: "Un jus acidulé et tonique, excellent pour la digestion.",
    ingredients: [
      { item: "Gousses de tamarin", amount: "250g" },
      { item: "Eau", amount: "1.5L" },
      { item: "Sucre de canne", amount: "200g" }
    ],
    steps: [
      "Retirer les coques des tamarins.",
      "Faire bouillir l'eau et y plonger les fruits.",
      "Laisser bouillir 10 minutes pour ramollir la pulpe.",
      "Laisser refroidir, puis frotter pour extraire le jus.",
      "Filtrer soigneusement pour enlever les fibres et les noyaux.",
      "Sucrer et servir frais."
    ]
  },
  {
    id: "J05",
    name: "Jus de Mangue",
    region: "National",
    category: "Boissons & Douceurs",
    difficulty: "Très Facile",
    prepTime: "15 min",
    cookTime: "0 min",
    image: "/images/juices/mangue.jpg",
    description: "Le velouté pur des mangues gorgées de soleil.",
    ingredients: [
      { item: "Mangues charnues (Gouverneur)", amount: "4" },
      { item: "Jus d'un citron vert", amount: "1" },
      { item: "Eau fraîche", amount: "50cl" }
    ],
    steps: [
      "Récupérer la chair des mangues.",
      "Mixer avec le jus de citron et l'eau jusqu'à onctuosité.",
      "Ajuster la texture avec un peu plus d'eau si nécessaire.",
      "Servir sur un lit de glaçons."
    ]
  },
  {
    id: "J06",
    name: "Jus de Corossol",
    region: "Sud-Bénin",
    category: "Boissons & Douceurs",
    difficulty: "Facile",
    prepTime: "25 min",
    cookTime: "0 min",
    image: "https://ewoiqbhqtcdatpzhdaef.supabase.co/storage/v1/object/public/recipe-images/jus-de-corossol.png",
    description: "Une texture crèmeuse et un goût subtilement acidulé.",
    ingredients: [
      { item: "Corossol bien mûr", amount: "1 gros" },
      { item: "Eau", amount: "1L" },
      { item: "Lait concentré sucré (optionnel)", amount: "QS" }
    ],
    steps: [
      "Peler le fruit et retirer les graines noires à la main.",
      "Mettre la pulpe blanche dans un mixeur avec l'eau.",
      "Mixer brièvement pour ne pas broyer les fibres.",
      "Filtrer le mélange.",
      "Ajouter du lait ou du sucre si désiré."
    ]
  },
  {
    id: "J07",
    name: "Jus de Passion",
    region: "Sud-Bénin",
    category: "Boissons & Douceurs",
    difficulty: "Très Facile",
    prepTime: "15 min",
    cookTime: "0 min",
    image: "https://ewoiqbhqtcdatpzhdaef.supabase.co/storage/v1/object/public/recipe-images/jus-de-passion.png",
    description: "Un parfum tropical puissant et une fraîcheur incomparable.",
    ingredients: [
      { item: "Fruits de la passion", amount: "1kg" },
      { item: "Eau", amount: "1L" },
      { item: "Sirop de sucre", amount: "150ml" }
    ],
    steps: [
      "Couper les fruits en deux et récupérer la pulpe à la cuillère.",
      "Mixer par impulsions très courtes (pour ne pas briser les graines).",
      "Passer au chinois pour extraire uniquement le jus.",
      "Mélanger avec l'eau et le sirop.",
      "Servir glacé."
    ]
  },
  {
    id: "J08",
    name: "Jus de Gingembre",
    region: "National",
    category: "Boissons & Douceurs",
    difficulty: "Moyen",
    prepTime: "20 min",
    cookTime: "0 min",
    image: "https://ewoiqbhqtcdatpzhdaef.supabase.co/storage/v1/object/public/recipe-images/jus-de-gingembre.jpg",
    description: "Le 'Gnamankou' africain, piquant, tonique et médicinal.",
    ingredients: [
      { item: "Racine de gingembre frais", amount: "500g" },
      { item: "Eau", amount: "2L" },
      { item: "Jus d'ananas ou Citron vert", amount: "QS" },
      { item: "Sucre", amount: "200g" }
    ],
    steps: [
      "Laver, peler et râper le gingembre.",
      "Mixer avec un peu d'eau pour obtenir une purée.",
      "Laisser reposer 30 minutes dans le reste de l'eau.",
      "Presser et filtrer soigneusement.",
      "Ajouter le sucre et le jus de citron ou d'ananas pour adoucir le piquant.",
      "Boire très frais avec modération."
    ]
  },
];
