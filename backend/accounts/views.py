import logging
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from django.db.models import Case, IntegerField, Value, When
from django.http import HttpResponse
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
    ControleMedicalRecord,
)
from appointments.models import Appointment
from medical.services.pdf_services import generate_contre_visite_pdf

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
            "created_at": collaborateur.created_at,
            "statut": status,
            "statut_label": status_label,
        }

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

    @classmethod
    def _document_payload(cls, doc, document_type, source):
        collaborateur = getattr(doc, "collaborateur", None)
        if collaborateur:
            collaborateur_nom = cls._collaborateur_label(collaborateur)
            matricule = getattr(collaborateur, "matricule", "") or "N/A"
        else:
            collaborateur_nom = f"{getattr(doc, 'prenom', '') or ''} {getattr(doc, 'nom', '') or ''}".strip() or "Collaborateur non renseigné"
            matricule = getattr(doc, "matricule", "") or "N/A"

        return {
            "id": f"{doc.__class__.__name__}-{doc.pk}",
            "collaborateur_nom": collaborateur_nom,
            "matricule": matricule,
            "type_document": document_type,
            "date_creation": getattr(doc, "created_at", None) or getattr(doc, "date", None),
            "source": source,
        }

    def get(self, request):
        u = request.user
        role = getattr(u, "role", "") or ""

        if (role or "").upper() not in ["ADMIN", "RESPONSABLE_RH"]:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.localdate()
        month_start = today.replace(day=1)
        active_collaborateurs = Collaborateur.objects.select_related("site").filter(actif=True)

        new_operators_qs = active_collaborateurs.filter(created_at__date__gte=month_start, created_at__date__lte=today)

        appointment_base = Appointment.objects.select_related("collaborateur").filter(collaborateur__actif=True)
        upcoming_controller_appointments = appointment_base.filter(
            type_medecin="CONTROLEUR",
            date__gte=today,
        ).exclude(statut__in=["ANNULE", "TERMINE"]).order_by("date", "heure", "id")

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

        aptitude_forms = FicheAptitude.objects.select_related("collaborateur", "created_by").all()
        work_doctor_certificates = CertificatMedical.objects.select_related("collaborateur", "created_by").filter(
            created_by__role="MEDECIN_TRAVAIL"
        )
        controller_certificates = ControleMedicalRecord.objects.all()

        documents = []
        for fiche in aptitude_forms.order_by("-created_at", "-date", "-id")[:5]:
            documents.append(self._document_payload(fiche, "Fiche d'aptitude", "Médecin du travail"))
        for certificat in work_doctor_certificates.order_by("-created_at", "-date", "-id")[:5]:
            documents.append(self._document_payload(certificat, "Certificat médecin du travail", "Médecin du travail"))
        for controle in controller_certificates.order_by("-created_at", "-date", "-id")[:5]:
            documents.append(self._document_payload(controle, "Certificat médecin contrôleur", "Médecin contrôleur"))

        latest_documents = sorted(
            documents,
            key=lambda item: str(item["date_creation"] or today),
            reverse=True,
        )[:5]
        recent_new_operator_rows = new_operator_rows[:10]
        displayed_controller_appointments = [
            self._appointment_payload(item) for item in upcoming_controller_appointments[:5]
        ]

        data = {
            "kpis": {
                "new_operators_this_month": new_operators_qs.count(),
                "aptitude_forms": aptitude_forms.count(),
                "work_doctor_certificates": work_doctor_certificates.count(),
                "controller_certificates": controller_certificates.count(),
                "upcoming_controller_appointments": upcoming_controller_appointments.count(),
                "hiring_visits_to_schedule": len(
                    [row for row in new_operator_rows if row["statut"] == "pending"]
                ),
            },
            "upcoming_controller_appointments": displayed_controller_appointments,
            "rh_available_documents": latest_documents,
            "new_operators": recent_new_operator_rows,
        }
        return Response(data)


class RHDocumentBaseView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _has_rh_access(user):
        return (getattr(user, "role", "") or "").upper() in ["ADMIN", "RESPONSABLE_RH"]

    @staticmethod
    def _user_label(user):
        if not user:
            return "Non renseigne"
        return user.get_full_name() or user.username or "Non renseigne"

    @staticmethod
    def _collaborateur_label(collaborateur):
        if not collaborateur:
            return "Collaborateur non renseigne"
        return f"{collaborateur.prenom or ''} {collaborateur.nom or ''}".strip() or collaborateur.matricule or "Collaborateur non renseigne"

    @staticmethod
    def _date_value(obj):
        return getattr(obj, "created_at", None) or getattr(obj, "date", None)


class RHMedecineTravailDocumentsView(RHDocumentBaseView):
    def _fiche_payload(self, fiche):
        collaborateur = getattr(fiche, "collaborateur", None)
        return {
            "id": f"fiche-aptitude-{fiche.pk}",
            "record_id": fiche.pk,
            "kind": "fiche_aptitude",
            "collaborateur_nom": self._collaborateur_label(collaborateur),
            "matricule": getattr(collaborateur, "matricule", "") or "N/A",
            "type_document": "Fiche d'aptitude",
            "date_generation": self._date_value(fiche),
            "medecin": getattr(fiche, "medecin_travail", None) or self._user_label(getattr(fiche, "created_by", None)),
            "source": "Medecin du travail",
            "download_url": f"/medical/fiche-aptitude/{fiche.pk}/pdf/",
        }

    def _certificat_payload(self, certificat):
        collaborateur = getattr(certificat, "collaborateur", None)
        return {
            "id": f"certificat-travail-{certificat.pk}",
            "record_id": certificat.pk,
            "kind": "certificat_medical_travail",
            "collaborateur_nom": self._collaborateur_label(collaborateur),
            "matricule": getattr(collaborateur, "matricule", "") or "N/A",
            "type_document": "Certificat medical",
            "date_generation": self._date_value(certificat),
            "medecin": self._user_label(getattr(certificat, "created_by", None)),
            "source": "Medecin du travail",
            "download_url": f"/medical/certificats/{certificat.pk}/pdf/",
        }

    def get(self, request):
        if not self._has_rh_access(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        fiches = FicheAptitude.objects.select_related("collaborateur", "created_by").all()
        certificats = CertificatMedical.objects.select_related("collaborateur", "created_by").filter(
            created_by__role="MEDECIN_TRAVAIL"
        )
        rows = [self._fiche_payload(item) for item in fiches]
        rows.extend(self._certificat_payload(item) for item in certificats)
        rows.sort(key=lambda item: str(item["date_generation"] or ""), reverse=True)
        return Response({"results": rows, "count": len(rows)})


class RHControleurCertificatesView(RHDocumentBaseView):
    def _payload(self, record):
        return {
            "id": f"certificat-controleur-{record.pk}",
            "record_id": record.pk,
            "kind": "certificat_medecin_controleur",
            "collaborateur_nom": f"{record.prenom or ''} {record.nom or ''}".strip() or "Collaborateur non renseigne",
            "matricule": record.matricule or "N/A",
            "type_certificat": "Certificat medecin controleur",
            "type_document": "Certificat medecin controleur",
            "date_generation": self._date_value(record),
            "medecin_controleur": record.medecin_identifiant or self._user_label(getattr(record, "created_by", None)),
            "source": "Medecin controleur",
            "download_url": f"/rh/certificats-controleur/{record.pk}/pdf/",
        }

    def get(self, request):
        if not self._has_rh_access(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        rows = [
            self._payload(record)
            for record in ControleMedicalRecord.objects.select_related("created_by").all().order_by("-created_at", "-date", "-id")
        ]
        return Response({"results": rows, "count": len(rows)})


class RHControleurCertificatePdfView(RHDocumentBaseView):
    def get(self, request, pk):
        if not self._has_rh_access(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        record = get_object_or_404(ControleMedicalRecord, pk=pk)
        response = HttpResponse(generate_contre_visite_pdf(record), content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="controle_medical_{record.pk}.pdf"'
        return response


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
