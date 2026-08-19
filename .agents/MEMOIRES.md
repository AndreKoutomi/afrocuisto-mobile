# 🧠 Mémoires — AfroCuisto Project

> Ce fichier est la mémoire persistante du projet AfroCuisto.
> Lorsque tu demandes "enregistre en mémoire", j'y ajoute l'entrée correspondante.
> Les entrées sont horodatées et catégorisées.

---

## 📱 React Native / Expo — Patterns & Pièges

### [2026-08-19] GlowEffect 360° cross-platform (iOS + Android + Web)

**Contexte :** Créer un halo coloré animé autour du bloc "Assistant Chef" dans `RecipeDetailScreen`.

**Ce qui NE fonctionne PAS sur Android :**
- `shadowColor` + `shadowRadius` → iOS seulement (360°), Android projette **uniquement vers le bas**
- `elevation` → ombre toujours orientée vers le bas (modèle physique Android), ignore `shadowOffset: {width:0, height:0}`
- `Animated.createAnimatedComponent(Stop)` de `react-native-svg` → crash `[Reanimated] Cannot find host instance` car `Stop` SVG n'est pas une vue hôte native

**✅ Solution gagnante — `react-native-svg` + `feGaussianBlur` + cross-fade `Animated.View` :**
```tsx
// N Animated.View (opacité cross-fade) × N SVG statiques avec feGaussianBlur
// → vrai flou gaussien 360° sur Android, iOS et Web

<Animated.View style={{ opacity: anims[i] }}>
  <Svg>
    <Defs>
      <Filter id="glowBlur" x="-60%" y="-60%" width="220%" height="220%">
        <FeGaussianBlur in="SourceGraphic" stdDeviation={12} />
      </Filter>
      <LinearGradient id="glowGrad">
        <Stop offset="0%" stopColor={colorA} />
        <Stop offset="100%" stopColor={colorB} />
      </LinearGradient>
    </Defs>
    <Rect fill="url(#glowGrad)" filter="url(#glowBlur)" rx={24} ... />
  </Svg>
</Animated.View>
```

**Points critiques :**
- `overflowPadding = stdDeviation × 2.5` → évite que le flou soit coupé aux bords du viewport SVG
- Le filtre SVG doit avoir `x="-60%" y="-60%" width="220%" height="220%"` pour que le flou déborde
- Animer `Animated.View.opacity` (vue hôte native ✅), jamais `Stop.stopColor` directement via Reanimated
- Le parent `assistantChefGlowContainer` doit avoir `overflow: visible` (défaut RN)
- Ajouter `paddingVertical: 14` sur le wrapper externe pour que le halo soit visible en haut/bas

**Fichiers :**
- `src/components/core/glow-effect.tsx`
- `src/screens/RecipeDetailScreen.tsx`

---

### [2026-08-19] Metro Bundler — `lucide` package incompatible RN

**Problème :** `lucide` v1.33 → erreur Metro `Unable to resolve "./icons/a-arrow-down.mjs"` (2000 fichiers `.mjs`).

**Solution :** Ne JAMAIS importer `from 'lucide'` dans un projet RN Expo standard. Isoler les données SVG AST Lucide directement dans un composant interne (`MorphIcon.tsx`).

---

### [2026-08-19] Notification Android Status Bar Chip (Pastille native)

**Pour déclencher la pastille chronomètre native Android (Google Pixel, Android 14/15) :**
- Titre de notification préfixé par `⏱ MM:SS • NomRecette`
- `categoryIdentifier: 'stopwatch'`
- `sticky: true`
- Canal `importance: AndroidImportance.MAX`

---

### [2026-08-19] `expo-notifications` — Asset not found

**Problème :** `app.json` avec config imbriquée `expo-notifications` → `Asset not found: icon.png`

**Fix :** Utiliser la forme simple : `"plugins": ["expo-notifications"]` sans config imbriquée.

---

### [2026-08-19] `MorphIcon` — Morphing vectoriel Play/Pause

**Composant :** `src/components/common/MorphIcon.tsx`
- Transition de morphing vectoriel via `Animated.spring` + interpolation de points SVG
- Impulsion d'échelle + rotation 90° + fondu croisé
- Les données AST Lucide (`Play`, `Pause`, `Menu`, `X`) sont définies en interne pour éviter le problème Metro

---

### [2026-08-19] Expandable Search Bar (HomeHeader)

**Composant :** `src/components/home/HomeHeader.tsx`
- Bouton recherche placé à gauche de la cloche de notification.
- Au clic : déroulement fluide (`react-native-reanimated` spring) d'une barre de recherche couvrant l'ensemble du header.
- Le contenu du header (profil, salutation, cloche) s'estompe avec `opacity` + `translateX` + `scale`.
- Auto-focus sur le champ de texte, bouton de fermeture `X` / reset, et bouton IA.

---

### [2026-08-19] Section Vidéo YouTube In-App Intelligente

**Composant :** `src/components/recipe/RecipeVideoSection.tsx`
- **Résolution intelligente** : Extrait l'ID YouTube depuis n'importe quelle URL YouTube (watch, youtu.be, embed, shorts) ou associe automatiquement le plat (Amiwô, Alloco, Dja, Gombo, etc.) à un tutoriel culinaire authentique vérifié.
- **Double mode de lecture** :
  - *Mode Inline* : lecteur in-app via `react-native-webview` (ou `iframe` sur Web) sans quitter la page.
  - *Mode Plein Écran* : modale immersive in-app avec contrôles dédiés et titre.
- **Miniature HD & Bouton Play rouge YouTube** avec badge "TUTORIEL VIDÉO" et tag "In-App HD".

---

## 🗂️ Architecture Projet AfroCuisto

### Structure principale
```
afrocuisto-mobile/          → App Expo React Native
afrocuisto-admin-cms-main/  → Admin CMS Web (Vite + React)
libs/                       → Utilitaires partagés (workspace root)
```

### Alias & Chemins
- `@/` → résolu vers `src/` dans le mobile
- `libs/utils.ts` à la racine du workspace → exclure du tsconfig mobile (`"exclude": ["libs"]`)

---

## 📝 Notes générales

*(Les prochaines entrées seront ajoutées ici sur demande)*
