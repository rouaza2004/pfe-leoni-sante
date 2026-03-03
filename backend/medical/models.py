from django.db import models
from django.conf import settings
from accounts.models import Collaborateur


# ===============================
# DOSSIER MEDICAL
# ===============================

class DossierMedical(models.Model):
    collaborateur = models.OneToOneField(
        Collaborateur,
        on_delete=models.CASCADE,
        related_name="dossier_medical"
    )
    entreprise = models.CharField(max_length=255, blank=True, null=True)
    localite = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dossier {self.collaborateur.nom}"
        

# ===============================
# EXAMEN MEDICAL INITIAL
# ===============================

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
    tension_arterielle = models.CharField(max_length=50, blank=True, null=True)
    pouls = models.CharField(max_length=50, blank=True, null=True)

    conclusion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Examen initial {self.dossier.collaborateur.nom}"


# ===============================
# EXAMENS ULTERIEURS
# ===============================

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


# ===============================
# POSTES DE TRAVAIL
# ===============================

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


# ===============================
# ACCIDENTS DE TRAVAIL
# ===============================

class AccidentTravail(models.Model):
    dossier = models.ForeignKey(
        DossierMedical,
        on_delete=models.CASCADE,
        related_name="accidents"
    )

    date_accident = models.DateField()
    cause = models.TextField()
    nature_lesion = models.CharField(max_length=255)
    siege_lesion = models.CharField(max_length=255)
    duree_arret = models.IntegerField(null=True, blank=True)
    ipp = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Accident {self.date_accident}"


# ===============================
# MALADIES PROFESSIONNELLES
# ===============================

class MaladieProfessionnelle(models.Model):
    dossier = models.ForeignKey(
        DossierMedical,
        on_delete=models.CASCADE,
        related_name="maladies_professionnelles"
    )

    nom_maladie = models.CharField(max_length=255)
    agent_causal = models.CharField(max_length=255)
    numero_tableau = models.CharField(max_length=100)
    date_decouverte = models.DateField()
    duree_arret = models.IntegerField(null=True, blank=True)
    ipp = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.nom_maladie


# ===============================
# VACCINATIONS
# ===============================

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
    # 1) FICHE (حسب الصورة: معلومات شخصية)
# ==========================
class FicheMedicale(models.Model):
    collaborateur = models.OneToOneField(
        Collaborateur,
        on_delete=models.CASCADE,
        related_name="fiche_medicale"
    )

    # حسب الصورة: Nom, naissance, adresse, tel
    date_naissance = models.DateField(null=True, blank=True)
    lieu_naissance = models.CharField(max_length=120, null=True, blank=True)
    adresse = models.CharField(max_length=255, null=True, blank=True)
    telephone = models.CharField(max_length=30, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Fiche {self.collaborateur.matricule}"


# ==========================
# 2) ORDONNANCE (حسب الصورة)
# ==========================
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
    contenu = models.TextField()  # تكتب medicaments + posologie
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ordonnance {self.collaborateur.matricule} - {self.date}"


# ==========================
# 3) CERTIFICAT (حسب الصورة)
# ==========================
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

    contenu = models.TextField(null=True, blank=True)  # texte libre إذا تحب
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Certificat {self.collaborateur.matricule} - {self.date}"