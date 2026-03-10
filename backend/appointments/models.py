from django.db import models
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

    type_medecin = models.CharField(max_length=20, choices=TYPE_MEDECIN)
    date = models.DateField()
    heure = models.TimeField()
    motif = models.TextField(blank=True)
    statut = models.CharField(max_length=20, choices=STATUT, default="PREVU")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.collaborateur} - {self.date} {self.heure}"