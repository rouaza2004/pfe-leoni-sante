from django.contrib.auth.models import AbstractUser
from django.db import models


class Site(models.Model):
    nom = models.CharField(max_length=100)
    localite = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.nom} - {self.localite}"


class User(AbstractUser):
    ROLE_CHOICES = [
        ("ADMIN", "Admin"),
        ("INFIRMIER", "Infirmier"),
        ("MEDECIN_TRAVAIL", "Médecin du travail"),
        ("MEDECIN_TRAITANT", "Médecin traitant"),
        ("MEDECIN_CONTROLEUR", "Médecin contrôleur"),
        ("RESPONSABLE_RH", "Responsable RH"),
        ("AGENT_HSEE", "Agent HSEE"),
    ]

    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="INFIRMIER")
    nom_ar = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Collaborateur(models.Model):
    matricule = models.CharField(max_length=50, unique=True)
    nom = models.CharField(max_length=120)
    prenom = models.CharField(max_length=120)
    email = models.EmailField(blank=True, null=True)

    cin = models.CharField(max_length=50, blank=True, null=True)
    date_naissance = models.DateField(blank=True, null=True)
    telephone = models.CharField(max_length=30, blank=True, null=True)
    adresse = models.CharField(max_length=255, blank=True, null=True)
    poste = models.CharField(max_length=150, blank=True, null=True)
    departement = models.CharField(max_length=150, blank=True, null=True)

    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    site = models.ForeignKey(
        Site,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="collaborateurs",
        default=1,
    )

    def __str__(self):
        return f"{self.matricule} - {self.nom} {self.prenom}"
