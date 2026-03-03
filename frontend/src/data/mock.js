// src/data/mock.js
export const collaborateurs = [
  { id: 1, nom: 'Ben Ali', prenom: 'Mohamed', matricule: 'MAT001', departement: 'Informatique', poste: 'Développeur', email: 'mohamed.benali@company.com', telephone: '+216 12 345 678' },
  { id: 2, nom: 'Trabelsi', prenom: 'Sonia', matricule: 'MAT002', departement: 'RH', poste: 'Responsable RH', email: 'sonia.trabelsi@company.com', telephone: '+216 98 765 432' },
  { id: 3, nom: 'Mansour', prenom: 'Karim', matricule: 'MAT003', departement: 'Finance', poste: 'Comptable', email: 'karim.mansour@company.com', telephone: '+216 55 123 456' },
];
export const rendezVous = [
  { id: "r1", date: "2026-03-01", heure: "09:00", collaborateurNom: "Mohamed Ben Ali", type: "Visite périodique", medecinNom: "Dr. Martin", statut: "Confirmé", collaborateurId: "1" },
  { id: "r2", date: "2026-03-05", heure: "10:30", collaborateurNom: "Sonia Trabelsi", type: "Consultation", medecinNom: "Dr. Martin", statut: "Programmé", collaborateurId: "2" },
];

export const analyses = [
  { id: "a1", collaborateurNom: "Mohamed Ben Ali", collaborateurId: "1", type: "Bilan sanguin", dateDemande: "2026-02-20", dateAnalyse: "2026-02-22", statut: "Terminé", resultats: "Normal" },
  { id: "a2", collaborateurNom: "Sonia Trabelsi", collaborateurId: "2", type: "Radiologie", dateDemande: "2026-02-25", dateAnalyse: null, statut: "En attente", resultats: null },
];

export const auditLogs = [
  { id: "l1", date: "2026-02-28T10:00:00", action: "LOGIN", userName: "admin", details: "Connexion réussie" },
  { id: "l2", date: "2026-02-28T11:00:00", action: "VIEW_COLLABORATEUR", userName: "admin", details: "Consultation dossier MAT001" },
];
export const stockItems = [
  {
    id: "s1",
    medicamentNom: "Paracétamol 500mg",
    lot: "LOT-001",
    quantite: 20,
    seuil: 15,
    dateExpiration: "2026-07-10",
  },
  {
    id: "s2",
    medicamentNom: "Ibuprofène 400mg",
    lot: "LOT-002",
    quantite: 8,
    seuil: 10,
    dateExpiration: "2026-05-01",
  },
];

export const mouvementsStock = [
  {
    id: "m1",
    date: "2026-02-21",
    medicamentNom: "Paracétamol 500mg",
    type: "sortie",
    quantite: 5,
    reference: "ORD-1001",
  },
  {
    id: "m2",
    date: "2026-02-19",
    medicamentNom: "Ibuprofène 400mg",
    type: "entree",
    quantite: 20,
    reference: "ACH-2001",
  },
];