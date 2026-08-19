# Patterns & Formules Clés Frontend (Web & React Native)

## 1. Formules de Largeur Dynamique de Cartes (Multi-Colonnes)

Pour garantir qu'une carte partagée entre un ScrollView horizontal et une Grille verticale ait la même largeur exacte :

```tsx
// Largeur dynamique calculée sur la base de la grille 2 colonnes
const { width: windowWidth } = useWindowDimensions();
const screenWidth = Math.min(windowWidth || 390, MAX_APP_WIDTH); // Ex: 412px
const cardWidth = Math.floor((screenWidth - (HORIZONTAL_PADDING * 2) - GRID_GAP) / 2);
```

---

## 2. Palette Dark Mode Premium

Éviter le noir pur `#000000` et préférer un système à niveaux d'élévation :

| Niveau | Couleur de Fond | Usage |
| :--- | :--- | :--- |
| **Fond Écran (Base)** | `#121110` / `#0F0E0D` | SafeAreaView, ScrollView |
| **Surface Élevée (Cartes)** | `#1A1816` / `#1E1D1B` | Cards, Conteneurs de liste |
| **Surface Interactive** | `#262320` / `#2C2A28` | Pills, Badges, Inputs |
| **Bordures Subtiles** | `#2E2C29` / `#3A3632` | Séparateurs, Contours de cartes |
| **Texte Primaire** | `#FBF9F5` / `#FFFFFF` | Titres, labels importants |
| **Texte Secondaire** | `#B0ACA6` / `#8C8A87` | Descriptions, sous-titres, métadonnées |

---

## 3. Typographie Responsive & Hiérarchie

```tsx
export const Typography = {
  h1: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, lineHeight: 30 },
  h2: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, lineHeight: 24 },
  h3: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, lineHeight: 20 },
  body: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  badge: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
};
```

---

## 4. Composant Skeleton Parfaitement Aligné

Tout squelette de chargement (`Skeleton`) doit être le miroir exact de la carte réelle :

```tsx
export const UnifiedCardSkeleton: React.FC<{ isGrid?: boolean }> = ({ isGrid }) => {
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = Math.min(windowWidth || 390, 412);
  const cardWidth = Math.floor((screenWidth - 32 - 10) / 2);

  return (
    <View style={[styles.card, { width: isGrid ? '100%' : cardWidth }]}>
      <ShimmerSkeleton width="100%" height={120} borderRadius={10} />
      <View style={{ gap: 6, marginTop: 8 }}>
        <ShimmerSkeleton width="80%" height={14} borderRadius={4} />
        <ShimmerSkeleton width="55%" height={12} borderRadius={4} />
      </View>
    </View>
  );
};
```
