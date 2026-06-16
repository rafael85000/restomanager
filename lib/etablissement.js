export function getEtablissementActif() {
  if (typeof window === 'undefined') return null;
  return window.localStorage?.getItem('etablissement_actif');
}
