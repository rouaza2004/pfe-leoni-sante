from django.urls import path
from .views import (
    MyTokenObtainPairView,
    MeView,
    CollaborateurListAPIView,
    CollaborateurDetailAPIView,
    RHKpiView,
)

urlpatterns = [
    # Auth
    path("auth/login/", MyTokenObtainPairView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),

    # Collaborateurs
    path("collaborateurs/", CollaborateurListAPIView.as_view(), name="collaborateurs-list"),
    path("collaborateurs/<int:pk>/", CollaborateurDetailAPIView.as_view(), name="collaborateurs-detail"),

    # RH KPI
    path("rh/kpi/", RHKpiView.as_view(), name="rh-kpi"),
]