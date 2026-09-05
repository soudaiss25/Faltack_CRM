function calculerMontants(facture) {
  const montantHT = facture.lignes.reduce(
    (total, ligne) => total + Number(ligne.quantite) * Number(ligne.prix_unitaire),
    0
  );
  const montantTVA = montantHT * (Number(facture.taux_tva) / 100);
  const montantTTC = montantHT + montantTVA;
  const totalPaye = facture.paiements.reduce((total, p) => total + Number(p.montant), 0);
  const soldeDu = montantTTC - totalPaye;

  return { montantHT, montantTVA, montantTTC, totalPaye, soldeDu };
}

function determinerStatutAffiche(facture, montants) {
  const estImpayee = montants.soldeDu > 0;
  const aUneEcheance = facture.date_echeance && new Date(facture.date_echeance) < new Date();
  if (estImpayee && aUneEcheance && facture.statut !== "BROUILLON") {
    return "EN_RETARD";
  }
  return facture.statut;
}

module.exports = { calculerMontants, determinerStatutAffiche };