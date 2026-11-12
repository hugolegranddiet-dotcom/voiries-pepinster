"use server";

// Tracé d'une partie de rue (D21) : le père choisit, parmi les morceaux OSM
// RÉELS de la rue mère, ceux qui forment la partie. Aucun tracé n'est dessiné
// ni coupé : un morceau est pris en entier ou pas du tout.
import { z } from "zod";
import { IdentifiantVoirie } from "@/lib/db/schemas";
import { clientServeur, configSupabase, utilisateurConnecte } from "@/lib/supabase/serveur";
import type { ResultatAction } from "@/app/actions/evaluations";

const SESSION_EXPIREE = "Ta session a expiré : recharge la page pour te reconnecter.";

const Saisie = z
  .object({
    sectionId: IdentifiantVoirie,
    segments: z.array(z.string().regex(/^[A-Za-z0-9:#._-]{1,80}$/)).max(300),
  })
  .strict();

const MESSAGES: Record<string, string> = {
  segment_hors_rue_mere: "Un des morceaux choisis n'appartient pas à la rue mère.",
  segment_deja_attribue: "Un des morceaux appartient déjà à une autre partie de cette rue.",
  segments_reserves_aux_sections: "Seule une partie de rue peut avoir des morceaux choisis.",
};

export async function enregistrerTraceSection(saisie: unknown): Promise<ResultatAction<{ segments: string[] }>> {
  const s = Saisie.safeParse(saisie);
  if (!s.success) return { ok: false, erreur: "Choix de morceaux invalide." };
  const segments = [...new Set(s.data.segments)].sort();
  try {
    if (!configSupabase()) return { ok: false, erreur: SESSION_EXPIREE };
    const supabase = await clientServeur();
    if (!(await utilisateurConnecte(supabase))) return { ok: false, erreur: SESSION_EXPIREE };

    const { data: section, error: e1 } = await supabase.from("roads").select("id, categorie, parent_road_id").eq("id", s.data.sectionId).maybeSingle();
    if (e1 || !section) return { ok: false, erreur: "Partie de rue introuvable." };
    if (section.categorie !== "section" || !section.parent_road_id) return { ok: false, erreur: MESSAGES.segments_reserves_aux_sections };

    if (segments.length) {
      const { data: possibles, error: e2 } = await supabase.from("road_segments").select("id").eq("road_id", section.parent_road_id);
      if (e2) return { ok: false, erreur: "Lecture du tracé impossible." };
      const ids = new Set((possibles ?? []).map((x) => x.id as string));
      if (!segments.every((id) => ids.has(id))) return { ok: false, erreur: MESSAGES.segment_hors_rue_mere };
    }

    const { error } = await supabase.from("roads").update({ segments_section: segments }).eq("id", s.data.sectionId);
    if (error) {
      const cle = Object.keys(MESSAGES).find((k) => error.message.includes(k));
      if (cle) return { ok: false, erreur: MESSAGES[cle] };
      if (/segments_section/.test(error.message) && /column|schema cache/i.test(error.message)) {
        return { ok: false, erreur: "La base de données n'a pas encore toutes ses mises à jour. Préviens Hugo (sur le Mac : npx supabase@3.1.0 db push --remote)." };
      }
      return { ok: false, erreur: "Enregistrement impossible." };
    }
    return { ok: true, donnees: { segments } };
  } catch {
    return { ok: false, erreur: "Problème de connexion : réessaie dans un instant." };
  }
}
