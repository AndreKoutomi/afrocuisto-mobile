import { CommunityPost } from '../types/community';

export const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    authorName: 'Mireille D.',
    content:
      "J'ai testé la recette d'Amiwo au poulet braisé ce midi ! Un régal absolu avec la sauce pimentée maison. 🌶️🍗 Qui d'autre a craqué pour cette version ?",
    imageUrl: null,
    recipeName: 'Amiwo au Poulet',
    recipeImage:
      'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80',
    region: 'Bénin',
    likesCount: 24,
    commentsCount: 5,
    sharesCount: 3,
    isLiked: false,
    isBookmarked: false,
    createdAt: 'Il y a 2h',
    comments: [
      {
        id: 'c1',
        postId: 'post_1',
        authorName: 'Koffi A.',
        content: 'Ça a l\'air délicieux ! Tu as mis combien de piment ? 😅',
        createdAt: 'Il y a 1h',
      },
      {
        id: 'c2',
        postId: 'post_1',
        authorName: 'Fatou N.',
        content: 'La sauce pimentée maison change tout, j\'approuve à 100% 👌',
        createdAt: 'Il y a 45min',
      },
    ],
  },
  {
    id: 'post_2',
    authorName: 'Koffi A.',
    content:
      "Atassi réussi du premier coup grâce aux conseils de cuisson sur les haricots ! La communauté AfroCuisto assure 🍲🔥",
    imageUrl:
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
    recipeName: 'Atassi Complet',
    recipeImage:
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
    region: 'Togo',
    likesCount: 18,
    commentsCount: 3,
    sharesCount: 1,
    isLiked: true,
    isBookmarked: false,
    createdAt: 'Il y a 5h',
    comments: [
      {
        id: 'c3',
        postId: 'post_2',
        authorName: 'Mireille D.',
        content: 'Bravo ! Le trempage des haricots la veille c\'est la clé 🔑',
        createdAt: 'Il y a 3h',
      },
    ],
  },
  {
    id: 'post_3',
    authorName: 'Fatou N.',
    content:
      "Petit déjeuner du dimanche : Mafé au bœuf et riz. Le secret ? Laisser mijoter l'arachide doucement. 🥜✨ Partagez vos variantes en commentaire !",
    imageUrl:
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
    recipeName: 'Mafé au Bœuf',
    recipeImage:
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
    region: 'Sénégal',
    likesCount: 42,
    commentsCount: 8,
    sharesCount: 7,
    isLiked: false,
    isBookmarked: true,
    createdAt: 'Il y a 8h',
    comments: [],
  },
  {
    id: 'post_4',
    authorName: 'Aminata K.',
    content:
      "Ma première tentative de Jollof Rice ! Pas mal pour une débutante, non ? 😊 La bataille du Jollof est réelle mais on s'en sort !",
    imageUrl:
      'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80',
    recipeName: 'Jollof Rice',
    recipeImage:
      'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80',
    region: 'Nigéria',
    likesCount: 67,
    commentsCount: 12,
    sharesCount: 4,
    isLiked: false,
    isBookmarked: false,
    createdAt: 'Il y a 12h',
    comments: [],
  },
];

export const COMMUNITY_STATS = {
  members: '12.4k',
  postsToday: 38,
  online: 142,
};
