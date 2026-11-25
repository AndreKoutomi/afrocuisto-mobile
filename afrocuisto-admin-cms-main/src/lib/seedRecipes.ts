import { supabaseAdmin } from './supabase';

export const DEMO_RECIPES = [
    {
        id: 'P02',
        name: 'Amiwô au Poulet Braisé',
        alias: 'Pâte Rouge Béninoise',
        region: 'Bénin',
        category: 'Pâtes et Céréales (Wɔ̌)',
        difficulty: 'Moyen',
        prep_time: '20 min',
        cook_time: '40 min',
        image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80',
        ingredients: [
            { name: 'Farine de maïs raffinée', amount: '500', unit: 'g', isOptional: false },
            { name: 'Poulet entier découpé', amount: '1', unit: 'kg', isOptional: false },
            { name: 'Purée de tomates fraîches', amount: '3', unit: 'c. à soupe', isOptional: false },
            { name: 'Oignons rouges hachés', amount: '2', unit: 'moyens', isOptional: false },
            { name: 'Piment rouge frais pilé', amount: '1', unit: 'c. à café', isOptional: false },
            { name: "Huile végétale d'arachide", amount: '100', unit: 'ml', isOptional: false },
        ],
        technique_title: 'La Clé de la Pâte Rouge (Amiwô)',
        technique_description: "Infuser le bouillon assaisonné avec la tomate et les épices avant d'y verser la farine en pluie fine.",
        description: "Symbole incontournable des festivités au Bénin, l'Amiwô est une pâte parfumée à la tomate et au bouillon de poulet garnie de volaille braisée.",
        steps: [
            'Faire mariner le poulet avec oignons, ail, gingembre et sel pendant 30 min.',
            'Faire bouillir le poulet dans une marmite jusqu’à cuisson complète. Réserver le bouillon filtré.',
            'Faire frire ou braiser les morceaux de poulet au four jusqu’à dorure.',
            'Dans le bouillon bouillant assaisonné à la tomate, verser la farine de maïs en pluie tout en remuant vigoureusement.',
            'Laisser mijoter à feu doux 15 min sous couvercle, puis dresser avec le poulet et la pimentade.',
        ],
        diaspora_substitutes: 'Remplacer la farine de maïs locale par de la polenta très fine ou de la farine de maïs PAN blanche.',
        suggested_sides: ['Sauce Piment Pili-Pili', 'Jus de Bissap Glacé'],
        benefits: 'Riche en glucides complexes énergétiques et en protéines de haute valeur biologique.',
        is_featured: true,
        rating: 4.9,
    },
    {
        id: 'S05',
        name: 'Dékoun (Sauce Graine aux Crabes)',
        alias: 'Sauce Noix de Palme',
        region: 'Togo & Bénin',
        category: 'Sauces (Nùsúnnú)',
        difficulty: 'Moyen',
        prep_time: '25 min',
        cook_time: '50 min',
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
        ingredients: [
            { name: 'Concentré de noix de palme', amount: '400', unit: 'g', isOptional: false },
            { name: 'Crabes frais nettoyés', amount: '6', unit: 'pièces', isOptional: false },
            { name: 'Poisson fumé (Kpanman)', amount: '200', unit: 'g', isOptional: false },
            { name: 'Crevettes séchées moulues', amount: '2', unit: 'c. à soupe', isOptional: false },
            { name: 'Gombo frais tranché', amount: '100', unit: 'g', isOptional: false },
        ],
        description: 'Une sauce riche, onctueuse et réconfortante extraite des graines de palme fraîches, sublimée par des crabes de lagune et poissons fumés.',
        steps: [
            "Diluer la pâte de noix de palme dans l'eau chaude et filtrer.",
            "Porter à ébullition dans un pot en terre cuite pendant 25 min jusqu'à apparition d'une fine couche d'huile rouge.",
            'Ajouter les crabes, le poisson fumé et le gombo.',
            'Laisser mijoter 20 min à feu doux.',
        ],
        is_featured: true,
        rating: 4.8,
    },
    {
        id: 'P11',
        name: 'Atassi Complet Royale',
        alias: 'Riz & Haricots',
        region: 'Bénin',
        category: 'Pâtes et Céréales (Wɔ̌)',
        difficulty: 'Facile',
        prep_time: '15 min',
        cook_time: '45 min',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
        ingredients: [
            { name: 'Haricots rouges ou œil noir', amount: '300', unit: 'g', isOptional: false },
            { name: 'Riz parfumé long grain', amount: '300', unit: 'g', isOptional: false },
            { name: 'Sauce friture Fritou', amount: '200', unit: 'ml', isOptional: false },
            { name: 'Oeufs durs', amount: '2', unit: 'pièces', isOptional: false },
            { name: 'Viande de bœuf frite', amount: '250', unit: 'g', isOptional: false },
        ],
        description: "Le plat réconfortant béninois par excellence, mêlant riz tendre et haricots onctueux accompagnés d'une friture relevée et d'œufs bouillis.",
        steps: [
            "Cuire les haricots jusqu'à tendreté partielle.",
            'Ajouter le riz dans la même eau de cuisson des haricots avec une pincée de potasse naturelle.',
            'Couvrir et laisser étuver à petit feu.',
            'Servir chaud avec la friture piquante, la viande frite et les œufs.',
        ],
        is_featured: true,
        rating: 4.8,
    },
    {
        id: 'V03',
        name: 'Tchatchanga Suya Brochettes',
        alias: 'Viande Grillée Épicée',
        region: 'Niger & Bénin',
        category: 'Protéines & Grillades',
        difficulty: 'Facile',
        prep_time: '30 min',
        cook_time: '15 min',
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
        ingredients: [
            { name: "Filet de bœuf ou d'agneau", amount: '600', unit: 'g', isOptional: false },
            { name: 'Poudre de Kankan (Yaji)', amount: '4', unit: 'c. à soupe', isOptional: false },
            { name: 'Oignons rouges tranchés', amount: '2', unit: 'pièces', isOptional: false },
            { name: "Huile d'arachide", amount: '3', unit: 'c. à soupe', isOptional: false },
        ],
        description: "Des brochettes de viande de bœuf tendre enrobées de poudre de tourteau d'arachide épicée (Kankan) grillées au feu de bois.",
        steps: [
            'Couper la viande en fines lamelles.',
            "Enfiler sur des pics en bois et badigeonner d'huile.",
            'Rouler généreusement dans la poudre de Kankan.',
            'Griller sur le barbecue très chaud 3 min par face.',
        ],
        is_featured: true,
        rating: 4.9,
    },
    {
        id: 'J01',
        name: 'Jus de Bissap à la Menthe',
        alias: "Infusion d'Hibiscus",
        region: "Sénégal & Afrique de l'Ouest",
        category: 'Boissons & Douceurs',
        difficulty: 'Facile',
        prep_time: '10 min',
        cook_time: '15 min',
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80',
        ingredients: [
            { name: "Fleurs d'hibiscus séchées (Bissap)", amount: '100', unit: 'g', isOptional: false },
            { name: 'Feuilles de menthe fraîche', amount: '1', unit: 'bouquet', isOptional: false },
            { name: 'Sucre de canne ou miel', amount: '150', unit: 'g', isOptional: false },
            { name: "Arôme Fleur d'oranger ou vanille", amount: '1', unit: 'c. à café', isOptional: true },
        ],
        description: "Boisson rafraîchissante et antioxydante préparée à partir de fleurs rouges d'hibiscus infusées avec de la menthe fraîche.",
        steps: [
            "Rincer rapidement les fleurs de bissap à l'eau froide.",
            "Porter 1.5L d'eau à ébullition avec les fleurs et la menthe pendant 15 min.",
            'Filtrer finement à la passoire.',
            'Sucrer et parfumer, puis placer au réfrigérateur au moins 3 heures.',
        ],
        is_featured: false,
        rating: 4.9,
    },
    {
        id: 'M04',
        name: 'Mafé au Poulet & Arachide',
        alias: 'Tiga Dèguè Na',
        region: 'Sénégal & Mali',
        category: 'Sauces (Nùsúnnú)',
        difficulty: 'Facile',
        prep_time: '20 min',
        cook_time: '40 min',
        image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80',
        ingredients: [
            { name: 'Poulet fermier découpé', amount: '800', unit: 'g', isOptional: false },
            { name: "Pâte d'arachide pure non sucrée", amount: '180', unit: 'g', isOptional: false },
            { name: 'Purée de tomates fraîches', amount: '3', unit: 'c. à soupe', isOptional: false },
            { name: 'Patate douce & carottes', amount: '350', unit: 'g', isOptional: false },
            { name: 'Oignons, ail & gingembre', amount: '2', unit: 'pièces', isOptional: false },
        ],
        technique_title: 'Onctuosité de la Sauce Arachide',
        technique_description: "Délayer la pâte d'arachide hors du feu dans un peu de bouillon tiède avant de la laisser mijoter doucement jusqu'à remontée d'une fine huile dorée.",
        description: "Grand classique ouest-africain au poulet fondant mijoté dans une sauce veloutée au beurre d'arachide, tomates et légumes racines.",
        steps: [
            'Faire dorer les morceaux de poulet avec oignons, ail et concentré de tomate.',
            "Délayer la pâte d'arachide dans l'eau tiède puis verser sur le poulet.",
            'Ajouter patate douce et carottes en gros morceaux puis mijoter 30 min à feu doux.',
            'Servir bien chaud sur un lit de riz blanc parfumé.',
        ],
        diaspora_substitutes: 'Utiliser du beurre de cacahuète 100 % pur sans sucre ni huile ajoutée.',
        suggested_sides: ['Riz blanc parfumé', 'Jus de Bissap Glacé'],
        is_featured: true,
        rating: 4.9,
    },
];

export async function seedDemoRecipesAndSections() {
    const { error: recipeErr } = await supabaseAdmin
        .from('recipes')
        .upsert(DEMO_RECIPES, { onConflict: 'id' });

    if (recipeErr) throw recipeErr;

    const { count } = await supabaseAdmin
        .from('home_sections')
        .select('*', { count: 'exact', head: true });

    if (!count || count === 0) {
        await supabaseAdmin.from('home_sections').insert([
            {
                title: 'Carrousel Principal',
                section_type: 'carousel_hero',
                item_ids: ['P02', 'S05', 'P11', 'M04'],
                order_index: 0,
                is_active: true,
            },
            {
                title: 'Les Plus Populaires',
                section_type: 'popular_grid',
                item_ids: ['P02', 'S05', 'P11', 'V03', 'J01', 'M04'],
                order_index: 1,
                is_active: true,
            },
        ]);
    }
}
