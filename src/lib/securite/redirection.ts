// Adresse de retour après connexion (?suite=…) : on n'accepte qu'un chemin
// INTERNE à l'application, pour qu'un lien piégé ne puisse pas renvoyer le père
// vers un faux site après sa connexion (« redirection ouverte »).
const PAGES = ["/carte", "/voiries", "/priorites", "/parametres", "/aide"];

export function cheminSur(suite: string | null | undefined): string {
  if (!suite || suite.length > 500) return "/carte";
  // Pas de barre oblique inverse, d'espace ou de caractère de contrôle : certains
  // navigateurs lisent « /\site.com » comme « //site.com » (un autre site).
  if (!/^\/[A-Za-z0-9\-._~%/?=&:+,;@]*$/.test(suite)) return "/carte";
  if (suite.startsWith("//")) return "/carte";
  const url = new URL(suite, "https://voiries.invalid");
  if (url.origin !== "https://voiries.invalid") return "/carte";
  if (!PAGES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return "/carte";
  return url.pathname + url.search;
}
