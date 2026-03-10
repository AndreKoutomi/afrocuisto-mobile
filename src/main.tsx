/* 
 * Point d'entrée principal (Entry point) de l'application React.
 * C'est le tout premier fichier qui s'exécute quand l'application se lance.
 */
import { StrictMode } from 'react'; // Mode strict de React pour détecter les problèmes potentiels (double exécution en dev).
import { createRoot } from 'react-dom/client'; // Fonction pour créer l'arbre de rendu React dans le document HTML.
import App from './App.tsx'; // Importation du composant racine de l'application (qui contient tout le reste).
import './index.css'; // Importation des styles globaux, y compris TailwindCSS (s'il est configuré ici).

// 1. On cherche l'élément HTML avec l'ID 'root' (généralement dans index.html)
// 2. On y attache (render) notre application React
createRoot(document.getElementById('root')!).render(
  // Le StrictMode n'apparaît pas visuellement, il aide juste au développement en faisant des vérifications
  <StrictMode>
    {/* Notre composant principal qui gère la navigation, les données, et l'interface */}
    <App />
  </StrictMode>,
);
