import logging
from datetime import timedelta

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from django.db.models import Case, Count, IntegerField, Value, When
from django.utils import timezone

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
from appointments.models import Appointment

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

    @staticmethod
    def _collaborateur_label(collaborateur):
        if not collaborateur:
            return "Collaborateur non renseigné"
        return f"{collaborateur.prenom or ''} {collaborateur.nom or ''}".strip() or collaborateur.matricule

    @classmethod
    def _appointment_payload(cls, appointment):
        collab = getattr(appointment, "collaborateur", None)
        status_labels = {
            "PREVU": "Planifié",
            "REPORTE": "Reporté",
            "TERMINE": "Réalisé",
            "ANNULE": "Annulé",
        }
        return {
            "id": appointment.id,
            "collaborateur_nom": cls._collaborateur_label(collab),
            "matricule": getattr(collab, "matricule", "") or "N/A",
            "type_visite": appointment.motif or appointment.type_medecin or "Visite médicale",
            "date": appointment.date,
            "heure": appointment.heure,
            "statut": appointment.statut or "PREVU",
            "statut_label": status_labels.get(appointment.statut, appointment.statut or "Planifié"),
        }

    @classmethod
    def _collaborator_payload(cls, collaborateur, status="pending", status_label="En attente"):
        return {
            "id": collaborateur.id,
            "matricule": collaborateur.matricule or "N/A",
            "collaborateur_nom": cls._collaborateur_label(collaborateur),
            "departement": collaborateur.departement or "Non défini",
            "poste": collaborateur.poste or "Non défini",
            "site": getattr(getattr(collaborateur, "site", None), "nom", "") or "Non défini",
            "date_import": collaborateur.created_at.date() if collaborateur.created_at else None,
            "statut": status,
            "statut_label": status_label,
        }

    @classmethod
    def _sick_leave_payload(cls, cert, today):
        start_date = cert.date_debut_repos
        expected_end_date = cls._rest_end_date(cert)
        status = "active" if start_date and expected_end_date and start_date <= today <= expected_end_date else "scheduled"
        return {
            "id": cert.id,
            "collaborateur_nom": cls._collaborateur_label(cert.collaborateur),
            "matricule": getattr(cert.collaborateur, "matricule", "") or "N/A",
            "departement": getattr(cert.collaborateur, "departement", "") or "Non défini",
            "date_debut": start_date,
            "date_fin_prevue": expected_end_date,
            "statut": status,
            "statut_label": "En cours" if status == "active" else "Planifié",
        }

    @staticmethod
    def _rest_end_date(cert):
        if not cert.date_debut_repos or not cert.nb_jours_repos:
            return None
        return cert.date_debut_repos + timedelta(days=max(cert.nb_jours_repos - 1, 0))

    @staticmethod
    def _status_tone(status):
        return {
            "pending": "warning",
            "sent_to_infirmary": "info",
            "validated": "success",
            "active": "warning",
            "scheduled": "info",
            "overdue": "danger",
        }.get(status, "info")

    def get(self, request):
        u = request.user
        role = getattr(u, "role", "") or ""

        if (role or "").upper() not in ["ADMIN", "RESPONSABLE_RH"]:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.localdate()
        month_start = today.replace(day=1)
        week_end = today + timedelta(days=7)

        collaborateurs = Collaborateur.objects.select_related("site").all()
        active_collaborateurs = collaborateurs.filter(actif=True)
        active_collaborator_count = active_collaborateurs.count()

        new_operators_qs = active_collaborateurs.filter(created_at__date__gte=month_start, created_at__date__lte=today)

        appointment_base = Appointment.objects.select_related("collaborateur").filter(collaborateur__actif=True)
        upcoming_appointments = appointment_base.filter(
            date__gte=today,
            statut__in=["PREVU", "REPORTE"],
        ).order_by("date", "heure", "id")
        overdue_appointments = appointment_base.filter(
            date__lt=today,
            statut__in=["PREVU", "REPORTE"],
        ).order_by("date", "heure", "id")

        sick_leave_candidates = CertificatMedical.objects.select_related("collaborateur").filter(
            collaborateur__actif=True,
            nb_jours_repos__gt=0,
            date_debut_repos__isnull=False,
        ).order_by("date_debut_repos", "id")
        active_sick_leaves = []
        returns_this_week = []
        for cert in sick_leave_candidates:
            end_date = self._rest_end_date(cert)
            if not end_date:
                continue
            if cert.date_debut_repos <= today <= end_date:
                active_sick_leaves.append(cert)
            if today <= end_date <= week_end:
                returns_this_week.append(cert)

        collaborator_ids_with_appointments = set(
            Appointment.objects.filter(collaborateur__in=new_operators_qs).values_list("collaborateur_id", flat=True)
        )
        collaborator_ids_with_dossiers = set(
            DossierMedical.objects.filter(collaborateur__in=new_operators_qs).values_list("collaborateur_id", flat=True)
        )

        new_operator_rows = []
        for collaborateur in new_operators_qs.order_by("-created_at", "nom", "prenom"):
            if collaborateur.id in collaborator_ids_with_dossiers:
                status_key = "validated"
                status_label = "Validé"
            elif collaborateur.id in collaborator_ids_with_appointments:
                status_key = "sent_to_infirmary"
                status_label = "Envoyé à l'infirmerie"
            else:
                status_key = "pending"
                status_label = "En attente"
            row = self._collaborator_payload(collaborateur, status_key, status_label)
            row["tone"] = self._status_tone(status_key)
            new_operator_rows.append(row)

        collaborators_by_site = (
            active_collaborateurs.values("site__nom")
            .annotate(
                total=Count("id"),
            )
            .order_by("-total", "site__nom")
        )
        collaborators_by_department = (
            active_collaborateurs.values("departement")
            .annotate(
                total=Count("id"),
            )
            .order_by("-total", "departement")
        )

        absences_by_department = {}
        for cert in active_sick_leaves:
            department = getattr(cert.collaborateur, "departement", "") or "Non défini"
            absences_by_department.setdefault(department, {"department": department, "absences": 0, "retards": 0, "retours": 0})
            absences_by_department[department]["absences"] += 1
        for cert in returns_this_week:
            department = getattr(cert.collaborateur, "departement", "") or "Non défini"
            absences_by_department.setdefault(department, {"department": department, "absences": 0, "retards": 0, "retours": 0})
            absences_by_department[department]["retours"] += 1

        data = {
            "kpis": {
                "total_active_collaborators": active_collaborator_count,
                "new_operators_this_month": len(new_operator_rows),
                "upcoming_medical_visits": upcoming_appointments.count(),
                "overdue_medical_visits": overdue_appointments.count(),
                "active_sick_leaves": len(active_sick_leaves),
                "returns_expected_this_week": len(returns_this_week),
            },
            "upcoming_visits": [self._appointment_payload(item) for item in upcoming_appointments],
            "overdue_visits": [self._appointment_payload(item) for item in overdue_appointments],
            "new_operators": new_operator_rows,
            "active_sick_leaves": [self._sick_leave_payload(item, today) for item in active_sick_leaves],
            "returns_this_week": [self._sick_leave_payload(item, today) for item in returns_this_week],
            "collaborateurs_par_site": [
                {
                    "site": row["site__nom"] or "Non défini",
                    "total": row["total"] or 0,
                }
                for row in collaborators_by_site
            ],
            "collaborateurs_par_departement": [
                {
                    "departement": row["departement"] or "Non défini",
                    "total": row["total"] or 0,
                }
                for row in collaborators_by_department
            ],
            "absences_retards_par_departement": sorted(
                absences_by_department.values(),
                key=lambda item: (-item["absences"], item["department"]),
            ),
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
