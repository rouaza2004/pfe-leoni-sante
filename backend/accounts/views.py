from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from django.db.models import Case, When, Value, IntegerField

from .models import Collaborateur, Site, User
from .permissions import CanViewCollaborateurList
from .serializers import (
    CollaborateurSerializer,
    MyTokenObtainPairSerializer,
    SiteSerializer,
    UserMedecinSerializer,
)
from .permissions_map import ROLE_PERMISSIONS
from medical.models import (
    DossierMedical,
    AccidentTravail,
    MaladieProfessionnelle,
    IncidentInfirmier,
    Vaccination,
    Ordonnance,
    CertificatMedical,
    FicheAptitude,
    DemandeExamenLabo,
    ExamenComplementaire,
)

from medical.serializers import (
    DossierMedicalSerializer,
    AccidentTravailSerializer,
    MaladieProfessionnelleSerializer,
    IncidentInfirmierSerializer,
    VaccinationSerializer,
    OrdonnanceSerializer,
    CertificatMedicalSerializer,
    FicheAptitudeSerializer,
    DemandeExamenLaboSerializer,
    ExamenComplementaireSerializer,
)
class CollaborateurProfilAPIView(APIView):
    permission_classes = [IsAuthenticated, CanViewCollaborateurList]

    def get(self, request, matricule):
        collab = get_object_or_404(Collaborateur, matricule=matricule)

        dossier = DossierMedical.objects.filter(collaborateur=collab).first()

        accidents = AccidentTravail.objects.filter(
            dossier__collaborateur=collab
        ).order_by("-date_accident", "-id")

        maladies = MaladieProfessionnelle.objects.filter(
            dossier__collaborateur=collab
        ).order_by("-date_decouverte", "-id")

        incidents = IncidentInfirmier.objects.filter(
            dossier__collaborateur=collab
        ).order_by("-date_incident", "-heure_incident", "-id")

        vaccinations = Vaccination.objects.filter(
            dossier__collaborateur=collab
        ).order_by("-id")

        ordonnances = Ordonnance.objects.filter(
            collaborateur=collab
        ).order_by("-date", "-id")

        certificats = CertificatMedical.objects.filter(
            collaborateur=collab
        ).order_by("-date", "-id")

        fiches_aptitude = FicheAptitude.objects.filter(
            collaborateur=collab
        ).order_by("-date", "-id")

        demandes_labo = DemandeExamenLabo.objects.filter(
            collaborateur=collab
        ).order_by("-date", "-id")

        examens_complementaires = ExamenComplementaire.objects.filter(
            collaborateur=collab
        ).order_by("-date", "-id")

        data = {
            "collaborateur": CollaborateurSerializer(collab).data,
            "dossier_medical": DossierMedicalSerializer(dossier).data if dossier else None,
            "accidents": AccidentTravailSerializer(accidents, many=True).data,
            "maladies_professionnelles": MaladieProfessionnelleSerializer(maladies, many=True).data,
            "incidents_infirmiers": IncidentInfirmierSerializer(incidents, many=True).data,
            "vaccinations": VaccinationSerializer(vaccinations, many=True).data,
            "ordonnances": OrdonnanceSerializer(ordonnances, many=True).data,
            "certificats": CertificatMedicalSerializer(certificats, many=True).data,
            "fiches_aptitude": FicheAptitudeSerializer(fiches_aptitude, many=True).data,
            "demandes_labo": DemandeExamenLaboSerializer(demandes_labo, many=True).data,
            "examens_complementaires": ExamenComplementaireSerializer(examens_complementaires, many=True).data,
        }

        return Response(data)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        role = getattr(u, "role", "") or ""
        permissions = ROLE_PERMISSIONS.get((role or "").upper(), [])

        return Response(
            {
                "id": str(u.id),
                "username": u.username,
                "role": role,
                "permissions": permissions,
            }
        )


class CollaborateurListAPIView(generics.ListAPIView):
    queryset = Collaborateur.objects.select_related("site").all().order_by("nom", "prenom")
    serializer_class = CollaborateurSerializer
    permission_classes = [IsAuthenticated, CanViewCollaborateurList]

    filter_backends = [SearchFilter]
    search_fields = ["nom", "prenom", "matricule", "email"]

    def get_queryset(self):
        queryset = super().get_queryset()
        site = (self.request.query_params.get("site") or "").strip()
        if site and site.lower() not in {"all", "tous", "tous les sites"}:
            queryset = queryset.filter(site__nom__iexact=site)
        return queryset


class CollaborateurDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, CanViewCollaborateurList]

    def get(self, request, pk):
        collab = get_object_or_404(Collaborateur.objects.select_related("site"), pk=pk)
        return Response(CollaborateurSerializer(collab).data)

    def patch(self, request, pk):
        collab = get_object_or_404(Collaborateur.objects.select_related("site"), pk=pk)
        serializer = CollaborateurSerializer(collab, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class SiteListAPIView(generics.ListAPIView):
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated]
    queryset = Site.objects.annotate(
        display_order=Case(
            When(nom__iexact="Menzel Hayet", then=Value(1)),
            When(nom__iexact="Messadine", then=Value(2)),
            When(nom__iexact="Mateur 1", then=Value(3)),
            When(nom__iexact="Mateur 2", then=Value(4)),
            default=Value(99),
            output_field=IntegerField(),
        )
    ).order_by("display_order", "nom", "localite")


class RHKpiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        role = getattr(u, "role", "") or ""

        if (role or "").upper() not in ["ADMIN", "RESPONSABLE_RH"]:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        data = {
            "total_collaborateurs": 0,
            "visites_ce_mois": 0,
            "analyses_en_retard": 0,
            "aptitudes": {"apte": 0, "inapte": 0},
        }
        return Response(data)


class MedecinListAPIView(generics.ListAPIView):
    serializer_class = UserMedecinSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(
            role__in=["MEDECIN_TRAITANT", "MEDECIN_TRAVAIL", "MEDECIN_CONTROLEUR"]
        ).order_by("first_name", "last_name", "username")
