import React from 'react';
import { FileText, ShieldAlert } from 'lucide-react';

export const LegalTextView = ({ type, settings, goBack }: any) => {
  const isDark = settings.darkMode;

  return (
    <div className={`p-6 pb-20 space-y-6 text-left leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
      
      {type === 'cgu' && (
        <>
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-50 text-sky-500'}`}>
              <FileText size={24} />
            </div>
            <div>
              <h2 className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>Conditions d'Utilisation</h2>
              <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-sky-400/60' : 'text-sky-600/60'}`}>Loi N° 2017-20</p>
            </div>
          </div>

          <div className="space-y-6 text-sm">
            <section>
              <h3 className={`font-black text-base mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>1. Objet de l'application</h3>
              <p>AfroCuisto est une application mobile visant à promouvoir, sauvegarder et partager le patrimoine gastronomique béninois. L'application propose des recettes, des astuces, et une plateforme communautaire d'échange d'astuces culinaires.</p>
            </section>

            <section>
              <h3 className={`font-black text-base mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>2. Cadre légal et Juridiction</h3>
              <p>Les présentes Conditions Générales d'Utilisation (CGU) sont régies par la législation de la République du Bénin, et plus particulièrement par la <strong>Loi n° 2017-20 du 20 avril 2018 portant Code du numérique</strong>.</p>
            </section>

            <section>
              <h3 className={`font-black text-base mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>3. Propriété intellectuelle</h3>
              <p>Tous les contenus originaux (textes, images des recettes par défaut, logos, interface) sont la propriété d'AfroCuisto (Éditeur : André Koutomi). Conformément au Code du Numérique et aux règles de la propriété intellectuelle au Bénin, toute reproduction non autorisée est interdite.</p>
            </section>

            <section>
              <h3 className={`font-black text-base mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>4. Responsabilité de l'utilisateur</h3>
              <p>L'utilisateur est responsable des contenus qu'il publie (commentaires, rapports, suggestions de plats). Il s'engage à ne publier aucun contenu offensant, diffamatoire ou contraire aux bonnes mœurs. AfroCuisto se réserve le droit de modérer ou supprimer tout contenu enfreignant ces règles.</p>
            </section>

            <section>
              <h3 className={`font-black text-base mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>5. Modification des CGU</h3>
              <p>L'éditeur se réserve le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront informés des modifications majeures via l'application.</p>
            </section>
          </div>
        </>
      )}

      {type === 'privacy' && (
        <>
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-500'}`}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>Confidentialité & Données</h2>
              <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-emerald-400/60' : 'text-emerald-600/60'}`}>Conformité APDP</p>
            </div>
          </div>

          <div className="space-y-6 text-sm">
            <section>
              <h3 className={`font-black text-base mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>1. Engagements généraux</h3>
              <p>La protection de votre vie privée est critique. AfroCuisto collecte et traite vos données personnelles en stricte conformité avec le <strong>Livre V du Code du Numérique au Bénin</strong>, sous l'autorité de l'Autorité de Protection des Données Personnelles (APDP).</p>
            </section>

            <section>
              <h3 className={`font-black text-base mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>2. Données collectées</h3>
              <p>L'application AfroCuisto (via le Cloud Sync) collecte uniquement les données strictement nécessaires : adresse e-mail, préférences culinaires, listes de courses, et recettes favorites. Aucun traçage de la localisation n'est effectué à des fins publicitaires.</p>
            </section>

            <section>
              <h3 className={`font-black text-base mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>3. Finalité du traitement</h3>
              <p>L'hébergement permet de vous garantir que vos favoris et listes de courses sont synchronisés. Les statistiques anonymisées servent exclusivement à l'amélioration de l'audience des différents plats traditionnels.</p>
            </section>

            <section>
              <h3 className={`font-black text-base mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>4. Sécurité de l'hébergement</h3>
              <p>Vos données transitent par un protocole sécurisé et sont hébergées sur des bases de données internationales fiables avec un cryptage de bout en bout pour votre mot de passe, garantissant l'intégrité face aux cyber-intrusions.</p>
            </section>

            <section>
              <h3 className={`font-black text-base mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>5. Vos droits (Accès, Rectification, Suppresion)</h3>
              <p>Vous disposez d'un droit inaliénable de rectification et de suppression (Droit à l'oubli). Vous pouvez à tout moment clôturer et supprimer l'intégralité de votre compte et de vos données personnelles via le menu <strong>Profil {">"} Confidentialité {">"} Supprimer mon compte</strong> de l'application.</p>
            </section>
          </div>
        </>
      )}

      <div className={`mt-8 pt-8 border-t ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
        <p className="text-xs text-center italic opacity-70">
          Dernière mise à jour : {new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('fr-FR')}
        </p>
      </div>
    </div>
  );
};
