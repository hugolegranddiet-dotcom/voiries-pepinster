import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AvertissementScore, EnTetePage } from "@/components/blocs";

export const metadata: Metadata = { title: "Aide" };

// Guide utilisateur de l'application (phase 7). Texte simple, sans jargon.
const SECTIONS: Array<{ id: string; titre: string; contenu: ReactNode }> = [
  {
    id: "carte",
    titre: "1. La carte",
    contenu: (
      <>
        <p>Toutes les routes, chemins et sentiers de Pepinster sont dessinés sur la carte, même ceux qui n&apos;étaient pas dans l&apos;Excel.</p>
        <ul>
          <li><strong>Trouver une rue :</strong> tape son nom dans « Chercher une rue… » (les accents et l&apos;ordre des mots ne comptent pas : « biez rue » trouve « Rue du Biez »), puis choisis-la dans la liste.</li>
          <li><strong>Ouvrir une fiche :</strong> clique (ou touche, sur téléphone) une route. Toute la route est entourée d&apos;un contour foncé et sa fiche s&apos;ouvre.</li>
          <li><strong>Filtres :</strong> types de voies, gestionnaire (commune, SPW…), et notes d&apos;état à afficher. Sur téléphone, touche « Filtres et légende ».</li>
          <li><strong>Couleur des routes :</strong> « Priorité (score) » ou « État de la chaussée » (vert = bon, rouge foncé = dégradé). Gris = pas encore évalué.</li>
          <li>
            <strong>Parties de rue</strong> (Soiron-Centre, Bouhaye…) : ouvre la fiche de la partie, clique « Choisir les morceaux sur la carte », clique
            les morceaux de la rue qui en font partie, puis « Enregistrer le tracé ». Ils prennent alors la couleur de cette partie.
          </li>
          <li>
            <strong>Plus de place pour la carte</strong> (ordinateur) : « Masquer les filtres » replie le panneau des filtres ; la flèche › en haut de
            la fiche la réduit en une fine bande (clique-la pour la rouvrir) ; tire le bord gauche de la fiche pour l&apos;élargir ou la rétrécir
            (double-clic : taille normale). Ces choix sont retenus sur l&apos;ordinateur.
          </li>
          <li><strong>Pointillés :</strong> route du SPW ou d&apos;un autre gestionnaire. Elle reste sur la carte, mais hors du classement communal.</li>
        </ul>
      </>
    ),
  },
  {
    id: "fiche",
    titre: "2. Modifier une fiche",
    contenu: (
      <>
        <ol>
          <li>Ouvre la fiche (depuis la carte ou la liste) et clique <strong>Modifier</strong>.</li>
          <li>Change les valeurs : gestionnaire, état (1 = bon, 5 = dégradé), circulation, densité, risque, travaux, échéance, particularités.</li>
          <li>Pendant que tu modifies, un cadre montre <strong>le score qu&apos;aurait la route</strong> avec ces valeurs.</li>
          <li>Clique <strong>Enregistrer</strong>. Le message « Modifications enregistrées à … » confirme. <strong>Annuler</strong> abandonne sans rien changer.</li>
        </ol>
        <p>
          <strong>Priorité forcée :</strong> en bas du formulaire, coche « Fixer moi-même la priorité », choisis un nombre de 0 à 100 et écris la
          raison (obligatoire). Partout, la route porte alors la mention <strong>MANUEL</strong> ; le score calculé reste visible dans sa fiche.
          Décoche la case pour revenir au calcul.
        </p>
        <p>Choisir « — non renseigné — » vide un champ : la donnée devient inconnue (ce n&apos;est jamais un zéro). Toutes les modifications sont gardées dans un journal, avec la date.</p>
      </>
    ),
  },
  {
    id: "liste",
    titre: "3. La liste des voiries",
    contenu: (
      <ul>
        <li>Recherche par nom ou par ancienne commune (Cornesse, Soiron, Wegnez…).</li>
        <li><strong>Filtres</strong> : types de voies, gestionnaire, statut, état de la chaussée, couleur de priorité. Ils se combinent.</li>
        <li>Clique un titre de colonne pour trier (un deuxième clic inverse l&apos;ordre).</li>
        <li>Clique une ligne pour ouvrir sa fiche ; l&apos;icône carte la montre sur la carte.</li>
        <li><strong>Exporter la liste (CSV)</strong> : télécharge la liste affichée, lisible dans Excel.</li>
      </ul>
    ),
  },
  {
    id: "score",
    titre: "4. Comprendre le score de priorité",
    contenu: (
      <>
        <p>Chaque route reçoit un score de 0 à 100 : plus il est haut, plus des travaux sont prioritaires. Il combine :</p>
        <ul>
          <li>l&apos;état de la chaussée (55 %), la circulation (20 %), la densité d&apos;habitation (15 %), le risque sécurité (10 %) — réglables dans Paramètres ;</li>
          <li>l&apos;ampleur des travaux et l&apos;échéance (année prévue, sinon estimée) peuvent aussi compter : ils sont à 0 % au départ, à activer dans Paramètres ;</li>
          <li>couleurs : vert 0–24, jaune 25–49, orange 50–74, rouge 75–100 ;</li>
          <li><strong>pas de score</strong> (gris) tant que l&apos;état n&apos;est pas noté, ou si trop peu de critères sont remplis (moins de 70 %) ;</li>
          <li><strong>« provisoire »</strong> : un critère manque encore. Le compléter peut changer le score (souvent à la baisse ou à la hausse de plusieurs points).</li>
        </ul>
        <p>Dans chaque fiche, « Détail du calcul » montre les points de chaque critère. Les travaux, l&apos;échéance et les textes libres n&apos;entrent pas dans le score.</p>
      </>
    ),
  },
  {
    id: "priorites",
    titre: "5. L'écran Priorités",
    contenu: (
      <ul>
        <li>Le classement va de la route la plus prioritaire à la moins prioritaire. Deux routes au même score ont le même rang.</li>
        <li>La case « Exclure les voiries SPW et d&apos;autres gestionnaires » (cochée par défaut) garde seulement les routes communales.</li>
        <li><strong>Exporter le classement (CSV)</strong> : pour le présenter ou l&apos;imprimer depuis Excel.</li>
      </ul>
    ),
  },
  {
    id: "parametres",
    titre: "6. Paramètres et sauvegarde",
    contenu: (
      <ul>
        <li>Tu peux changer les poids, les points de chaque valeur, les seuils de couleur et le minimum de critères. Un aperçu montre l&apos;effet avant d&apos;enregistrer.</li>
        <li>Chaque enregistrement crée une <strong>nouvelle version</strong> ; les anciennes restent et peuvent être réactivées (« Réactiver »).</li>
        <li><strong>Sauvegarde :</strong> une fois par mois, clique « Télécharger toutes les voiries » et garde le fichier (ordinateur, clé USB…).</li>
      </ul>
    ),
  },
  {
    id: "problemes",
    titre: "7. En cas de problème",
    contenu: (
      <ul>
        <li><strong>« Ta session a expiré »</strong> : recharge la page et reconnecte-toi. Ce qui était enregistré est conservé.</li>
        <li><strong>« Impossible de joindre le serveur »</strong> : vérifie la connexion Internet, puis clique « Réessayer ».</li>
        <li><strong>L&apos;application ne s&apos;ouvre plus du tout</strong> après une longue période sans l&apos;utiliser : la base gratuite se met en pause après environ une semaine sans activité. Préviens Hugo : il la relance en un clic, sans perte de données.</li>
        <li><strong>Mot de passe oublié</strong> : demande à Hugo, il peut le réinitialiser.</li>
        <li>Une route manque, ou un tracé est faux : note son nom et préviens Hugo (les tracés viennent d&apos;OpenStreetMap et ne se dessinent pas à la main).</li>
      </ul>
    ),
  },
];

export default function PageAide() {
  return (
    <>
      <EnTetePage titre="Aide" description="Mode d'emploi de l'application, en quelques minutes." />
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-5 md:px-8">
        <nav aria-label="Sommaire" className="rounded-xl border border-line bg-surface p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Sommaire</p>
          <ol className="grid gap-1 text-sm sm:grid-cols-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-brand underline underline-offset-2">
                  {s.titre}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`t-${s.id}`} className="scroll-mt-4 rounded-xl border border-line bg-surface p-4 md:p-5">
            <h2 id={`t-${s.id}`} className="mb-2 text-lg font-semibold text-ink">
              {s.titre}
            </h2>
            <div className="space-y-2 text-[0.95rem] leading-relaxed text-ink [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">{s.contenu}</div>
          </section>
        ))}
        <AvertissementScore />
        <p className="text-xs text-muted">Données cartographiques © contributeurs OpenStreetMap (licence ODbL). Indice du réseau régional : SPW.</p>
      </div>
    </>
  );
}
