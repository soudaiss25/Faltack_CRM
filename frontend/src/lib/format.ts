export function formaterMontant(valeur: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(valeur || 0);
}
