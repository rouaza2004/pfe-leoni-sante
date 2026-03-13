from django.urls import path
from .views import (
    MyTokenObtainPairView,
    MeView,
    CollaborateurListAPIView,
    CollaborateurDetailAPIView,
    CollaborateurProfilAPIView,
    RHKpiView,
)

urlpatterns = [
    path("auth/login/", MyTokenObtainPairView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    path("collaborateurs/", CollaborateurListAPIView.as_view(), name="collaborateurs-list"),
    path("collaborateurs/<int:pk>/", CollaborateurDetailAPIView.as_view(), name="collaborateurs-detail"),
    path("collaborateurs/matricule/<str:matricule>/", CollaborateurProfilAPIView.as_view(), name="collaborateurs-profil-matricule"),
    path("rh/kpi/", RHKpiView.as_view(), name="rh-kpi"),
]