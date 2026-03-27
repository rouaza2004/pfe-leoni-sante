from rest_framework import serializers
from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.CharField(source="collaborateur.nom", read_only=True)
    collaborateur_prenom = serializers.CharField(source="collaborateur.prenom", read_only=True)
    matricule = serializers.CharField(source="collaborateur.matricule", read_only=True)
    medecin_nom = serializers.SerializerMethodField()
    medecin_role = serializers.SerializerMethodField()
    medecin_nom_ar = serializers.SerializerMethodField()

    def get_medecin_nom(self, obj):
        if not obj.medecin:
            return ""
        return obj.medecin.get_full_name() or obj.medecin.username or ""

    def get_medecin_role(self, obj):
        return getattr(obj.medecin, "role", "") if obj.medecin else ""

    def get_medecin_nom_ar(self, obj):
        return getattr(obj.medecin, "nom_ar", "") if obj.medecin else ""

    class Meta:
        model = Appointment
        fields = [
            "id",
            "collaborateur",
            "collaborateur_nom",
            "collaborateur_prenom",
            "matricule",
            "medecin",
            "medecin_nom",
            "medecin_role",
            "medecin_nom_ar",
            "type_medecin",
            "date",
            "heure",
            "motif",
            "statut",
            "created_at",
        ]
