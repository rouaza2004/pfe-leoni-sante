from rest_framework import serializers
from .models import (
    DossierMedical,
    FicheMedicale,
    Ordonnance,
    CertificatMedical,
)


class OrdonnanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ordonnance
        fields = "__all__"


class CertificatMedicalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificatMedical
        fields = "__all__"


class FicheMedicaleSerializer(serializers.ModelSerializer):
    ordonnances = OrdonnanceSerializer(many=True, read_only=True)
    certificats = CertificatMedicalSerializer(many=True, read_only=True)

    class Meta:
        model = FicheMedicale
        fields = "__all__"


class DossierMedicalSerializer(serializers.ModelSerializer):
    fiches = FicheMedicaleSerializer(many=True, read_only=True)

    class Meta:
        model = DossierMedical
        fields = "__all__"