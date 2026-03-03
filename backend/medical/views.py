from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from accounts.models import Collaborateur
from .models import DossierMedical, FicheMedicale, Ordonnance, CertificatMedical
from .serializers import (
    DossierMedicalSerializer,
    FicheMedicaleSerializer,
    OrdonnanceSerializer,
    CertificatMedicalSerializer,
)

# ملاحظة: توا نخليهم IsAuthenticated فقط باش نخدمو الAPI
# وبعد نربطهم بالpermissions متاع roles


class DossierByCollaborateurView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, collaborateur_id):
        dossier = DossierMedical.objects.filter(collaborateur_id=collaborateur_id).first()

        if dossier is None:
            collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)
            dossier = DossierMedical.objects.create(collaborateur=collaborateur)

        return Response(DossierMedicalSerializer(dossier).data)


class CreateFicheMedicaleView(generics.CreateAPIView):
    serializer_class = FicheMedicaleSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CreateOrdonnanceView(generics.CreateAPIView):
    serializer_class = OrdonnanceSerializer
    permission_classes = [IsAuthenticated]


class CreateCertificatView(generics.CreateAPIView):
    serializer_class = CertificatMedicalSerializer
    permission_classes = [IsAuthenticated]