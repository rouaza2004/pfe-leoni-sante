from django.urls import path
from .views import (
    AppointmentListCreateAPIView,
    AppointmentDetailAPIView,
    MedecinTraitantDashboardAPIView,
)

urlpatterns = [
    path("rdv/", AppointmentListCreateAPIView.as_view(), name="rdv-list-create"),
    path(
        "rdv/medecin-traitant-dashboard/",
        MedecinTraitantDashboardAPIView.as_view(),
        name="medecin-traitant-dashboard",
    ),
    path("rdv/<int:pk>/", AppointmentDetailAPIView.as_view(), name="rdv-detail"),
]
