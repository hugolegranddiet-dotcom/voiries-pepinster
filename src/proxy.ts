// Garde d'entrée : toute page exige d'être connecté, sauf la page de connexion.
// Le proxy rafraîchit aussi la session Supabase (cookies) à chaque navigation.
// La base reste protégée indépendamment par la sécurité par ligne (RLS).
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PAGE_CONNEXION = "/connexion";

export async function proxy(requete: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const chemin = requete.nextUrl.pathname;
  const estConnexion = chemin === PAGE_CONNEXION;

  // Sans configuration, seule la page de connexion (qui l'explique) est accessible.
  if (!url || !cle) {
    return estConnexion ? NextResponse.next() : NextResponse.redirect(new URL(PAGE_CONNEXION, requete.url));
  }

  let reponse = NextResponse.next({ request: requete });
  const supabase = createServerClient(url, cle, {
    cookies: {
      getAll() {
        return requete.cookies.getAll();
      },
      setAll(aEcrire, entetes) {
        aEcrire.forEach(({ name, value }) => requete.cookies.set(name, value));
        reponse = NextResponse.next({ request: requete });
        aEcrire.forEach(({ name, value, options }) => reponse.cookies.set(name, value, options));
        Object.entries(entetes ?? {}).forEach(([k, v]) => reponse.headers.set(k, v));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const connecte = !!data?.claims?.sub;

  if (!connecte && !estConnexion) {
    if (chemin.startsWith("/api/")) {
      return NextResponse.json({ erreur: "non_connecte" }, { status: 401 });
    }
    const cible = new URL(PAGE_CONNEXION, requete.url);
    cible.searchParams.set("suite", chemin + requete.nextUrl.search);
    return NextResponse.redirect(cible);
  }
  if (connecte && estConnexion) {
    return NextResponse.redirect(new URL("/carte", requete.url));
  }
  return reponse;
}

export const config = {
  // Tout, sauf les fichiers techniques de Next.js et l'icône.
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
