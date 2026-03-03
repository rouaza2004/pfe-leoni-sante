from django.contrib.auth.models import AbstractUser
from django.db import models


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


class Collaborateur(models.Model):
    matricule = models.CharField(max_length=50, unique=True)
    nom = models.CharField(max_length=120)
    prenom = models.CharField(max_length=120)
    email = models.EmailField(blank=True, null=True)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.matricule} - {self.nom} {self.prenom}"