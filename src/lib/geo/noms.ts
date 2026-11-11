/**
 * Forme de comparaison d'un nom de voie : minuscules, sans accents,
 * apostrophes et tirets unifiés, espaces simples. Le nom d'origine n'est
 * jamais remplacé : cette forme ne sert qu'à comparer et à rechercher.
 */
export function normaliserNom(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[-‐–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
