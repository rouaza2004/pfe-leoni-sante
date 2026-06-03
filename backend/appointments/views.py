from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Collaborateur
from medical.models import CertificatMedical, Ordonnance
from .models import Appointment
from .serializers import AppointmentSerializer
from notifications.models import Notification


class AppointmentListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Appointment.objects.select_related("collaborateur__site", "medecin").all().order_by("-date", "-heure")
        user = self.request.user
        role = getattr(user, "role", "") or ""
        if role.upper() in ["MEDECIN_TRAITANT", "MEDECIN_TRAVAIL", "MEDECIN_CONTROLEUR"]:
            qs = qs.filter(medecin=user)

        site = (self.request.query_params.get("site") or "").strip()
        if site and site.lower() not in {"all", "tous", "tous les sites"}:
            qs = qs.filter(collaborateur__site__nom__iexact=site)

        return qs

    def perform_create(self, serializer):
        appointment = serializer.save()
        if appointment.medecin:
            collab = appointment.collaborateur
            date_str = appointment.date.strftime("%d/%m/%Y")
            time_str = appointment.heure.strftime("%H:%M")
            created_by = self.request.user
            creator_name = created_by.get_full_name() or created_by.username or "un utilisateur"
            creator_role = (getattr(created_by, "role", "") or "").strip().upper()
            creator_label = (
                f"l'infirmier {creator_name}"
                if creator_role == "INFIRMIER"
                else creator_name
            )
            Notification.objects.create(
                user=appointment.medecin,
                title="Nouveau rendez-vous ajoute aujourd'hui",
                message=(
                    f"Nouveau rendez-vous cree par {creator_label}: "
                    f"{collab.prenom} {collab.nom} ({collab.matricule}) - "
                    f"{date_str} {time_str}"
                ),
                type=Notification.TYPE_RENDEZ_VOUS,
                rendez_vous=appointment,
            )


class AppointmentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]


class MedecinTraitantDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        today = timezone.localdate()
        tomorrow = today + timedelta(days=1)
        start_week = today - timedelta(days=today.weekday())
        end_week = start_week + timedelta(days=6)

        base_rdv = Appointment.objects.select_related("collaborateur__site", "medecin").filter(
            medecin=user,
            type_medecin="TRAITANT",
        )
        rdv_today = base_rdv.filter(date=today)

        ordonnances = Ordonnance.objects.filter(created_by=user)
        certificats = CertificatMedical.objects.filter(created_by=user)

        collaborateurs_suivis = Collaborateur.objects.filter(
            Q(rdv__medecin=user, rdv__type_medecin="TRAITANT")
            | Q(ordonnances__created_by=user)
            | Q(certificats__created_by=user)
        ).distinct()

        next_appointments = base_rdv.filter(
            date__range=[today, tomorrow],
            statut__in=["PREVU", "REPORTE"],
        ).order_by("date", "heure", "id")[:5]

        completed_today_count = rdv_today.filter(statut="TERMINE").count()
        remaining_today_count = rdv_today.exclude(statut__in=["TERMINE", "ANNULE"]).count()
        in_consultation_today_count = 0
        total_today_count = rdv_today.count()
        max_daily_capacity = 20

        return Response(
            {
                "rdv_today_count": total_today_count,
                "rdv_week_count": base_rdv.filter(date__range=[start_week, end_week]).count(),
                "collaborateurs_suivis_count": collaborateurs_suivis.count(),
                "documents_generated_count": ordonnances.count() + certificats.count(),
                "daily_capacity": {
                    "completed": completed_today_count,
                    "remaining": remaining_today_count,
                    "in_consultation": in_consultation_today_count,
                    "total": total_today_count,
                    "capacity_max": max_daily_capacity,
                },
                "next_appointments": AppointmentSerializer(next_appointments, many=True).data,
            }
        )
