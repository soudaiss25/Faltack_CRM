function genererDiagnostic(indicateurs) {
  const { tauxMarge, tauxImpaye, delaiMoyenPaiementJours, evolutionCaPct, categorieDominante } = indicateurs;
  const pointsForts = [];
  const pointsFaibles = [];
  const opportunites = [];

  if (tauxMarge !== null) {
    if (tauxMarge >= 30) pointsForts.push(`Marge confortable (${tauxMarge.toFixed(0)}%)`);
    else if (tauxMarge < 0) pointsFaibles.push("Activité déficitaire sur la période (dépenses supérieures aux encaissements)");
    else if (tauxMarge < 10) pointsFaibles.push(`Marge faible (${tauxMarge.toFixed(0)}%)`);
  }

  if (tauxImpaye !== null && tauxImpaye > 20) {
    pointsFaibles.push(`Taux d'impayés élevé (${tauxImpaye.toFixed(0)}% du facturé)`);
    opportunites.push("Mettre en place des relances automatiques pour réduire les impayés");
  }

  if (delaiMoyenPaiementJours !== null && delaiMoyenPaiementJours > 45) {
    pointsFaibles.push(`Délai de paiement client long (${Math.round(delaiMoyenPaiementJours)} jours en moyenne)`);
    opportunites.push("Négocier un acompte à la commande ou raccourcir les délais de paiement");
  }

  if (evolutionCaPct !== null) {
    if (evolutionCaPct >= 10) pointsForts.push(`Croissance de l'encaissé (+${evolutionCaPct.toFixed(0)}% vs mois précédent)`);
    else if (evolutionCaPct <= -10) pointsFaibles.push(`Baisse de l'encaissé (${evolutionCaPct.toFixed(0)}% vs mois précédent)`);
  }

  if (categorieDominante && categorieDominante.part > 50) {
    pointsFaibles.push(`Dépenses très concentrées sur "${categorieDominante.label}" (${categorieDominante.part.toFixed(0)}% du total)`);
    opportunites.push(`Renégocier ou diversifier le poste "${categorieDominante.label}" pour réduire le risque`);
  }

  if (pointsForts.length === 0 && pointsFaibles.length === 0) {
    opportunites.push("Pas assez de données sur la période pour un diagnostic fiable — élargir la période ou enregistrer plus d'opérations");
  }

  return { points_forts: pointsForts, points_faibles: pointsFaibles, opportunites };
}

module.exports = { genererDiagnostic };