from rest_framework import serializers
from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.CharField(source="collaborateur.nom", read_only=True)
    collaborateur_prenom = serializers.CharField(source="collaborateur.prenom", read_only=True)
    matricule = serializers.CharField(source="collaborateur.matricule", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "collaborateur",
            "collaborateur_nom",
            "collaborateur_prenom",
            "matricule",
            "type_medecin",
            "date",
            "heure",
            "motif",
            "statut",
            "created_at",
        ]