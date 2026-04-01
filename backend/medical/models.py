from django.db import models
from django.conf import settings
from accounts.models import Collaborateur


# =====================================================
# DOSSIER MEDICAL
# =====================================================

class DossierMedical(models.Model):
    collaborateur = models.OneToOneField(
        Collaborateur,
        on_delete=models.CASCADE,
        related_name="dossier_medical"
    )

    entreprise = models.CharField(max_length=255, blank=True, null=True)
    localite = models.CharField(max_length=255, blank=True, null=True)

    # identification / qualification
    date_recrutement = models.DateField(null=True, blank=True)
    niveau_etudes_diplomes = models.CharField(max_length=255, blank=True, null=True)
    profession = models.CharField(max_length=255, blank=True, null=True)
    poste_travail_actuel = models.CharField(max_length=255, blank=True, null=True)

    # antécédents
    antecedents_medicaux = models.TextField(blank=True, null=True)
    antecedents_chirurgicaux = models.TextField(blank=True, null=True)
    antecedents_gynecologiques = models.TextField(blank=True, null=True)
    antecedents_heredofamiliaux = models.TextField(blank=True, null=True)

    # habitudes
    tabac = models.CharField(max_length=255, blank=True, null=True)
    alcool = models.CharField(max_length=255, blank=True, null=True)
    automedication = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dossier {self.collaborateur.matricule}"


# =====================================================
# EXAMEN INITIAL
# =====================================================

class ExamenInitial(models.Model):
    dossier = models.OneToOneField(
        DossierMedical,
        on_delete=models.CASCADE,
        related_name="examen_initial"
    )

    medecin_nom = models.CharField(max_length=255)
    date_examen = models.DateField()

    poids = models.FloatField(null=True, blank=True)
    taille = models.FloatField(null=True, blank=True)

    # vision
    vision_od_pres = models.CharField(max_length=50, blank=True, null=True)
    vision_od_loin = models.CharField(max_length=50, blank=True, null=True)
    vision_og_pres = models.CharField(max_length=50, blank=True, null=True)
    vision_og_loin = models.CharField(max_length=50, blank=True, null=True)

    # audition
    audition_od = models.CharField(max_length=50, blank=True, null=True)
    audition_og = models.CharField(max_length=50, blank=True, null=True)

    # examen clinique
    denture = models.TextField(blank=True, null=True)
    teguments = models.TextField(blank=True, null=True)
    appareil_locomoteur = models.TextField(blank=True, null=True)
    appareil_respiratoire = models.TextField(blank=True, null=True)
    appareil_cardio_vasculaire = models.TextField(blank=True, null=True)

    pouls = models.CharField(max_length=50, blank=True, null=True)
    tension_arterielle = models.CharField(max_length=50, blank=True, null=True)

    abdomen = models.TextField(blank=True, null=True)
    appareil_genito_urinaire = models.TextField(blank=True, null=True)
    glandes_endocrines = models.TextField(blank=True, null=True)
    systeme_nerveux = models.TextField(blank=True, null=True)

    examens_complementaires = models.TextField(blank=True, null=True)
    resultat_examen = models.TextField(blank=True, null=True)

    aptitude = models.CharField(
        max_length=30,
        choices=[
            ("APTE", "Apte"),
            ("APTE_AVEC_CONDITION", "Apte avec condition"),
            ("INAPTE_POSTE", "Inapte au poste"),
            ("INAPTE_DEFINITIF", "Inapte définitif"),
        ],
        blank=True,
        null=True,
    )

    precision_aptitude = models.TextField(blank=True, null=True)
    conclusion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Examen initial {self.dossier.collaborateur.matricule}"


# =====================================================
# EXAMENS ULTERIEURS
# =====================================================

class ExamenUlterieur(models.Model):
    dossier = models.ForeignKey(
        DossierMedical,
        on_delete=models.CASCADE,
        related_name="examens_ulterieurs"
    )

    type_examen = models.CharField(
        max_length=50,
        choices=[
            ("PERIODIQUE", "Périodique"),
            ("REPRISE", "Reprise de travail"),
            ("SPONTANE", "Spontané"),
        ]
    )

    date = models.DateField()
    medecin_nom = models.CharField(max_length=255)
    poste_travail = models.CharField(max_length=255, blank=True, null=True)

    poids = models.FloatField(null=True, blank=True)
    taille = models.FloatField(null=True, blank=True)

    conclusion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Examen {self.date}"


# =====================================================
# POSTE DE TRAVAIL
# =====================================================

class PosteTravail(models.Model):
    dossier = models.ForeignKey(
        DossierMedical,
        on_delete=models.CASCADE,
        related_name="postes"
    )

    date_debut = models.DateField()
    date_fin = models.DateField(null=True, blank=True)

    description = models.CharField(max_length=255)
    risque_professionnel = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.description


# =====================================================
# INCIDENT INFIRMIER
# =====================================================

class IncidentInfirmier(models.Model):
    dossier = models.ForeignKey(
        DossierMedical,
        on_delete=models.CASCADE,
        related_name="incidents_infirmiers"
    )

    date_incident = models.DateField()
    heure_incident = models.TimeField()

    segment = models.CharField(max_length=120, blank=True, null=True)
    unite = models.CharField(max_length=50, blank=True, null=True)

    poste_occupe = models.CharField(max_length=255, blank=True, null=True)
    mode_lesion = models.CharField(max_length=255)
    agent_causal = models.CharField(max_length=255)

    telephone = models.CharField(max_length=30, blank=True, null=True)
    infirmier_responsable = models.CharField(max_length=255, blank=True, null=True)

    remarque = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Incident {self.date_incident} - {self.dossier.collaborateur.matricule}"


# =====================================================
# INCIDENT AVEC BON / SANS BON
# =====================================================

class IncidentAvecBon(models.Model):
    date_bon = models.DateField()
    matricule = models.CharField(max_length=50, blank=True, null=True)
    nom_prenom = models.CharField(max_length=255, blank=True, null=True)
    telephone = models.CharField(max_length=30, blank=True, null=True)
    numero_assurance = models.CharField(max_length=100, blank=True, null=True)
    date_incident = models.DateField()
    destination = models.CharField(max_length=255, blank=True, null=True)
    infirmier = models.CharField(max_length=120, blank=True, null=True)
    cause = models.CharField(max_length=255, blank=True, null=True)
    lesion = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Incident avec bon {self.date_incident} - {self.matricule or '-'}"


class IncidentSansBon(models.Model):
    heure = models.TimeField(blank=True, null=True)
    matricule = models.CharField(max_length=50, blank=True, null=True)
    segment = models.CharField(max_length=120, blank=True, null=True)
    plant = models.CharField(max_length=50, blank=True, null=True)
    nom_prenom = models.CharField(max_length=255, blank=True, null=True)
    poste = models.CharField(max_length=255, blank=True, null=True)
    mode_lesion = models.CharField(max_length=255, blank=True, null=True)
    agent_causal = models.CharField(max_length=255, blank=True, null=True)
    telephone = models.CharField(max_length=30, blank=True, null=True)
    infirmier = models.CharField(max_length=120, blank=True, null=True)
    remarque = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Incident sans bon {self.matricule or '-'}"


# =====================================================
# ACCIDENT DE TRAVAIL
# =====================================================

class AccidentTravail(models.Model):
    GRAVITE_CHOICES = [
        ("FAIBLE", "Faible"),
        ("MOYENNE", "Moyenne"),
        ("GRAVE", "Grave"),
    ]

    STATUT_ENQUETE_CHOICES = [
        ("EN_ATTENTE", "En attente"),
        ("EN_COURS", "En cours"),
        ("TERMINEE", "Terminée"),
    ]
    STATUT_DECLARATION_CHOICES = [
        ("BROUILLON", "Brouillon"),
        ("DECLAREE", "Déclarée"),
        ("GENEREE", "Générée"),
    ]


    dossier = models.ForeignKey(
        DossierMedical,
        on_delete=models.CASCADE,
        related_name="accidents"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="accidents_travail_crees",
    )

    # Employeur (formulaire officiel)
    employeur_cnss = models.CharField(max_length=100, blank=True, null=True)
    employeur_nom = models.CharField(max_length=255, blank=True, null=True)
    employeur_adresse = models.CharField(max_length=255, blank=True, null=True)
    employeur_code_postal = models.CharField(max_length=20, blank=True, null=True)
    employeur_telephone = models.CharField(max_length=50, blank=True, null=True)
    employeur_activite = models.CharField(max_length=255, blank=True, null=True)

    # Victime
    victime_cnss = models.CharField(max_length=100, blank=True, null=True)
    victime_nom = models.CharField(max_length=120, blank=True, null=True)
    victime_prenom = models.CharField(max_length=120, blank=True, null=True)
    victime_nom_naissance = models.CharField(max_length=120, blank=True, null=True)
    victime_prenom_pere = models.CharField(max_length=120, blank=True, null=True)
    victime_nationalite = models.CharField(max_length=120, blank=True, null=True)
    victime_sexe = models.CharField(
        max_length=10,
        choices=[("HOMME", "Homme"), ("FEMME", "Femme")],
        blank=True,
        null=True,
    )
    victime_date_naissance = models.DateField(blank=True, null=True)
    victime_lieu_naissance = models.CharField(max_length=255, blank=True, null=True)
    victime_cin = models.CharField(max_length=50, blank=True, null=True)
    victime_adresse = models.CharField(max_length=255, blank=True, null=True)
    victime_code_postal = models.CharField(max_length=20, blank=True, null=True)
    victime_date_embauche = models.DateField(blank=True, null=True)
    victime_specialite = models.CharField(max_length=255, blank=True, null=True)
    victime_situation = models.CharField(max_length=255, blank=True, null=True)
    victime_profession = models.CharField(max_length=255, blank=True, null=True)
    victime_poste_accident = models.CharField(max_length=255, blank=True, null=True)
    victime_lieu_travail = models.CharField(max_length=255, blank=True, null=True)
    victime_salaire = models.CharField(max_length=100, blank=True, null=True)
    autres_victimes = models.BooleanField(default=False)

    # Accident
    date_accident = models.DateField()
    heure_accident = models.TimeField(blank=True, null=True)
    lieu_accident = models.CharField(max_length=255, blank=True, null=True)
    circonstances = models.TextField(blank=True, null=True)
    horaire_travail_debut = models.TimeField(blank=True, null=True)
    horaire_travail_fin = models.TimeField(blank=True, null=True)
    activite_lieu = models.CharField(
        max_length=30,
        choices=[
            ("CHANTIER", "Chantier"),
            ("ATELIER", "Atelier"),
            ("BUREAU", "Bureau"),
            ("AUTRE", "Autre"),
        ],
        blank=True,
        null=True,
    )
    activite_lieu_autre = models.CharField(max_length=255, blank=True, null=True)
    activite_service = models.CharField(max_length=255, blank=True, null=True)
    moment_travail = models.CharField(max_length=255, blank=True, null=True)
    nombre_travailleurs = models.PositiveIntegerField(blank=True, null=True)
    description_circonstances = models.TextField(blank=True, null=True)
    causes_materielles = models.TextField(blank=True, null=True)
    comment_accident = models.TextField(blank=True, null=True)

    cause = models.TextField()
    nature_lesion = models.CharField(max_length=255)
    siege_lesion = models.CharField(max_length=255)

    segment = models.CharField(max_length=120, blank=True, null=True)
    gravite = models.CharField(
        max_length=20,
        choices=GRAVITE_CHOICES,
        blank=True,
        null=True,
    )
    statut_enquete = models.CharField(
        max_length=20,
        choices=STATUT_ENQUETE_CHOICES,
        default="EN_ATTENTE",
    )

    transport_hopital = models.CharField(max_length=255, blank=True, null=True)

    temoin1_nom = models.CharField(max_length=255, blank=True, null=True)
    temoin1_telephone = models.CharField(max_length=30, blank=True, null=True)
    temoin1_matricule = models.CharField(max_length=50, blank=True, null=True)

    temoin2_nom = models.CharField(max_length=255, blank=True, null=True)
    temoin2_telephone = models.CharField(max_length=30, blank=True, null=True)
    temoin2_matricule = models.CharField(max_length=50, blank=True, null=True)
    temoins = models.TextField(blank=True, null=True)

    rapport_police = models.BooleanField(default=False)
    rapport_police_numero = models.CharField(max_length=100, blank=True, null=True)
    rapport_police_date = models.DateField(blank=True, null=True)
    rapport_police_poste = models.CharField(max_length=255, blank=True, null=True)

    tiers_responsable = models.BooleanField(default=False)
    tiers_nom = models.CharField(max_length=255, blank=True, null=True)
    tiers_assureur = models.CharField(max_length=255, blank=True, null=True)

    resultat = models.CharField(
        max_length=20,
        choices=[
            ("SANS_ARRET", "Sans arrêt"),
            ("ARRET", "Arrêt de travail"),
            ("DECES", "Décès"),
        ],
        blank=True,
        null=True,
    )
    arret_travail = models.BooleanField(default=False)
    date_arret = models.DateField(blank=True, null=True)
    heure_arret = models.TimeField(blank=True, null=True)
    salaire_maintenu = models.BooleanField(default=False)
    salaire_duree = models.CharField(max_length=100, blank=True, null=True)
    salaire_montant = models.CharField(max_length=100, blank=True, null=True)
    salaire_unite = models.CharField(max_length=50, blank=True, null=True)

    signataire_nom = models.CharField(max_length=255, blank=True, null=True)
    signataire_qualite = models.CharField(max_length=255, blank=True, null=True)
    signature_lieu = models.CharField(max_length=255, blank=True, null=True)
    signature_date = models.DateField(blank=True, null=True)

    duree_arret = models.IntegerField(null=True, blank=True)
    ipp = models.CharField(max_length=100, blank=True, null=True)

    envoye_hsee = models.BooleanField(default=False)
    statut_declaration = models.CharField(
        max_length=20,
        choices=STATUT_DECLARATION_CHOICES,
        default="BROUILLON",
    )
    generated_at = models.DateTimeField(blank=True, null=True)
    printed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Accident {self.date_accident} - {self.dossier.collaborateur.matricule}"


# =====================================================
# PLAN ACTION HSEE
# =====================================================

class PlanActionHSEE(models.Model):
    STATUT_CHOICES = [
        ("PLANIFIE", "Planifié"),
        ("EN_COURS", "En cours"),
        ("TERMINE", "Terminé"),
    ]

    accident = models.ForeignKey(
        AccidentTravail,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="plans_action_hsee"
    )

    zone = models.CharField(max_length=255)
    risque = models.CharField(max_length=255)
    action = models.TextField()
    responsable = models.CharField(max_length=255, blank=True, null=True)
    delai = models.DateField(blank=True, null=True)
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default="PLANIFIE"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.zone} - {self.risque}"


# =====================================================
# MALADIE PROFESSIONNELLE
# =====================================================

class MaladieProfessionnelle(models.Model):
    dossier = models.ForeignKey(
        DossierMedical,
        on_delete=models.CASCADE,
        related_name="maladies_professionnelles"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="maladies_professionnelles_creees",
    )

    nom_maladie = models.CharField(max_length=255)
    agent_causal = models.CharField(max_length=255)
    numero_tableau = models.CharField(max_length=100)
    date_decouverte = models.DateField()
    duree_arret = models.IntegerField(null=True, blank=True)
    ipp = models.CharField(max_length=100, blank=True, null=True)
    # Employeur
    employeur_cnss = models.CharField(max_length=100, blank=True, null=True)
    employeur_nom = models.CharField(max_length=255, blank=True, null=True)
    employeur_adresse = models.CharField(max_length=255, blank=True, null=True)
    employeur_code_postal = models.CharField(max_length=20, blank=True, null=True)
    employeur_telephone = models.CharField(max_length=50, blank=True, null=True)
    employeur_activite = models.CharField(max_length=255, blank=True, null=True)

    # Victime
    victime_cnss = models.CharField(max_length=100, blank=True, null=True)
    victime_nom = models.CharField(max_length=120, blank=True, null=True)
    victime_prenom = models.CharField(max_length=120, blank=True, null=True)
    victime_nom_naissance = models.CharField(max_length=120, blank=True, null=True)
    victime_prenom_pere = models.CharField(max_length=120, blank=True, null=True)
    victime_nationalite = models.CharField(max_length=120, blank=True, null=True)
    victime_sexe = models.CharField(
        max_length=10,
        choices=[("HOMME", "Homme"), ("FEMME", "Femme")],
        blank=True,
        null=True,
    )
    victime_date_naissance = models.DateField(blank=True, null=True)
    victime_lieu_naissance = models.CharField(max_length=255, blank=True, null=True)
    victime_cin = models.CharField(max_length=50, blank=True, null=True)
    victime_adresse = models.CharField(max_length=255, blank=True, null=True)
    victime_code_postal = models.CharField(max_length=20, blank=True, null=True)
    victime_date_embauche = models.DateField(blank=True, null=True)
    victime_specialite = models.CharField(max_length=255, blank=True, null=True)
    victime_situation = models.CharField(max_length=255, blank=True, null=True)
    victime_profession = models.CharField(max_length=255, blank=True, null=True)
    victime_lieu_travail = models.CharField(max_length=255, blank=True, null=True)

    # Maladie professionnelle
    medecin_constat = models.CharField(max_length=255, blank=True, null=True)
    date_constat = models.DateField(blank=True, null=True)
    nature_travail = models.TextField(blank=True, null=True)
    date_debut_exposition = models.DateField(blank=True, null=True)
    date_fin_exposition = models.DateField(blank=True, null=True)
    date_arret_exposition = models.DateField(blank=True, null=True)
    arret_travail = models.BooleanField(default=False)
    date_arret = models.DateField(blank=True, null=True)
    salaire_maintenu = models.BooleanField(default=False)
    salaire_duree = models.CharField(max_length=100, blank=True, null=True)
    salaire_montant = models.CharField(max_length=100, blank=True, null=True)
    salaire_unite = models.CharField(max_length=50, blank=True, null=True)

    travaux_anterieurs = models.JSONField(blank=True, null=True)
    observations = models.TextField(blank=True, null=True)

    signataire_nom = models.CharField(max_length=255, blank=True, null=True)
    signataire_qualite = models.CharField(max_length=255, blank=True, null=True)
    signature_lieu = models.CharField(max_length=255, blank=True, null=True)
    signature_date = models.DateField(blank=True, null=True)
    statut_declaration = models.CharField(
        max_length=20,
        choices=[
            ("BROUILLON", "Brouillon"),
            ("DECLAREE", "Déclarée"),
            ("GENEREE", "Générée"),
        ],
        default="BROUILLON",
    )
    generated_at = models.DateTimeField(blank=True, null=True)
    printed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom_maladie


# =====================================================
# VACCINATION
# =====================================================

class Vaccination(models.Model):
    dossier = models.ForeignKey(
        DossierMedical,
        on_delete=models.CASCADE,
        related_name="vaccinations"
    )

    vaccin = models.CharField(max_length=255)
    date_1 = models.DateField(null=True, blank=True)
    date_2 = models.DateField(null=True, blank=True)
    date_3 = models.DateField(null=True, blank=True)
    date_rappel = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.vaccin


# =====================================================
# FICHE MEDICALE
# =====================================================

class FicheMedicale(models.Model):
    collaborateur = models.OneToOneField(
        Collaborateur,
        on_delete=models.CASCADE,
        related_name="fiche_medicale"
    )

    date_naissance = models.DateField(null=True, blank=True)
    lieu_naissance = models.CharField(max_length=120, null=True, blank=True)
    adresse = models.CharField(max_length=255, null=True, blank=True)
    telephone = models.CharField(max_length=30, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Fiche {self.collaborateur.matricule}"


# =====================================================
# DOCUMENTS MEDICAUX
# =====================================================

class Ordonnance(models.Model):
    collaborateur = models.ForeignKey(
        Collaborateur,
        on_delete=models.CASCADE,
        related_name="ordonnances"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ordonnances_crees"
    )

    date = models.DateField(auto_now_add=True)
    contenu = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ordonnance {self.collaborateur.matricule} - {self.date}"


class CertificatMedical(models.Model):
    collaborateur = models.ForeignKey(
        Collaborateur,
        on_delete=models.CASCADE,
        related_name="certificats"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="certificats_crees"
    )

    date = models.DateField(auto_now_add=True)
    nb_jours_repos = models.PositiveIntegerField(default=0)
    date_debut_repos = models.DateField(null=True, blank=True)
    contenu = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Certificat {self.collaborateur.matricule} - {self.date}"


# =====================================================
# FICHE APTITUDE
# =====================================================

class FicheAptitude(models.Model):
    TYPE_EXAMEN_CHOICES = [
        ("EMBAUCHE", "Embauche"),
        ("PERIODIQUE", "Périodique"),
        ("REPRISE", "Reprise"),
        ("SPONTANE", "Spontané"),
    ]

    APTITUDE_CHOICES = [
        ("APTE", "Apte"),
        ("APTE_AMENAGEMENT", "Apte avec aménagement"),
        ("INAPTE_TEMPORAIRE", "Inapte temporaire"),
        ("APTE_APRES_CHANGEMENT", "Apte après changement du poste"),
        ("INAPTE_DEFINITIF", "Inapte définitif"),
    ]

    collaborateur = models.ForeignKey(
        Collaborateur,
        on_delete=models.CASCADE,
        related_name="fiches_aptitude"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="fiches_aptitude_creees"
    )

    entreprise = models.CharField(max_length=255, blank=True, null=True)
    adresse_entreprise = models.CharField(max_length=255, blank=True, null=True)
    nature_activite = models.CharField(max_length=255, blank=True, null=True)
    numero_cnss = models.CharField(max_length=100, blank=True, null=True)

    nom_prenom = models.CharField(max_length=255, blank=True, null=True)
    date_lieu_naissance = models.CharField(max_length=255, blank=True, null=True)
    adresse_travailleur = models.CharField(max_length=255, blank=True, null=True)
    cnss_travailleur = models.CharField(max_length=100, blank=True, null=True)
    qualifications_professionnelles = models.CharField(max_length=255, blank=True, null=True)

    date_recrutement = models.DateField(null=True, blank=True)
    poste_travail = models.CharField(max_length=255, blank=True, null=True)

    type_examen = models.CharField(max_length=30, choices=TYPE_EXAMEN_CHOICES)
    aptitude = models.CharField(max_length=40, choices=APTITUDE_CHOICES)
    recommandations = models.TextField(blank=True, null=True)

    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Fiche aptitude {self.collaborateur.matricule} - {self.date}"


# =====================================================
# DEMANDE EXAMEN LABO
# =====================================================

class DemandeExamenLabo(models.Model):
    collaborateur = models.ForeignKey(
        Collaborateur,
        on_delete=models.CASCADE,
        related_name="demandes_examens_labo"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="demandes_examens_labo_creees"
    )

    nom_prenom = models.CharField(max_length=255, blank=True, null=True)
    age = models.CharField(max_length=50, blank=True, null=True)
    cin = models.CharField(max_length=50, blank=True, null=True)
    gsm = models.CharField(max_length=50, blank=True, null=True)
    entreprise = models.CharField(max_length=255, blank=True, null=True)
    poste_travail = models.CharField(max_length=255, blank=True, null=True)
    renseignements_cliniques = models.TextField(blank=True, null=True)

    glycemie = models.BooleanField(default=False)
    creatinine = models.BooleanField(default=False)
    nfs = models.BooleanField(default=False)
    vs = models.BooleanField(default=False)
    transaminases = models.BooleanField(default=False)
    acide_urique = models.BooleanField(default=False)
    triglycerides = models.BooleanField(default=False)
    cholesterol = models.BooleanField(default=False)
    examen_selles = models.BooleanField(default=False)

    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Demande labo {self.collaborateur.matricule} - {self.date}"


# =====================================================
# EXAMEN COMPLEMENTAIRE
# =====================================================

class ExamenComplementaire(models.Model):
    collaborateur = models.ForeignKey(
        Collaborateur,
        on_delete=models.CASCADE,
        related_name="examens_complementaires"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="examens_complementaires_crees"
    )

    nom_prenom = models.CharField(max_length=255, blank=True, null=True)
    age = models.CharField(max_length=50, blank=True, null=True)
    cin = models.CharField(max_length=50, blank=True, null=True)
    poste_travail = models.CharField(max_length=255, blank=True, null=True)
    entreprise = models.CharField(max_length=255, blank=True, null=True)
    renseignements_cliniques = models.TextField(blank=True, null=True)

    visiotest = models.BooleanField(default=False)
    audiogramme = models.BooleanField(default=False)
    ecg = models.BooleanField(default=False)
    efr = models.BooleanField(default=False)

    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Examen complémentaire {self.collaborateur.matricule} - {self.date}"


# =====================================================
# STOCK INFIRMERIE
# =====================================================

class StockItem(models.Model):
    TYPE_CHOICES = [
        ("MEDICAMENT", "Médicament"),
        ("CONSOMMABLE", "Consommable"),
    ]

    nom = models.CharField(max_length=150)
    libelle = models.CharField(max_length=255, blank=True, null=True)
    forme = models.CharField(max_length=100, blank=True, null=True)
    dosage = models.CharField(max_length=100, blank=True, null=True)
    type_article = models.CharField(max_length=20, choices=TYPE_CHOICES)
    categorie = models.CharField(max_length=120, blank=True, null=True)
    quantite = models.PositiveIntegerField(default=0)
    seuil_critique = models.PositiveIntegerField(default=0)
    unite = models.CharField(max_length=50, default="unité")
    date_expiration = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nom} ({self.quantite})"


class StockMovement(models.Model):
    TYPE_MOVEMENT = [
        ("ENTREE", "Entrée"),
        ("SORTIE", "Sortie"),
    ]

    stock_item = models.ForeignKey(
        StockItem,
        on_delete=models.CASCADE,
        related_name="movements"
    )

    type_mouvement = models.CharField(max_length=10, choices=TYPE_MOVEMENT)
    quantite = models.PositiveIntegerField()
    remarque = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.stock_item.nom} - {self.type_mouvement}"


# =====================================================
# TRANSPORT - BON CHAUFFEUR
# =====================================================

class BonChauffeur(models.Model):
    numero_ordre = models.PositiveIntegerField(unique=True, null=True, blank=True)
    nom_chauffeur = models.CharField(max_length=255)
    date = models.DateField()
    heure = models.TimeField()
    medecin = models.CharField(max_length=255, blank=True, null=True)
    infirmier = models.CharField(max_length=255, blank=True, null=True)
    nom_malade = models.CharField(max_length=255)
    matricule = models.CharField(max_length=50, blank=True, null=True)
    telephone = models.CharField(max_length=30, blank=True, null=True)
    motif = models.TextField(blank=True, null=True)
    service_plant = models.CharField(max_length=255, blank=True, null=True)
    moyen_transport = models.CharField(max_length=255, blank=True, null=True)
    hopital = models.CharField(max_length=255, blank=True, null=True)
    accompagnant = models.CharField(max_length=255, blank=True, null=True)
    montant_prime = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.numero_ordre is None:
            last = BonChauffeur.objects.order_by("-numero_ordre").first()
            self.numero_ordre = (last.numero_ordre + 1) if last and last.numero_ordre else 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Bon Chauffeur {self.numero_ordre}"


class SuiviTransfertUrgence(models.Model):
    date = models.DateField()
    heure = models.TimeField()
    chauffeur = models.CharField(max_length=255)
    depart = models.CharField(max_length=255, blank=True, null=True)
    destination = models.CharField(max_length=255, blank=True, null=True)
    ordre_transport = models.CharField(max_length=50, blank=True, null=True)
    plant = models.CharField(max_length=120, blank=True, null=True)
    indemnite_deplacement = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cost_center = models.CharField(max_length=120, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transfert {self.date} {self.heure}"
