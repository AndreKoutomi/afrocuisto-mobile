/* 
 * Point d'entrée principal (Entry point) de l'espace Administration (CMS) React.
 * C'est le tout premier fichier qui s'exécute quand on lance l'interface d'admnistration.
 */
import { StrictMode } from 'react' // Mode strict pour détecter les potentielles erreurs React
import { createRoot } from 'react-dom/client' // Outil pour monter l'application React dans le HTML
import './index.css' // Import des styles globaux pour l'admin (TailwindCSS, polices, etc.)
import App from './App.tsx' // Importation du composant racine de l'app d'administration

// 1. Récupère la div <div id="root"></div> du fichier index.html
// 2. Y injecte toute l'application React (le composant <App />)
createRoot(document.getElementById('root')!).render(
  // Le StrictMode encapsule l'App pour ajouter des vérifications supplémentaires côté développeur
  <StrictMode>
    <App />
  </StrictMode>,
)
