from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentListCreateAPIView(generics.ListCreateAPIView):
    queryset = Appointment.objects.all().order_by("-date", "-heure")
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]


class AppointmentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]