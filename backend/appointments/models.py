from django.db import models
from django.conf import settings
from accounts.models import Collaborateur


class Appointment(models.Model):
    TYPE_MEDECIN = [
        ("TRAITANT", "Médecin traitant"),
        ("TRAVAIL", "Médecin du travail"),
        ("CONTROLEUR", "Médecin contrôleur"),
    ]

    STATUT = [
        ("PREVU", "Prévu"),
        ("TERMINE", "Terminé"),
        ("REPORTE", "Reporté"),
        ("ANNULE", "Annulé"),
    ]

    collaborateur = models.ForeignKey(
        Collaborateur,
        on_delete=models.CASCADE,
        related_name="rdv"
    )

    medecin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rdv_medecin",
    )

    type_medecin = models.CharField(max_length=20, choices=TYPE_MEDECIN)
    date = models.DateField()
    heure = models.TimeField()
    motif = models.TextField(blank=True)
    statut = models.CharField(max_length=20, choices=STATUT, default="PREVU")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.collaborateur} - {self.date} {self.heure}"
