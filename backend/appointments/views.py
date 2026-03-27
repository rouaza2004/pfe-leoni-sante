from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Appointment
from .serializers import AppointmentSerializer
from notifications.models import Notification


class AppointmentListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Appointment.objects.all().order_by("-date", "-heure")
        user = self.request.user
        role = getattr(user, "role", "") or ""
        if role.upper() in ["MEDECIN_TRAITANT", "MEDECIN_TRAVAIL", "MEDECIN_CONTROLEUR"]:
            return qs.filter(medecin=user)
        return qs

    def perform_create(self, serializer):
        appointment = serializer.save()
        if appointment.medecin:
            collab = appointment.collaborateur
            date_str = appointment.date.strftime("%d/%m/%Y")
            time_str = appointment.heure.strftime("%H:%M")
            Notification.objects.create(
                user=appointment.medecin,
                title="Nouveau rendez-vous",
                message=(
                    f"{collab.prenom} {collab.nom} ({collab.matricule}) - "
                    f"{date_str} {time_str}"
                ),
            )


class AppointmentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
