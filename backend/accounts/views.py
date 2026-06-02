import logging

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from django.db.models import Case, When, Value, IntegerField

from .services.email_service import send_new_user_credentials_email
from .models import Collaborateur, Site, User
from .permissions import CanViewCollaborateurList
from .serializers import (
    CollaborateurSerializer,
    MyTokenObtainPairSerializer,
    SiteSerializer,
    UserAdminSerializer,
    UserMedecinSerializer,
    UserPasswordChangeSerializer,
    UserProfileSerializer,
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


logger = logging.getLogger(__name__)


ADMIN_USER_MANAGER_ROLES = {"ADMIN", "RESPONSABLE_RH"}


def _has_user_admin_access(user):
    return ((getattr(user, "role", "") or "").strip().upper() in ADMIN_USER_MANAGER_ROLES)


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


class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserPasswordChangeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UserPasswordChangeSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Mot de passe mis a jour avec succes."})


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


class AdminUserListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _has_user_admin_access(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        queryset = User.objects.select_related("site").all().order_by("-date_joined", "username")
        serializer = UserAdminSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not _has_user_admin_access(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = UserAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        generated_password = getattr(user, "_generated_password", "")
        email_sent = True
        warning = ""

        try:
            send_new_user_credentials_email(user, generated_password)
        except Exception as exc:  # pragma: no cover
            email_sent = False
            warning = "Utilisateur créé, mais l'email n'a pas pu être envoyé."
            logger.exception("Impossible d'envoyer l'email de création utilisateur %s", user.pk)

        response_data = UserAdminSerializer(user).data
        response_data["email_sent"] = email_sent
        if warning:
            response_data["warning"] = warning
            response_data["temporary_password"] = generated_password

        return Response(response_data, status=status.HTTP_201_CREATED)


class AdminUserDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(User.objects.select_related("site"), pk=pk)

    def get(self, request, pk):
        if not _has_user_admin_access(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = UserAdminSerializer(self.get_object(pk))
        return Response(serializer.data)

    def patch(self, request, pk):
        if not _has_user_admin_access(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object(pk)
        serializer = UserAdminSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        if not _has_user_admin_access(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object(pk)
        if user.pk == request.user.pk:
            return Response(
                {"detail": "Vous ne pouvez pas supprimer votre propre compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
